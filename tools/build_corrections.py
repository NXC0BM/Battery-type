from pathlib import Path
exec(Path('tools/build_documents.py').read_text(encoding='utf-8').split('# Main report')[0])
from PIL import Image
import pdfplumber
from pdf2image import convert_from_path
out=Path('submission');qa=out/'qa/final'
# Use the latest rendered report to capture the actual goal and method-table pages.
with pdfplumber.open(qa/'report.pdf') as pdf:
 targets={}
 for i,pg in enumerate(pdf.pages,1):
  t=pg.extract_text() or ''
  if '1 Цель' in t:targets['tz-goal']=i
  if 'Приложение А Техническое задание' in t:targets['tz-cover']=i
  if 'Приложение Б Методы' in t:targets['api-table-proof']=i
for key,num in targets.items():
 im=convert_from_path(str(qa/'report.pdf'),first_page=num,last_page=num,dpi=130,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')[0]
 im.save(out/'evidence/screenshots'/f'{key}.png')
d=new_doc('Исправления замечаний по лабораторным работам')
d.styles['Normal'].paragraph_format.first_line_indent=Cm(0)
d.styles['Normal'].paragraph_format.line_spacing=1.1
d.styles['Normal'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT
# The desktop reference is a sequence of short corrections followed by evidence.
def block(remark,answer,image_path=None,maxheight=18,width=16,extra=None):
 if len(d.paragraphs)>0 or len(d.tables)>0:page(d)
 p(d,remark,True);p(d,answer)
 if image_path:
  im=Image.open(image_path);w,h=im.size
  imagewidth=min(width,maxheight*w/h)
  para=d.add_paragraph();para.alignment=WD_ALIGN_PARAGRAPH.CENTER
  para.add_run().add_picture(str(image_path),width=Cm(imagewidth))
 if extra:p(d,extra)
shots=out/'evidence/screenshots'
block('ЛР5 — удалить адаптивность из пятой лабораторной',
 'Макет имеет фиксированную ширину 420 px. Убраны размеры, зависящие от ширины и высоты окна. Плитка и лента работают на mock-данных. Адаптивность и PWA относятся к ЛР7.',shots/'lab5-01-grid-detail.png',19)
block('Поля по теме — ёмкость и напряжение. Фильтрация по ёмкости',
 'Для аккумулятора указаны ёмкость в мА·ч и номинальное напряжение в В. Фильтр «Ёмкость от» оставляет типы аккумуляторов с ёмкостью не ниже указанной границы. Кнопки — оранжевые, основной текст — чёрный, фон — светло-серый.',shots/'lab5-02-filter-detail.png',18)
block('РК и ЛР4 — перенести два поля по теме в новые таблицы',
 'Ёмкость и напряжение перенесены из battery_type в battery_type_attributes. В attributes хранятся общие названия и единицы характеристик. Проверка выполнена на заполненной таблице; значения сохранены и при повторном запуске миграции.',shots/'migration-proof.png',13,
 extra='Для А3 подготовлены исходная таблица и три таблицы после переноса с одинаковыми аккумуляторами и значениями. Образец: А3_перенос_ёмкости_и_напряжения.pdf. На бумаге остаётся воспроизвести эти данные.')
block('Атрибуты — какие поля услуги там хранятся и зачем нужна таблица',
 'В вертикальной таблице хранятся ёмкость и напряжение конкретного аккумулятора. Название модели, статус, описание, ссылки и системные поля остаются в battery_type. Общий справочник attributes выбирается через LEFT JOIN, поэтому новый атрибут виден у всех типов аккумуляторов даже без значения.',shots/'lab5-03-feed-detail.png',17)
block('ЛР3 — все URL по теме battery_type',
 'Основной домен переименован в /api/battery_type. Вход, выход и регистрация объединены под /api/users. Перечень включает десять HTTP-методов; старые URL accumulators в исправленных ветках заменены.',shots/'api-table-proof.png',19)
block('ЛР3 — что делает метод like',
 'POST /api/battery_type/:id/like с like=1 создаёт связь текущего пользователя с опубликованным типом аккумулятора. Повторный like=1 не создаёт дубликат. like=0 удаляет эту связь. likesCount — общее число лайков; isLiked — признак лайка текущего пользователя.',shots/'like-proof.png',14)
block('ЛР4 — заголовки запросов Postman должны быть включены',
 'В коллекции включены Cookie и Accept, а для JSON — Content-Type: application/json. Для form-data заголовок с boundary формируется Postman. Коллекция проверена через Postman CLI: 24 запроса и 26 проверок, ошибок нет.',shots/'postman-proof.png',13,
 extra='Приведён отчёт фактического запуска CLI. Снимок вкладки Headers из графического интерфейса Postman пока не добавлен.')
block('ER — таблицы, ключи, типы и связи в одном файле StarUML',
 'В модели представлены battery_type, users, likes, attributes и battery_type_attributes. Ёмкость и напряжение убраны из основной таблицы. Для значений уникальна пара battery_type_id и attribute_id. Каскадное удаление запрещено.',out/'diagrams/er.png',17,
 extra='Файл WEB_ALL_IN_ONE_fixed.mdj распознан и открыт приложением StarUML в режиме просмотра. Изображение ниже подготовлено из данных этой модели; это не снимок окна StarUML.')
block('Последовательность — три линии жизни: фронтенд и два бэкенда',
 'Линии жизни: фронтенд, домен users и домен battery_type одного NestJS-приложения. На сообщениях заданы входные данные и ответы. signature запросов связан с операциями общей диаграммы классов.',out/'diagrams/sequence.png',19,
 extra='Изображение подготовлено из модели. Внешние хранилища на этой диаграмме не показаны.')
block('Классы — два интерфейса и одна общая диаграмма',
 'Подготовлена одна диаграмма с интерфейсами API battery_type и API users, четырьмя страницами, десятью HTTP-методами, моделями и таблицами. Точное оформление интерфейсов остаётся сверить после объяснения Никиты.',out/'diagrams/classes.png',18,
 extra='Изображение подготовлено из модели. Файл всех трёх диаграмм — WEB_ALL_IN_ONE_fixed.mdj.')
block('ЛР5 — нужен отдельный репозиторий фронтенда',
 'Создан отдельный репозиторий https://github.com/NXC0BM/Battery-type-frontend. Опубликованы main и battery_type-lab5. В бэкенде сохранены отдельные ветки исправлений ЛР1–3. Outlet Context из фронтенда удалён; локальное состояние хранится в страницах.',shots/'lab5-03-feed-detail.png',17)
block('ТЗ — титульный лист, цель, разделы и нумерация по образцу Бромберга',
 'Добавлен отдельный титульный лист ТЗ по структуре образца. Разделы: цель, назначение, десять задач, функциональные требования, технические средства и программное обеспечение. В функциональных требованиях шесть подпунктов: методы, меню и четыре окна. Лишнее введение в ТЗ удалено.',shots/'tz-cover.png',19)
block('ТЗ — цель и задачи оформить по примеру',
 'Цель описывает систему с веб-сервисом NestJS и фронтендом React для работы с типами аккумуляторов. Задачи перечислены пунктами 3.1–3.10 с технологиями. Адаптивность указана в ЛР7. Не выбранные дополнительные задания в задачи не включены.',shots/'tz-goal.png',19)
block('Расчёт — 116 пользователей по теме и прирост данных за пять лет',
 'Расчёт выполнен для 16 создателей типов аккумуляторов и 100 читателей каталога. Указаны число типов аккумуляторов за день, HTTP-запросы, RPS, ядра, ОП, размеры записей и медиафайлов. Результат учебной оценки: 1 ядро, 4 ГиБ ОП и 512 ГиБ диска.',qa/'calculation/page-1.png',19)
# No unrelated introduction, defence guide, or personal/medical remarks.
save(d,out/'Исправлено_по_замечаниям.docx')
print('Corrections document created, blocks=14')
