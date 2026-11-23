require('dotenv').config();
const {Client}=require('pg'),bcrypt=require('bcrypt');
(async()=>{
 if(process.env.DB_DATABASE!=='battery_type_review')throw Error('Only isolated battery_type_review permitted');
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
 try{
 await db.query(`INSERT INTO users(username,password) VALUES($1,$2) ON CONFLICT(username) DO NOTHING`,['battery_type_demo',await bcrypt.hash('BatteryType2026!',10)]);
 const user=(await db.query(`SELECT id FROM users WHERE username='battery_type_demo'`)).rows[0].id;
 await db.query('BEGIN');
 await db.query(`INSERT INTO battery_type(model_name,short_description,short_description_en,status,creator_id,published_at)
 SELECT 'LAB8-'||lpad(n::text,6,'0'),'Синтетическая запись аккумулятора для проверки индексов, не паспорт изделия.',
 (ARRAY['Green cylindrical lithium ion battery cell for portable power tools.','Blue rectangular lithium polymer battery pack for a small drone.','Silver cylindrical rechargeable nickel metal hydride AA battery cell.','Black rectangular lithium ion battery pack for a portable computer.'])[1+(n%4)],'published',$1,now()
 FROM generate_series(1,100100) n WHERE NOT EXISTS(SELECT 1 FROM battery_type WHERE model_name='LAB8-'||lpad(n::text,6,'0'))`,[user]);
 for(const [code,expr] of [['capacity_mah',"(1000+(substring(b.model_name,6)::int%5000))::text"],['nominal_voltage_v',"'3.60'"]]){
 await db.query(`INSERT INTO battery_type_attributes(battery_type_id,attribute_id,value)
 SELECT b.id,a.id,${expr} FROM battery_type b CROSS JOIN attributes a WHERE b.model_name LIKE 'LAB8-%' AND a.code=$1
 ON CONFLICT(battery_type_id,attribute_id) DO NOTHING`,[code]);}
 await db.query('COMMIT');await db.query('ANALYZE battery_type');await db.query('ANALYZE battery_type_attributes');
 console.log(JSON.stringify((await db.query(`SELECT count(*) AS total,count(*) FILTER(WHERE model_name LIKE 'LAB8-%') AS synthetic FROM battery_type`)).rows[0]));
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
