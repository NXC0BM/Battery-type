require('dotenv').config();const {createClient}=require('redis');
(async()=>{const redis=createClient({url:process.env.REDIS_URL});await redis.connect();try{
 const sessions=[];for(const key of await redis.keys('sess:*')){const raw=await redis.get(key);if(!raw)continue;const session=JSON.parse(String(raw));sessions.push({session:key.slice(0,13)+'…',userId:session.userId??null,ttlSeconds:await redis.ttl(key)});}
 const feeds=[];for(const key of await redis.keys('battery_type:feed:*')){if(key.endsWith(':lock'))continue;const raw=await redis.get(key);if(!raw)continue;const state=JSON.parse(String(raw));feeds.push({key:key.slice(0,26)+'…',count:state.ids.length,position:state.cursor+1,batch:state.batch,ids:state.ids});}
 console.log(JSON.stringify({sessions,feeds},null,2));
 }finally{await redis.quit();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
