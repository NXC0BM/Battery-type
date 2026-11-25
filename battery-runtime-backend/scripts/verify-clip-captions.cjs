require('dotenv').config({quiet:true});
const {Client}=require('pg'),{validate}=require('class-validator');
const {PublishBatteryTypeDto}=require('../dist/battery_type/dto/publish-battery-type.dto');
const assert=require('assert/strict');
(async()=>{
 const dto=Object.assign(new PublishBatteryTypeDto(),{shortDescription:'Test battery',capacityMah:3000,nominalVoltageV:3.6});
 assert((await validate(dto)).some(e=>e.property==='shortDescriptionEn'));
 dto.shortDescriptionEn='Green cylindrical lithium ion battery cell for portable power tools.';
 assert.equal((await validate(dto)).length,0);
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});
 await db.connect();
 try {
  const row=(await db.query("SELECT count(*)::int AS published,count(*) FILTER (WHERE short_description_en IS NULL OR length(short_description_en) NOT BETWEEN 50 AND 100 OR short_description_en !~ '^[ -~]+$')::int AS invalid FROM battery_type WHERE status='published'")).rows[0];
  assert.equal(row.invalid,0);
  console.log(JSON.stringify({date:new Date().toISOString(),...row,checks:['English caption required by publication DTO','Valid English caption accepted','All published database cards have 50–100 ASCII characters']}));
 } finally {await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
