const assert = require('node:assert/strict');
const fs = require('node:fs');
require('dotenv').config();
const { Client } = require('pg');
const base='http://127.0.0.1:53000/api';
const evidence=[]; let cookie='';
async function call(method,path,body,expected=200,auth=true){
 const headers={}; if(auth&&cookie)headers.Cookie=cookie;
 if(body && !(body instanceof FormData))headers['Content-Type']='application/json';
 const response=await fetch(base+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
 const raw=await response.text(); let data;try{data=JSON.parse(raw)}catch{data=raw}
 evidence.push({method,path,status:response.status,data});
 assert.equal(response.status,expected,JSON.stringify(data));
 const setCookie=response.headers.get('set-cookie'); if(setCookie&&auth)cookie=setCookie.split(';')[0];
 return data;
}
async function main(){
 const user={username:'battery_type_'+Date.now(),password:'battery-local-2026'};
 await call('POST','/users/register',user,201);
 await call('POST','/users/login',user);
 const form=new FormData();form.set('modelName','LG HG2 18650');
 form.set('image',new Blob([fs.readFileSync('public/img/default-accumulator.jpg')],{type:'image/jpeg'}),'battery_type.jpg');
 form.set('video',new Blob([fs.readFileSync('public/img/default-accumulator.mp4')],{type:'video/mp4'}),'battery_type.mp4');
 const draft=await call('POST','/battery_type',form,201);
 assert.equal((await call('GET','/battery_type/draft')).id,draft.id);
 const payload={shortDescription:'Li-ion аккумулятор 18650 для электроинструмента',capacityMah:3000,nominalVoltageV:3.6};
 await call('PUT',`/battery_type/${draft.id}/publish`,payload,401,false);
 const published=await call('PUT',`/battery_type/${draft.id}/publish`,payload);
 assert.equal(published.capacityMah,3000);assert.equal(published.nominalVoltageV,3.6);
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
 try {
 const cols=await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='battery_type'");
 assert(!cols.rows.some(x=>['capacity_mah','nominal_voltage_v'].includes(x.column_name)));
 const values=await db.query('SELECT a.code,v.value FROM attributes a JOIN battery_type_attributes v ON v.attribute_id=a.id WHERE v.battery_type_id=$1',[draft.id]);
 assert.equal(values.rows.length,2);
 const attr=await db.query("INSERT INTO attributes(name,unit) VALUES ($1,'г') RETURNING id",['Масса_'+Date.now()]);
 const feed=await call('GET',`/battery_type/feed?id=${draft.id}`);assert.equal(feed.attributes.find(a=>a.id===attr.rows[0].id).value,'');
 evidence.push({check:'topic_values_in_vertical_table',rows:values.rows});
 }finally{await db.end()}
 assert((await call('GET','/battery_type?minCapacityMah=3000')).some(x=>x.id===draft.id));
 assert(!(await call('GET','/battery_type?minCapacityMah=3001')).some(x=>x.id===draft.id));
 const a=await call('POST',`/battery_type/${draft.id}/like`,{like:1});assert.equal(a.isLiked,1);assert.equal(a.likesCount,1);
 const b=await call('POST',`/battery_type/${draft.id}/like`,{like:1});assert.equal(b.likesCount,1);
 const c=await call('POST',`/battery_type/${draft.id}/like`,{like:0});assert.equal(c.isLiked,0);assert.equal(c.likesCount,0);
 await call('POST',`/battery_type/${draft.id}/like`,{like:2},400);
 await call('GET','/battery_type?minCapacityMah=wrong',undefined,400);
 await call('GET','/battery_type/feed');await call('GET',`/battery_type/feed?id=${draft.id}&next=true`);
 await call('POST','/users/logout');
 await call('GET','/battery_type/draft',undefined,401);
 await call('GET','/battery_type',undefined,200,false);
 await call('POST','/users/login',user);
 const form2=new FormData();form2.set('modelName','Удаляемый тип аккумулятора');
 const removable=await call('POST','/battery_type',form2,201);
 await call('DELETE',`/battery_type/${removable.id}`,undefined,204);
 await call('GET',`/battery_type/feed?id=${removable.id}`,undefined,404);
 fs.mkdirSync('../submission/evidence',{recursive:true});
 fs.writeFileSync('../submission/evidence/api-verification.json',JSON.stringify({date:new Date().toISOString(),checks:'PASS',evidence},null,2));
 console.log('PASS: перенос полей, фильтр, пустые атрибуты, файлы S3, авторизация, идемпотентный лайк, удаление');
}
main().catch(error=>{console.error(error);fs.mkdirSync('../submission/evidence',{recursive:true});fs.writeFileSync('../submission/evidence/api-failure.json',JSON.stringify(evidence,null,2));process.exitCode=1});
