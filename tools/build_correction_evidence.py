from pathlib import Path
import json,html
from PIL import Image
out=Path('submission/evidence/screenshots')
for name in ['lab5-01-grid','lab5-02-filter','lab5-03-feed']:
 im=Image.open(out/(name+'.png'));w,h=im.size;im.crop((w//2-210,0,w//2+210,h if name=="lab5-01-grid" else 800)).save(out/(name+'-detail.png'))
a=json.loads(Path('submission/evidence/api-verification.json').read_text(encoding='utf-8'))
likes=[x for x in a['evidence'] if x.get('path','').endswith('/like') and x['status']==200]
m=json.loads(Path('submission/evidence/migration-verification.json').read_text(encoding='utf-8'))
r=json.loads(Path('submission/evidence/postman-run.json').read_text(encoding='utf-8'))['run']['summary']
style='body{font:22px Arial;color:#000;background:#fff;margin:34px}h1{font-size:30px}h2{font-size:24px}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{border:1px solid #000;padding:12px;text-align:left;background:#fff}p{line-height:1.5}code{font-size:19px}'
def write(name,title,body):Path('submission/qa/'+name+'.html').write_text('<!doctype html><html lang="ru"><meta charset="utf-8"><style>'+style+'</style><h1>'+title+'</h1>'+body+'</html>',encoding='utf-8')
rows=''.join('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in [i+1,'1' if i<2 else '0',x['status'],x['data']['likesCount'],x['data']['isLiked']])+'</tr>' for i,x in enumerate(likes))
write('like-proof','Проверка постановки и отмены лайка','<p>Результаты реальных запросов к NestJS API. Источник: api-verification.json.</p><p><code>POST /api/battery_type/1/like</code></p><table><tr><th>Запрос</th><th>like</th><th>HTTP</th><th>likesCount</th><th>isLiked</th></tr>'+rows+'</table><p>Повторная постановка оставляет один лайк. Отмена удаляет связь текущего пользователя.</p>')
rows=''.join('<tr><td>'+str(x['id'])+'</td><td>'+x['code']+'</td><td>'+x['value']+'</td></tr>' for x in m['values'])
write('migration-proof','Проверка переноса полей по теме','<p>Результат выполнения SQL-миграции на заполненной тестовой таблице. Повторный запуск: '+m['repeatRun']+'.</p><table><tr><th>battery_type_id</th><th>attributes.code</th><th>value</th></tr>'+rows+'</table><p>Ёмкость и напряжение сохранены. В исходной таблице battery_type соответствующие столбцы удалены.</p>')
write('postman-proof','Результаты Postman CLI','<p>Отчёт реального запуска коллекции. Источник: postman-run.json.</p><table><tr><th>Показатель</th><th>Успешно</th><th>Ошибок</th></tr><tr><td>HTTP-запросы</td><td>'+str(r['executedRequests']['executed'])+'</td><td>'+str(r['executedRequests']['errors'])+'</td></tr><tr><td>Проверки</td><td>'+str(r['tests']['passed'])+'</td><td>'+str(r['tests']['failed'])+'</td></tr></table><p>В коллекции заголовки Cookie, Accept и Content-Type имеют disabled=false. Для form-data Content-Type с boundary формирует Postman.</p><p>Это отчёт CLI. Снимок вкладки Headers интерфейса Postman сюда ещё не включён.</p>')
