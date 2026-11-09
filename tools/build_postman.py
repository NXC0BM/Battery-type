import json
from pathlib import Path
out=Path('submission/postman');out.mkdir(parents=True,exist_ok=True)
media=Path('C:/Web/Battery-type/battery-runtime-backend/public/img')
def event(lines,listen='test'):return {'listen':listen,'script':{'type':'text/javascript','exec':lines}}
def request(name,method,path,body=None,status=200,auth=True,extra=None):
 headers=[{'key':'Accept','value':'application/json','disabled':False}]
 if auth:headers.append({'key':'Cookie','value':'{{sessionCookie}}','disabled':False})
 r={'name':name,'request':{'method':method,'header':headers,'url':'{{baseUrl}}'+path}}
 if body is not None:
  if isinstance(body,list):r['request']['body']={'mode':'formdata','formdata':body}
  else:r['request']['body']={'mode':'raw','raw':json.dumps(body,ensure_ascii=False),'options':{'raw':{'language':'json'}}};headers.append({'key':'Content-Type','value':'application/json','disabled':False})
 tests=[f'pm.test("HTTP {status}", () => pm.response.to.have.status({status}));']
 tests+=extra or [];r['event']=[event(tests)];return r
login=request('Подготовка — вход','POST','/users/login',{'username':'{{username}}','password':'{{password}}'},extra=['const raw=pm.response.headers.get("Set-Cookie"); if(raw) pm.collectionVariables.set("sessionCookie",raw.split(";")[0]);'])
setup=[request('Подготовка — регистрация','POST','/users/register',{'username':'{{username}}','password':'{{password}}'},201,False),login]
create=request('02 Создать тип аккумулятора с файлами','POST','/battery_type',[{'key':'modelName','value':'LG HG2 18650','type':'text'},{'key':'image','type':'file','src':str(media/'default-accumulator.jpg')},{'key':'video','type':'file','src':str(media/'default-accumulator.mp4')}],201,extra=['pm.collectionVariables.set("batteryTypeId",pm.response.json().id);'])
payload={'shortDescription':'Li-ion аккумулятор 18650 для электроинструмента','capacityMah':3000,'nominalVoltageV':3.6}
lab3=[request('01 Список с фильтром ёмкости','GET','/battery_type?minCapacityMah=3000'),create,request('03 Получить свой черновик','GET','/battery_type/draft'),request('04 Опубликовать тип аккумулятора','PUT','/battery_type/{{batteryTypeId}}/publish',payload),request('05 Лента без id','GET','/battery_type/feed'),request('06 Следующий тип аккумулятора','GET','/battery_type/feed?id={{batteryTypeId}}&next=true'),request('07 Поставить лайк','POST','/battery_type/{{batteryTypeId}}/like',{'like':1},extra=['pm.test("Лайк текущего пользователя",()=>pm.expect(pm.response.json().isLiked).to.eql(1));']),request('08 Удалить свой тип аккумулятора','DELETE','/battery_type/{{batteryTypeId}}',status=204),request('09 Зарегистрировать пользователя','POST','/users/register',{'username':'{{username}}_new','password':'{{password}}'},201,False),login]
# Teacher's lab4 order: login in Swagger first; paste cookie into collection variable.
guest_publish=request('04 Публикация гостем — отказ','PUT','/battery_type/{{lab4DraftId}}/publish',payload,401,False)
# disable cookie jar for guest regardless of previously saved cookies
for req in [guest_publish]:req['protocolProfileBehavior']={'disableCookies':True}
lab4=[request('01 Список без cookie','GET','/battery_type',auth=False),request('02 Список с cookie','GET','/battery_type'),request('03 Создать черновик для публикации','POST','/battery_type',[{'key':'modelName','value':'Samsung INR18650-25R','type':'text'}],201,extra=['pm.collectionVariables.set("lab4DraftId",pm.response.json().id);']),guest_publish,request('05 Публикация создателем — успех','PUT','/battery_type/{{lab4DraftId}}/publish',payload),request('06 Проверить опубликованный тип','GET','/battery_type/feed?id={{lab4DraftId}}')]
lab4[0]['protocolProfileBehavior']={'disableCookies':True}
checks=[request('01 Повторный лайк — один пользователь одна связь','POST','/battery_type/{{lab4DraftId}}/like',{'like':1}),request('02 Ещё раз лайк — счётчик тот же','POST','/battery_type/{{lab4DraftId}}/like',{'like':1}),request('03 Отмена лайка','POST','/battery_type/{{lab4DraftId}}/like',{'like':0},extra=['pm.test("Лайк снят",()=>pm.expect(pm.response.json().isLiked).to.eql(0));']),request('04 Фильтр — неверное число','GET','/battery_type?minCapacityMah=abc',status=400),request('05 Выход','POST','/users/logout'),request('06 Черновик после выхода — отказ','GET','/battery_type/draft',status=401)]
collection={'info':{'name':'battery_type — исправления ЛР3–4','schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json','description':'Папки и запросы пронумерованы в порядке показа. Все пользовательские заголовки включены. Для ЛР4 сначала войдите в Swagger и вставьте connect.sid в sessionCookie. Cookie содержит демонстрационную сессию.'},'variable':[{'key':'baseUrl','value':'http://127.0.0.1:53000/api'},{'key':'username','value':'battery_type_demo'},{'key':'password','value':'battery-local-2026'},{'key':'sessionCookie','value':''},{'key':'batteryTypeId','value':''},{'key':'lab4DraftId','value':''}],'event':[event(['if (!pm.collectionVariables.get("runId")) { const id=Date.now().toString(); pm.collectionVariables.set("runId",id); pm.collectionVariables.set("username","battery_type_"+id); }'],'prerequest')],'item':[{'name':'00 Подготовка окружения','item':setup},{'name':'ЛР3 Порядок показа 10 запросов','item':lab3},{'name':'ЛР4 Порядок показа','item':lab4},{'name':'Проверки лайка и сессии','item':checks}]}
(out/'battery_type.postman_collection.json').write_text(json.dumps(collection,ensure_ascii=False,indent=2),encoding='utf-8')
print('Postman collection created')
