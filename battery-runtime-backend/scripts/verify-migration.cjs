require('dotenv').config();
const {Client}=require('pg');const fs=require('fs');const assert=require('assert/strict');
(async()=>{
 if(process.env.DB_DATABASE!=='battery_type_review')throw Error('Только отдельная тестовая БД');
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
 const schema='migration_check_'+Date.now();
 try{
  await db.query(`CREATE SCHEMA ${schema}; SET search_path TO ${schema};
  CREATE TABLE battery_type(id SERIAL PRIMARY KEY,model_name VARCHAR(100),status VARCHAR(20),capacity_mah INTEGER,nominal_voltage_v NUMERIC(4,2),creator_id INTEGER);
  CREATE TABLE likes(id SERIAL PRIMARY KEY,user_id INTEGER,battery_type_id INTEGER);
  INSERT INTO battery_type(model_name,status,capacity_mah,nominal_voltage_v,creator_id) VALUES
  ('LG HG2','published',3000,3.60,1),('Panasonic NCR18650B','published',3350,3.60,1),('Пустой черновик','draft',NULL,NULL,2);`);
  await db.query(fs.readFileSync('migrations/002_attributes_eav.sql','utf8'));
  const sql=fs.readFileSync('migrations/003_move_topic_fields.sql','utf8');await db.query(sql);await db.query(sql);
  const result=await db.query("SELECT b.id,a.code,v.value FROM battery_type b JOIN battery_type_attributes v ON v.battery_type_id=b.id JOIN attributes a ON a.id=v.attribute_id WHERE a.code IS NOT NULL ORDER BY b.id,a.code");
  assert.deepEqual(result.rows.map(x=>[x.id,x.code,x.value]),[[1,'capacity_mah','3000'],[1,'nominal_voltage_v','3.60'],[2,'capacity_mah','3350'],[2,'nominal_voltage_v','3.60']]);
  const columns=await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='battery_type'",[schema]);assert(!columns.rows.some(x=>x.column_name==='capacity_mah'));
  fs.writeFileSync('../submission/evidence/migration-verification.json',JSON.stringify({result:'PASS',schema,repeatRun:'PASS',values:result.rows},null,2));
  console.log('PASS: сохранены 3000/3.60 и 3350/3.60; NULL не стал значением; повторная миграция успешна');
 }finally{await db.end()}
})().catch(e=>{console.error(e);process.exitCode=1});
