require('dotenv').config();const fs=require('fs'),assert=require('assert/strict');const {Client}=require('pg');const {createClient}=require('redis');
const BASE=process.env.BATTERY_TYPE_VERIFY_URL||'http://127.0.0.1:53000/api';let cookie='';const results=[];
async function request(path,options={},status=200){const r=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json',Cookie:cookie,...options.headers}});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];assert.equal(r.status,status,await r.clone().text());return status===204?null:r.json();}
(async()=>{
 const first=await request('/battery_type?limit=24&page=1&minCapacityMah=5500');assert.equal(first.items.length,24);assert(first.total>100);assert(first.items.every(i=>i.capacityMah>=5500));
 const second=await request('/battery_type?limit=24&page=2&minCapacityMah=5500');assert(!second.items.some(i=>first.items.some(j=>j.id===i.id)));results.push('Pagination + EAV numeric capacity filter');
 await request('/battery_type?limit=101',{},400);await request('/battery_type?page=0',{},400);results.push('Pagination validation');
 let item=await request('/battery_type/feed');const initialCookie=cookie;const ids=[item.id];for(let i=1;i<100;i++){item=await request('/battery_type/feed?next=true');ids.push(item.id);}assert.equal(new Set(ids).size,100);assert.equal(item.feedPosition,100);
 const redis=createClient({url:process.env.REDIS_URL});await redis.connect();const keys=await redis.keys('battery_type:feed:*');let batch;
 for(const key of keys.filter(k=>!k.endsWith(':lock'))){const value=JSON.parse(String(await redis.get(key)));if(value.ids.includes(ids[0]))batch=value;}
 assert(batch);assert.equal(batch.ids.length,100);results.push('100 unique numbered cards cached in Redis for guest cookie');
 item=await request('/battery_type/feed?next=true');assert.equal(item.feedPosition,1);assert.equal(item.feedBatch,2);assert(!ids.includes(item.id));results.push('New batch after 100, without previous batch cards');
 const before=await request('/battery_type/feed?id='+item.id);const early=await request('/battery_type/feed?id='+item.id);assert.equal(early.rotationX,before.rotationX);
 await new Promise(r=>setTimeout(r,8000));const after=await request('/battery_type/feed?id='+item.id);assert(Math.abs(after.rotationX-(before.rotationX+Math.PI/6)%(2*Math.PI))<1e-8);assert(Math.abs(after.rotationY-(before.rotationY+Math.PI/4)%(2*Math.PI))<1e-8);results.push('Asyncio HTTP callback after 7 seconds, previous-angle formula');
 const payload={rotationX:0,rotationY:0,previousX:after.rotationX,previousY:after.rotationY};
 await request('/battery_type/'+item.id+'/rotation',{method:'PUT',body:JSON.stringify(payload)},401);
 await request('/battery_type/'+item.id+'/rotation',{method:'PUT',headers:{'x-battery-type-key':'battery8'},body:JSON.stringify(payload)});
 await request('/battery_type/'+item.id+'/rotation',{method:'PUT',headers:{'x-battery-type-key':'battery8'},body:JSON.stringify(payload)},409);results.push('Callback key + compare-and-set rejects stale update');
 await request('/users/login',{method:'POST',body:JSON.stringify({username:'battery_type_demo',password:'BatteryType2026!'})});
 await request('/battery_type/'+item.id+'/like',{method:'POST',body:'{"like":1}'});const liked=await request('/battery_type/'+item.id+'/like',{method:'POST',body:'{"like":1}'});assert.equal(liked.isLiked,1);await request('/battery_type/'+item.id+'/like',{method:'POST',body:'{"like":0}'});results.push('Session login + idempotent like + cancel');
 await request('/users/logout',{method:'POST',body:'{}'});await request('/battery_type/draft',{},401);results.push('Logout invalidates session');
 const captions=await request('/battery_type/descriptions');assert(captions.length>=4);assert(captions.every(c=>c.description.length>=50&&c.description.length<=100));results.push('English CLIP descriptions 50–100 characters');
 await redis.quit();
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
 let plans={};try{
 assert(process.env.DB_DATABASE==='battery_type_review');
 const total=(await db.query('SELECT count(*)::integer AS n FROM battery_type')).rows[0].n;assert(total>100000);
 const cols=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='battery_type' AND column_name IN ('capacity_mah','nominal_voltage_v')")).rows;assert.equal(cols.length,0);results.push('100000+ rows; topic fields stored only in EAV');
 const query=`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT b.id FROM battery_type b WHERE b.status='published' AND EXISTS (SELECT 1 FROM battery_type_attributes v JOIN attributes a ON a.id=v.attribute_id WHERE v.battery_type_id=b.id AND a.code='capacity_mah' AND CASE WHEN v.value ~ '^[0-9]+([.][0-9]+)?$' THEN v.value::numeric END >= 5900) ORDER BY b.id LIMIT 24`;
 for(const enabled of [true,false]){await db.query('BEGIN');if(!enabled)await db.query('DROP INDEX battery_type_capacity_value_idx');const runs=[];let plan;for(let i=0;i<5;i++){plan=(await db.query(query)).rows[0]['QUERY PLAN'][0];runs.push(plan['Execution Time']);}plans[enabled?'withIndex':'withoutIndex']={medianMs:runs.sort((a,b)=>a-b)[2],runsMs:runs,plan};await db.query('ROLLBACK');}
 results.push('Real EXPLAIN ANALYZE with/without capacity index; index restored by ROLLBACK');
 fs.mkdirSync('../submission/evidence/lab8',{recursive:true});fs.writeFileSync('../submission/evidence/lab8/api.json',JSON.stringify({at:new Date().toISOString(),total,checks:results,rotation:{before,after},plans},null,2));console.log(JSON.stringify({total,checks:results,indexMs:plans.withIndex.medianMs,noIndexMs:plans.withoutIndex.medianMs},null,2));
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
