import json,copy,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
OUT=Path('submission'); (OUT/'diagrams').mkdir(parents=True,exist_ok=True)
old=json.loads(Path('C:/Users/MAT/Desktop/WEB_ALL_IN_ONE.mdj').read_text(encoding='utf-8-sig'))
def walk(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
objects=list(walk(old)); templates={t:next(x for x in objects if x.get('_type')==t) for t in ['UMLClassView','UMLInterfaceView','UMLSeqLifelineView','UMLSeqMessageView']}
seq=0
def uid():
 global seq;seq+=1;return f'BATTERY{seq:08d}'
def ref(x):return {'$ref':x['_id'] if isinstance(x,dict) else x}
def obj(t,parent=None,**kw):
 x={'_type':t,'_id':uid(),**kw}
 if parent:x['_parent']=ref(parent)
 return x
def clone(x,parent):
 x=copy.deepcopy(x);mapping={a['_id']:uid() for a in walk(x) if '_id' in a}
 for a in walk(x):
  if '_id' in a:a['_id']=mapping[a['_id']]
  if '$ref' in a and a['$ref'] in mapping:a['$ref']=mapping[a['$ref']]
 x['_parent']=ref(parent);return x
project=obj('Project',name='Battery type исправления ЛР1–5',ownedElements=[])
model=obj('UMLModel',project,name='Архитектура battery_type',ownedElements=[]); project['ownedElements'].append(model)
class_d=obj('UMLClassDiagram',model,name='Классы два домена API',ownedViews=[]);model['ownedElements'].append(class_d)
fontpath='C:/Windows/Fonts/arial.ttf';boldpath='C:/Windows/Fonts/arialbd.ttf'
font=lambda n,b=False:ImageFont.truetype(boldpath if b else fontpath,n)
class_img=Image.new('RGB',(1840,1560),'white');draw=ImageDraw.Draw(class_img)
positions={}; views={}
def box_image(d,x,y,w,title,lines,size=19):
 h=46+len(lines)*26; d.rectangle((x,y,x+w,y+h),outline='black',width=2);d.line((x,y+38,x+w,y+38),fill='black',width=2)
 d.text((x+10,y+8),title,font=font(size,True),fill='black')
 for i,s in enumerate(lines):d.text((x+10,y+46+i*26),s,font=font(size-1),fill='black')
 return h
def class_node(name,x,y,w=260,lines=None,t='UMLClass',attributes_mode=False):
 lines=lines or []; c=obj(t,model,name=name,operations=[]);model['ownedElements'].append(c)
 if attributes_mode:
  c['attributes']=[obj('UMLAttribute',c,name=line) for line in lines]
 else:
  for line in lines:c['operations'].append(obj('UMLOperation',c,name=line))
 v=clone(templates['UMLClassView'],class_d);v['_type']='UMLClassView' if t=='UMLClass' else 'UMLInterfaceView';v['model']=ref(c)
 oldx,oldy=v['left'],v['top']; v['left']=x;v['top']=y;v['width']=w;v['height']=46+max(1,len(lines))*24
 # Rebuild compartments, retaining StarUML's native schema.
 subs=[]
 for kind,key,yy,hh in [('UMLNameCompartmentView','nameCompartment',y,34),('UMLAttributeCompartmentView','attributeCompartment',y+34,8),('UMLOperationCompartmentView','operationCompartment',y+42,max(8,len(lines)*24)),('UMLReceptionCompartmentView','receptionCompartment',y+v['height'],0),('UMLTemplateParameterCompartmentView','templateParameterCompartment',y,0)]:
  s=obj(kind,v,model=ref(c),left=x,top=yy,width=w,height=hh,font='Arial;14;0',subViews=[])
  if kind=='UMLNameCompartmentView':
   for label,text,visible in [('stereotypeLabel','«interface»' if t=='UMLInterface' else '',False),('nameLabel',name,True),('namespaceLabel','',False),('propertyLabel','',False)]:
    z=obj('LabelView',s,text=text,visible=visible,left=x+6,top=y+8,width=w-12,height=20,font='Arial;14;1' if label=='nameLabel' else 'Arial;14;0');s['subViews'].append(z);s[label]=ref(z)
  if kind=='UMLOperationCompartmentView':
   for i,op in enumerate(c.get('attributes',[]) if attributes_mode else c['operations']):s['subViews'].append(obj('UMLAttributeView' if attributes_mode else 'UMLOperationView',s,model=ref(op),left=x+8,top=yy+i*24,width=w-16,height=24,font='Arial;13;0'))
  subs.append(s);v[key]=ref(s)
 v['subViews']=subs;v['suppressAttributes']=True;v['suppressReceptions']=True
 if attributes_mode:
  empty=next(s for s in subs if s['_type']=='UMLAttributeCompartmentView')
  filled=next(s for s in subs if s['_type']=='UMLOperationCompartmentView')
  empty['_type']='UMLOperationCompartmentView';filled['_type']='UMLAttributeCompartmentView'
  v['attributeCompartment']=ref(filled);v['operationCompartment']=ref(empty)
  v['suppressAttributes']=False;v['suppressOperations']=True
 if t=='UMLInterface':v['stereotypeDisplay']='label'
 class_d['ownedViews'].append(v);positions[c['_id']]=(x,y,w,v['height']);views[c['_id']]=v
 box_image(draw,x,y,w,name,lines,18)
 return c
pages=[class_node('Плитка battery_type',30,80,280,['GridPage','GET /api/battery_type']),class_node('Лента battery_type',90,230,280,['FeedPage','GET /api/battery_type/feed']),class_node('Добавление battery_type',30,380,280,['ЛР6 планируется','GET draft; POST; PUT publish']),class_node('Вход users',90,530,280,['ЛР6 планируется','POST register/login/logout'])]
battery_ops=['GET /api/battery_type','GET /api/battery_type/feed','GET /api/battery_type/draft','POST /api/battery_type','PUT /api/battery_type/:id/publish','DELETE /api/battery_type/:id','POST /api/battery_type/:id/like']
user_ops=['POST /api/users/register','POST /api/users/login','POST /api/users/logout']
bi=class_node('API battery_type',490,120,360,[],t='UMLInterface');ui=class_node('API users',490,530,360,[],t='UMLInterface')
bc=class_node('Домен battery_type',960,80,820,battery_ops);uc=class_node('Домен users',960,450,820,user_ops)
ops={op['name']:op for c in [bc,uc] for op in c['operations']}
models=[];tables=[]
fields=[['id','modelName','shortDescription','status','imageUrl','videoUrl','createdAt','publishedAt','completedAt','creator','moderator','attributes','likes'],['id','code','name','unit'],['id','batteryType','attribute','value'],['id','user','batteryType'],['id','username','password']]
for i,(name,table) in enumerate([('BatteryType','battery_type'),('Attribute','attributes'),('BatteryTypeAttribute','battery_type_attributes'),('Like','likes'),('User','users')]):
 models.append(class_node(name,30+i*360,830,330,fields[i],attributes_mode=True));tables.append(class_node(table,30+i*360,1370,330))
def arrow(d,a,b,dashed=True):
 x1,y1=a;x2,y2=b
 if dashed:
  length=math.hypot(x2-x1,y2-y1)
  for s in range(0,int(length),12):
   t=s/length;u=min((s+7)/length,1);d.line((x1+(x2-x1)*t,y1+(y2-y1)*t,x1+(x2-x1)*u,y1+(y2-y1)*u),fill='black',width=2)
 else:d.line((x1,y1,x2,y2),fill='black',width=2)
 angle=math.atan2(y2-y1,x2-x1)
 for delta in [-.45,.45]:d.line((x2,y2,x2-13*math.cos(angle+delta),y2-13*math.sin(angle+delta)),fill='black',width=2)
def dependency(a,b,realize=False):
 rel=obj('UMLInterfaceRealization' if realize else 'UMLDependency',model,source=ref(a),target=ref(b));model['ownedElements'].append(rel)
 xa,ya,wa,ha=positions[a['_id']];xb,yb,wb,hb=positions[b['_id']]
 if xb+wb<xa and b not in models:
  pa=(xa,ya+ha/2);pb=(xb+wb,yb+hb/2);points=[pa,pb]
 elif a in [bc,uc] and b in models:
  gutter=1815 if a is bc else 1805
  pa=(xa+wa,ya+ha/2);pb=(xb+wb/2,yb);points=[pa,(gutter,pa[1]),(gutter,760),(pb[0],760),pb]
 elif yb>ya+ha:
  pa=(xa+wa/2,ya+ha);pb=(xb+wb/2,yb);points=[pa,pb]
 else:
  pa=(xa+wa,ya+ha/2);pb=(xb,yb+hb/2);points=[pa,pb]
 edge=obj('UMLInterfaceRealizationView' if realize else 'UMLDependencyView',class_d,model=ref(rel),tail=ref(views[a['_id']]),head=ref(views[b['_id']]),points=';'.join(f'{p[0]}:{p[1]}' for p in points));class_d['ownedViews'].append(edge)
 for start,end in zip(points,points[1:]):arrow(draw,start,end)
for p in pages[:3]:dependency(p,bi)
dependency(pages[3],ui);dependency(bc,bi,True);dependency(uc,ui,True)
for m in models[:4]:dependency(bc,m)
dependency(uc,models[4])
for m,t in zip(models,tables):dependency(m,t)
draw.text((30,15),'Одна диаграмма классов   •   два интерфейса   •   10 методов HTTP',font=font(23,True),fill='black')
draw.text((30,1500),'Страницы входа и добавления показаны как проектируемые для ЛР6; в ЛР5 доступны плитка и лента.',font=font(20),fill='black')
class_img.save(OUT/'diagrams/classes.png')
# ER: native ERD models and views.
erdm=obj('ERDDataModel',project,name='PostgreSQL battery_type',ownedElements=[]);project['ownedElements'].append(erdm)
erd=obj('ERDDiagram',erdm,name='ER атрибуты и значения',ownedViews=[]);erdm['ownedElements'].append(erd)
schemas={
 'battery_type':[('id','INTEGER','PK'),('model_name','VARCHAR(100)',''),('short_description','VARCHAR(255)','NULL'),('status','VARCHAR(20)',''),('image_url','VARCHAR(255)','NULL'),('video_url','VARCHAR(255)','NULL'),('created_at','TIMESTAMP',''),('published_at','TIMESTAMP','NULL'),('completed_at','TIMESTAMP','NULL'),('creator_id','INTEGER','FK'),('moderator_id','INTEGER','FK NULL')],
 'attributes':[('id','INTEGER','PK'),('code','VARCHAR(50)','UQ NULL'),('name','VARCHAR(100)','UQ'),('unit','VARCHAR(20)','NULL')],
 'battery_type_attributes':[('id','INTEGER','PK'),('battery_type_id','INTEGER','FK'),('attribute_id','INTEGER','FK'),('value','VARCHAR(255)','')],
 'users':[('id','INTEGER','PK'),('username','VARCHAR(50)','UQ'),('password','VARCHAR(255)','')],
 'likes':[('id','INTEGER','PK'),('user_id','INTEGER','FK'),('battery_type_id','INTEGER','FK')]}
erimg=Image.new('RGB',(1660,1000),'white');ed=ImageDraw.Draw(erimg);en={};ev={};ep={}
for name,(x,y,w) in {'users':(40,65,450),'battery_type':(610,65,470),'likes':(1190,65,430),'attributes':(40,620,450),'battery_type_attributes':(610,620,600)}.items():
 e=obj('ERDEntity',erdm,name=name,columns=[]);erdm['ownedElements'].append(e);en[name]=e
 for n,t,k in schemas[name]:
  typ=t.split('(')[0];length=t.split('(')[1][:-1] if '(' in t else None
  c=obj('ERDColumn',e,name=n,type=typ,primaryKey='PK' in k,foreignKey='FK' in k,nullable='NULL' in k,unique='UQ' in k)
  if length:c['length']=length
  e['columns'].append(c)
 h=48+len(e['columns'])*28; v=obj('ERDEntityView',erd,model=ref(e),left=x,top=y,width=w,height=h,font='Arial;14;0',subViews=[])
 lab=obj('LabelView',v,text=name,left=x,top=y+8,width=w,height=20,font='Arial;14;1',horizontalAlignment=2);v['subViews'].append(lab);v['nameLabel']=ref(lab)
 comp=obj('ERDColumnCompartmentView',v,model=ref(e),left=x,top=y+36,width=w,height=h-36,subViews=[],font='Arial;14;0')
 for i,c in enumerate(e['columns']):comp['subViews'].append(obj('ERDColumnView',comp,model=ref(c),left=x+8,top=y+42+i*28,width=w-16,height=26,font='Arial;14;0'))
 v['subViews'].append(comp);v['columnCompartment']=ref(comp);erd['ownedViews'].append(v);ev[name]=v;ep[name]=(x,y,w,h)
 box_image(ed,x,y,w,name,[f'{k:7} {n} : {t}' for n,t,k in schemas[name]],18)
for a,b in [('users','battery_type'),('users','likes'),('battery_type','likes'),('battery_type','battery_type_attributes'),('attributes','battery_type_attributes')]:
 rel=obj('ERDRelationship',erdm,identifying=False);rel['end1']=obj('ERDRelationshipEnd',rel,reference=ref(en[a]),cardinality='1');rel['end2']=obj('ERDRelationshipEnd',rel,reference=ref(en[b]),cardinality='0..*');erdm['ownedElements'].append(rel)
 xa,ya,wa,ha=ep[a];xb,yb,wb,hb=ep[b]
 if a=='users' and b=='likes':pa=(xa+wa/2,ya);pb=(xb+wb/2,yb);points=[pa,(pa[0],50),(pb[0],50),pb]
 elif yb>ya+ha:pa=(xa+wa/2,ya+ha);pb=(xb+wb/2,yb);points=[pa,pb]
 else:pa=(xa+wa,ya+ha/2);pb=(xb,yb+hb/2);points=[pa,pb]
 v=obj('ERDRelationshipView',erd,model=ref(rel),tail=ref(ev[a]),head=ref(ev[b]),points=';'.join(f'{p[0]}:{p[1]}' for p in points));erd['ownedViews'].append(v)
 for start,end in zip(points,points[1:]):arrow(ed,start,end,False)
 ed.text(pa,'1',font=font(18),fill='black');ed.text((pb[0]-50,pb[1]-22),'0..*',font=font(18),fill='black')
ed.text((40,15),'ER PostgreSQL   •   ёмкость и напряжение хранятся только в значениях атрибутов',font=font(23,True),fill='black')
ed.text((40,905),'UNIQUE (battery_type_id, attribute_id); UNIQUE (user_id, battery_type_id). Все FK: ON DELETE RESTRICT.',font=font(20),fill='black')
ed.text((40,940),'Один черновик на создателя: UNIQUE (creator_id) WHERE status = draft. moderator_id допускает NULL.',font=font(20),fill='black')
erimg.save(OUT/'diagrams/er.png')
# Sequence, three lifelines; signature points to operations of the single class diagram.
interaction=obj('UMLInteraction',model,name='Публикация и просмотр типа аккумулятора',ownedElements=[]);model['ownedElements'].append(interaction)
sd=obj('UMLSequenceDiagram',interaction,name='Последовательность три линии жизни',ownedViews=[]);interaction['ownedElements'].append(sd)
simg=Image.new('RGB',(1740,1530),'white');dd=ImageDraw.Draw(simg);lifelines=[];lv=[]
for i,(name,c) in enumerate([('Фронтенд',pages[0]),('users — бэкенд',uc),('battery_type — бэкенд',bc)]):
 role=obj('UMLAttribute',interaction,name=name,type=ref(c));interaction['ownedElements'].append(role)
 life=obj('UMLLifeline',interaction,name=name,represent=ref(role));interaction['ownedElements'].append(life);lifelines.append(life)
 v=clone(templates['UMLSeqLifelineView'],sd);dx=110+i*700-v['left'];
 for a in walk(v):
  if 'left' in a:a['left']+=dx
  if 'model' in a:a['model']=ref(life)
  if a.get('_type')=='LabelView' and a.get('visible',True):a['text']=name
 v['height']=1420;v['subViews'][1]['height']=1376;sd['ownedViews'].append(v);lv.append(v)
 x=[185,865,1535][i];dd.rectangle((x-160,55,x+160,105),outline='black',width=2);dd.text((x-145,68),name,font=font(21,True),fill='black')
 for yy in range(105,1470,16):dd.line((x,yy,x,yy+9),fill='black',width=2)
# Put users in the middle, battery at right within canvas.
xs=[185,865,1535]
for i,v in enumerate(lv):
 dx=xs[i]-(v['left']+75)
 for a in walk(v):
  if 'left' in a:a['left']+=dx
steps=[(1,'POST /api/users/login','username, password','200; Set-Cookie'),(2,'GET /api/battery_type','minCapacityMah=3000','200; battery_type[]'),(2,'POST /api/battery_type','modelName, image, video','201; id, draft'),(2,'GET /api/battery_type/draft','Cookie','200; draft, attributes'),(2,'PUT /api/battery_type/:id/publish','id, description, capacityMah=3000, nominalVoltageV=3.6','200; published'),(2,'GET /api/battery_type/feed','без id','200; battery_type, isLiked'),(2,'GET /api/battery_type/feed','id, next=true','200; следующий battery_type'),(2,'POST /api/battery_type/:id/like','id, like=1, Cookie','200; likesCount, isLiked=1')]
for n,(target,op,args,result) in enumerate(steps):
 y=155+n*160
 for reply in [False,True]:
  src,dst=(target,0) if reply else (0,target); yy=y+65 if reply else y
  msg=obj('UMLMessage',interaction,name=result if reply else op,source=ref(lifelines[src]),target=ref(lifelines[dst]),messageSort='reply' if reply else 'synchCall',arguments='' if reply else args)
  if not reply:msg['signature']=ref(ops[op])
  interaction['ownedElements'].append(msg)
  v=clone(templates['UMLSeqMessageView'],sd);v['model']=ref(msg);v['tail']=lv[src]['linePart'];v['head']=lv[dst]['linePart'];v['points']=f'{xs[src]}:{yy};{xs[dst]}:{yy}'
  for a in walk(v):
   if 'model' in a:a['model']=ref(msg)
   if a.get('_type')=='EdgeLabelView':a.update(left=min(xs[src],xs[dst])+12,top=yy-28,width=abs(xs[src]-xs[dst])-24,height=22)
   if a.get('_type')=='UMLActivationView':a.update(left=xs[dst]-7,top=yy,width=14,height=42,visible=not reply)
  sd['ownedViews'].append(v);arrow(dd,(xs[src],yy),(xs[dst],yy),reply)
  label=result if reply else f'{n+1}. {op}'
  dd.text((min(xs[src],xs[dst])+18,yy-26),label,font=font(20),fill='black')
  if not reply:dd.text((210,yy+8),args,font=font(18),fill='black')
dd.text((40,15),'HTTP бизнес-процесс   •   фронтенд и два домена одного NestJS-приложения',font=font(23,True),fill='black')
dd.text((40,1480),'БД, MinIO и Redis не являются линиями жизни. signature сообщений связан с операциями диаграммы классов.',font=font(19),fill='black')
simg.save(OUT/'diagrams/sequence.png')
# Integrity: unique IDs and all references resolve.
allnodes=list(walk(project));ids=[x['_id'] for x in allnodes if '_id' in x];assert len(ids)==len(set(ids))
missing={x['$ref'] for x in allnodes if '$ref' in x}-set(ids);assert not missing,missing
(OUT/'WEB_ALL_IN_ONE_fixed.mdj').write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'schema.json').write_text(json.dumps(schemas,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'api-operations.json').write_text(json.dumps(battery_ops+user_ops,ensure_ascii=False,indent=2),encoding='utf-8')
print('3 diagrams; 2 interfaces; 3 lifelines; 8 signatures; all refs valid')
