const fs=require('fs');const file='submission/postman/battery_type.postman_collection.json';const col=JSON.parse(fs.readFileSync(file));
col.info.name='battery_type — исправления и ЛР8';col.info.description='Проверка API battery_type и users; заголовки включены. ЛР8 возвращает список как {items,total,page,limit}. Для next=true должен работать отдельный asyncio-сервис.';
col.item=col.item.filter(x=>x.name!=='ЛР8 — дополнительные методы');
col.item.push({name:'ЛР8 — дополнительные методы',item:[
 {name:'Пагинация по ёмкости',request:{method:'GET',header:[{key:'Accept',value:'application/json',disabled:false}],url:'{{baseUrl}}/battery_type?minCapacityMah=5500&page=2&limit=24'},event:[{listen:'test',script:{type:'text/javascript',exec:['pm.test("Pagination envelope",()=>{const b=pm.response.json();pm.expect(b.page).to.eql(2);pm.expect(b.items.length).to.be.at.most(24);pm.expect(b.items.every(x=>x.capacityMah>=5500)).to.eql(true);});']}}]},
 {name:'Описания для CLIP',request:{method:'GET',header:[],url:'{{baseUrl}}/battery_type/descriptions'},event:[{listen:'test',script:{type:'text/javascript',exec:['pm.test("English descriptions",()=>pm.expect(pm.response.json().every(x=>x.description.length>=50&&x.description.length<=100)).to.eql(true));']}}]},
 {name:'Предел размера страницы',request:{method:'GET',header:[],url:'{{baseUrl}}/battery_type?limit=101'},event:[{listen:'test',script:{type:'text/javascript',exec:['pm.test("HTTP 400",()=>pm.response.to.have.status(400));']}}]}
]});fs.writeFileSync(file,JSON.stringify(col,null,2)+'\n');
