import json,copy,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path('submission');project=json.loads((root/'WEB_ALL_IN_ONE_fixed.mdj').read_text(encoding='utf-8'))
seq=0
def uid():
 global seq;seq+=1;return f'LAB8EXT{seq:07d}'
def ref(x):return {'$ref':x['_id']}
def obj(t,parent,**kw):return {'_type':t,'_id':uid(),'_parent':ref(parent),**kw}
model=obj('UMLModel',project,name='Развёртывание и прецеденты ЛР8',ownedElements=[]);project['ownedElements'].append(model)
def font(n=23,b=False):return ImageFont.truetype('C:/Windows/Fonts/arial'+('bd' if b else '')+'.ttf',n)
def diagram(name,t):
 d=obj(t,model,name=name,ownedViews=[]);model['ownedElements'].append(d);return d
def label(v,text,x,y,w):
 l=obj('LabelView',v,text=text,left=x,top=y,width=w,height=30,font='Arial;16;0',horizontalAlignment=2);v.setdefault('subViews',[]).append(l);return l
def entity(d,name,x,y,w,h,t='UMLNode',vt='UMLNodeView'):
 e=obj(t,model,name=name);model['ownedElements'].append(e)
 v=obj(vt,d,model=ref(e),left=x,top=y,width=w,height=h,font='Arial;16;0',subViews=[])
 if vt=='UMLUseCaseView' or vt=='UMLActorView':v['nameLabel']=ref(label(v,name,x,y+h//2-15,w))
 else:
  comp=obj('UMLNameCompartmentView',v,model=ref(e),left=x,top=y,width=w,height=h,subViews=[])
  for key,text in [('nameLabel',name),('stereotypeLabel',''),('namespaceLabel',''),('propertyLabel','')]:
   l=label(comp,text,x+5,y+20,w-10);l['visible']=key=='nameLabel';comp[key]=ref(l)
  v['subViews'].append(comp);v['nameCompartment']=ref(comp)
 d['ownedViews'].append(v);return e,v
def edge(d,a,b,name,draw,p1,p2):
 r=obj('UMLDependency',model,name=name,source=ref(a[0]),target=ref(b[0]));model['ownedElements'].append(r)
 v=obj('UMLDependencyView',d,model=ref(r),tail=ref(a[1]),head=ref(b[1]),points=f'{p1[0]}:{p1[1]};{p2[0]}:{p2[1]}');d['ownedViews'].append(v)
 draw.line((*p1,*p2),fill='black',width=3);theta=math.atan2(p2[1]-p1[1],p2[0]-p1[0])
 for q in [-.4,.4]:draw.line((*p2,p2[0]-15*math.cos(theta+q),p2[1]-15*math.sin(theta+q)),fill='black',width=3)
 if name:draw.text(((p1[0]+p2[0])/2+8,(p1[1]+p2[1])/2-28),name,font=font(20),fill='black')
d=diagram('Развёртывание ЛР8','UMLDeploymentDiagram');im=Image.new('RGB',(1600,1100),'white');dr=ImageDraw.Draw(im);dr.text((35,20),'Развёртывание системы battery_type',font=font(30,True),fill='black')
nodes={}
for name,x,y,w,h in [('Браузер React / PWA',50,130,420,110),('Tauri + CLIP Web Worker',50,350,420,110),('NestJS API :53000',650,240,450,130),('Python asyncio :53002',650,580,450,110),('PostgreSQL 16 :55432',1170,130,390,110),('Redis 7 :56379',1170,360,390,110),('MinIO :59000',1170,590,390,110),('Hugging Face модели CLIP',50,770,450,110)]:
 nodes[name]=entity(d,name,x,y,w,h);dr.rectangle((x,y,x+w,y+h),outline='black',width=3);dr.text((x+15,y+35),name,font=font(24,True),fill='black')
for a,b,name,p1,p2 in [('Браузер React / PWA','NestJS API :53000','HTTP /api; proxy',(470,180),(650,280)),('Tauri + CLIP Web Worker','NestJS API :53000','HTTP LAN IPv4',(470,405),(650,325)),('NestJS API :53000','PostgreSQL 16 :55432','SQL',(1100,270),(1170,190)),('NestJS API :53000','Redis 7 :56379','сессии / лента',(1100,325),(1170,415)),('NestJS API :53000','MinIO :59000','S3',(1080,370),(1170,645)),('NestJS API :53000','Python asyncio :53002','POST task; PUT callback',(875,370),(875,580)),('Tauri + CLIP Web Worker','Hugging Face модели CLIP','HTTPS веса модели',(250,460),(250,770))]:edge(d,nodes[a],nodes[b],name,dr,p1,p2)
dr.text((50,970),'В браузере медиа читаются из MinIO. Asyncio не обращается к БД; результат передаёт HTTP callback.',font=font(23),fill='black')
dr.text((50,1010),'CLIP выполняется на клиенте. Изображение поиска остаётся в памяти клиента.',font=font(23),fill='black');im.save(root/'diagrams/deployment.png')
d=diagram('Прецеденты каталога аккумуляторов','UMLUseCaseDiagram');im=Image.new('RGB',(1600,1100),'white');dr=ImageDraw.Draw(im);dr.text((35,20),'Прецеденты системы battery_type',font=font(30,True),fill='black')
actors={}
for name,x,y in [('Читатель',30,230),('Создатель',30,650)]:
 actors[name]=entity(d,name,x,y,280,100,'UMLActor','UMLActorView');dr.ellipse((x+120,y,x+160,y+40),outline='black',width=3);dr.line((x+140,y+40,x+140,y+105),fill='black',width=3);dr.line((x+100,y+65,x+180,y+65),fill='black',width=3);dr.line((x+140,y+105,x+100,y+145),fill='black',width=3);dr.line((x+140,y+105,x+180,y+145),fill='black',width=3);dr.text((x+65,y+160),name,font=font(26,True),fill='black')
dr.rectangle((420,100,1540,1040),outline='black',width=2);dr.text((450,110),'Каталог типов аккумуляторов',font=font(24,True),fill='black')
for i,(name,role) in enumerate([('Фильтровать по ёмкости','Читатель'),('Просматривать характеристики и 3D','Читатель'),('Искать по изображению CLIP','Читатель'),('Войти и выйти','Создатель'),('Создать и опубликовать тип','Создатель'),('Поставить и отменить лайк','Создатель'),('Удалить собственный тип','Создатель')]):
 x,y,w,h=580,170+i*118,830,90;e=entity(d,name,x,y,w,h,'UMLUseCase','UMLUseCaseView');dr.ellipse((x,y,x+w,y+h),outline='black',width=3);dr.text((x+45,y+28),name,font=font(26),fill='black');edge(d,actors[role],e,'',dr,(310,300 if role=='Читатель' else 720),(580,y+45))
im.save(root/'diagrams/usecases.png')
def walk(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
ids=[x['_id'] for x in walk(project) if '_id' in x];assert len(ids)==len(set(ids));assert not {x['$ref'] for x in walk(project) if '$ref' in x}-set(ids)
(root/'WEB_ALL_IN_ONE_fixed.mdj').write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8');print('5 diagrams; references valid')
