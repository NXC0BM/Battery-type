require('dotenv').config();
const {Client}=require('pg');const fs=require('fs');
(async()=>{
 const db=new Client({host:process.env.DB_HOST,port:+(process.env.DB_PORT||5432),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});
 await db.connect();
 try{
  const legacy=await db.query("SELECT to_regclass('accumulators') AS name");
  if(legacy.rows[0].name)await db.query(fs.readFileSync('migrations/001_rename_accumulators_to_battery_type.sql','utf8'));
  for(const file of ['002_attributes_eav.sql','003_move_topic_fields.sql']){
   await db.query(fs.readFileSync('migrations/'+file,'utf8'));console.log(file+' OK');
  }
 }finally{await db.end()}
})().catch(error=>{console.error(error.message);process.exitCode=1});
