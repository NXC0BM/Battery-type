import json
from pathlib import Path
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3,landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
OUT=Path('submission'); schemas=json.loads((OUT/'schema.json').read_text(encoding='utf-8'))
def save(d,path):
 for marker in list(d._element.body):
  if marker.tag==qn('w:p') and ''.join(marker.itertext()).startswith('__TASK_PAGE_BREAK__'):
   following=marker.getnext()
   if following is not None:
    props=following.find(qn('w:pPr'))
    if props is None:props=OxmlElement('w:pPr');following.insert(0,props)
    br=OxmlElement('w:pageBreakBefore');props.append(br)
   marker.getparent().remove(marker)
 for root in [d._element,d.styles.element]:
  for border in list(root.iter(qn('w:pBdr'))):border.getparent().remove(border)
  for fonts in root.iter(qn('w:rFonts')):
   for key in list(fonts.attrib):
    if key.endswith('Theme'):del fonts.attrib[key]
   for key in ['ascii','hAnsi','eastAsia','cs']:fonts.set(qn('w:'+key),'Times New Roman')
 for para in d.paragraphs:
  for run in para.runs:run.font.name='Times New Roman';run.font.color.rgb=RGBColor(0,0,0)
 d.save(path)
def new_doc(title):
 d=Document();s=d.sections[0];s.page_width=Cm(21);s.page_height=Cm(29.7);s.top_margin=Cm(2);s.bottom_margin=Cm(2);s.left_margin=Cm(3);s.right_margin=Cm(1)
 for name in ['Normal','Title','Heading 1','Heading 2','Heading 3']:
  st=d.styles[name];st.font.name='Times New Roman';st.font.size=Pt(14);st.font.color.rgb=RGBColor(0,0,0);st.paragraph_format.space_after=Pt(6)
  st.paragraph_format.line_spacing=1.5;st.paragraph_format.first_line_indent=Cm(0 if name!='Normal' else 1.25)
 for name in ['Heading 1','Heading 2','Heading 3']:d.styles[name].font.bold=True
 d.styles['Title'].font.size=Pt(16);d.core_properties.author='Рыбин М. А.';d.core_properties.title=title
 footer=s.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
 fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');footer._p.append(fld)
 return d
def p(d,text='',bold=False):
 r=d.add_paragraph();r.add_run(text).bold=bold
 if bold or text.startswith('Таблица '):r.paragraph_format.keep_with_next=True
 return r
def h(d,text,level=1):return d.add_heading(text,level)
def table(d,heads,rows,widths=None,size=11):
 t=d.add_table(rows=1, cols=len(heads));t.style='Table Grid';t.autofit=False
 if widths:
  for col,width in zip(t.columns,widths):col.width=Cm(width)
 for i,head in enumerate(heads):t.rows[0].cells[i].text=head
 for row in rows:
  for cell,text in zip(t.add_row().cells,row):cell.text=str(text)
 for rid,row in enumerate(t.rows):
  for i,cell in enumerate(row.cells):
   if widths:cell.width=Cm(widths[i])
   tcpr=cell._tc.get_or_add_tcPr();shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'FFFFFF');tcpr.append(shade)
   for para in cell.paragraphs:
    para.paragraph_format.first_line_indent=Cm(0);para.paragraph_format.line_spacing=1;para.paragraph_format.space_after=Pt(3)
    para.paragraph_format.keep_with_next=len(t.rows)<=12 and rid<len(t.rows)-1
    for run in para.runs:run.font.size=Pt(size);run.bold=rid==0
  cant=OxmlElement('w:cantSplit');row._tr.get_or_add_trPr().append(cant)
 repeat=OxmlElement('w:tblHeader');t.rows[0]._tr.get_or_add_trPr().append(repeat)
 d.add_paragraph();return t
def page(d):d.add_paragraph('__TASK_PAGE_BREAK__')
def fig(d,name,caption,width=16):
 d.add_picture(str(OUT/'diagrams'/name),width=Cm(width));r=d.add_paragraph(caption);r.alignment=WD_ALIGN_PARAGRAPH.CENTER;r.paragraph_format.first_line_indent=Cm(0)
def title(d,subtitle):
 for text in ['Министерство науки и высшего образования Российской Федерации','Московский государственный технический университет','имени Н. Э. Баумана','Кафедра ИУ5']:
  r=p(d,text);r.alignment=WD_ALIGN_PARAGRAPH.CENTER;r.paragraph_format.first_line_indent=Cm(0)
 p(d);p(d);r=d.add_paragraph('Типы аккумуляторов','Title');r.alignment=WD_ALIGN_PARAGRAPH.CENTER
 r=p(d,subtitle,True);r.alignment=WD_ALIGN_PARAGRAPH.CENTER;p(d);p(d,'Студент группы ИУ5-51Б Рыбин М. А.');p(d,'Руководитель Канев А. И.');p(d);r=p(d,'Москва 2026');r.alignment=WD_ALIGN_PARAGRAPH.CENTER;page(d)
api=[
('1','GET','/api/battery_type','Опубликованные типы; фильтр ёмкости','minCapacityMah?: integer ≥ 0','BatteryTypeDto[]; 200'),
('2','GET','/api/battery_type/feed','Один опубликованный тип; следующий при next=true','id?: integer; next?: boolean','BatteryTypeDto | null; 200/404'),
('3','GET','/api/battery_type/draft','Черновик текущего создателя','Cookie: connect.sid','BatteryTypeDto | null; 200/401'),
('4','POST','/api/battery_type','Создание черновика и загрузка файлов','modelName: string; image?: file; video?: file; Cookie','BatteryTypeDto; 201/400/401'),
('5','PUT','/api/battery_type/:id/publish','Публикация своего черновика','id: integer; shortDescription: string; capacityMah: integer; nominalVoltageV: number; attributes?: array; Cookie','BatteryTypeDto; 200/400/401/403/404'),
('6','DELETE','/api/battery_type/:id','Логическое удаление своего типа','id: integer; Cookie','204; 401/403/404'),
('7','POST','/api/battery_type/:id/like','Поставить или отменить лайк','id: integer; like: 0 | 1; Cookie','BatteryTypeDto; 200/400/401/404'),
('8','POST','/api/users/register','Регистрация специалиста','username: string; password: string','id: integer; username: string; 201'),
('9','POST','/api/users/login','Вход и создание сессии Redis','username: string; password: string','id: integer; Set-Cookie; 200/401'),
('10','POST','/api/users/logout','Выход и удаление сессии Redis','Cookie: connect.sid','ok: boolean; 200')]
(OUT/'api-table.json').write_text(json.dumps(api,ensure_ascii=False,indent=2),encoding='utf-8')
calc=[
'Для расчёта принято 116 пользователей: 16 специалистов ведут каталог аккумуляторов, 100 специалистов подбирают аккумуляторы. За сутки каждый создатель публикует 2 типа аккумуляторов, каждый читатель выполняет 30 просмотров/фильтраций. Рабочий день — 8 ч; 250 рабочих дней в год. Это проектные допущения, а не измеренная статистика.',
'Nтипов = 16 × 2 = 32 типа аккумуляторов в сутки. (1)',
'На полный сценарий работы с одним типом по диаграмме последовательности приходится 8 HTTP-запросов. Для консервативной оценки вход учитывается при каждом сценарии. Запросы медиафайлов в S3 считаются отдельно от API.',
'RPSср = (32 × 8 + 100 × 30) / (8 × 3600) = 0,1131 запроса/с. (2)',
'RPSпик = 0,1131 × 10 = 1,131 запроса/с. Коэффициент пика 10 — допущение. (3)',
'Nядер = max(1; ceil(1,131 × 1,5 / 500)) = 1; ОП = 1 × 4 = 4 ГиБ. (4)',
'500 запросов/с на ядро — условная производительность для учебного расчёта; её нужно подтвердить нагрузочным тестом перед промышленным развёртыванием. Коэффициент резерва CPU — 1,5.',
'Sbattery_type = 4 + 400 + 1020 + 20 + 255 + 255 + 3 × 8 + 2 × 4 + 28 = 2014 байт. (5)',
'Учтены: id; model_name (100 символов × 4 байта UTF-8); short_description (255 × 4); status; два ключа файлов латиницей; три даты; два FK; 28 байт заголовка/выравнивания. Ёмкость и напряжение в основной таблице отсутствуют.',
'Sзначения = 4 + 4 + 4 + 5 + 28 = 45 байт; Sлайка = 4 + 4 + 4 + 28 = 40 байт. (6)',
'Для двух значений (например, 3000 и 3.60) и 10 лайков на тип: Sтип = 2014 + 2 × 45 + 10 × 40 = 2504 байта. 10 лайков — расчётное среднее. (7)',
'N5лет = 32 × 250 × 5 = 40 000 типов аккумуляторов. (8)',
'SБД = (40 000 × 2504 + 116 × 292 + 7 × 562) × 2 / 1024³ = 0,187 ГиБ. (9)',
'292 байта на пользователя: id 4 + логин до 200 + bcrypt 60 + 28; 562 байта на атрибут: id 4 + code 50 + name 400 + unit 80 + 28. Множитель 2 резервирует индексы, служебные данные и выравнивание. Набор дополнительных атрибутов увеличит объём значений.',
'SS3 = 40 000 × (0,5 + 10) / 1024 = 410,156 ГиБ. (10)',
'На тип принято изображение 0,5 МиБ и видео 10 МиБ; файлы хранятся в S3, в PostgreSQL — только ключи. Медиазапросы: 32 × 2 + 100 × 30 × 2 = 6064 GET/PUT в сутки. Без кэша чтение медиа читателями — до 30,76 ГиБ/сутки.',
'Sдиск = (0,187 + 410,156 + 10) × 1,2 = 504,412 ГиБ → 512 ГиБ. (11)',
'Итог учебной оценки: 1 ядро, 4 ГиБ ОП, диск 512 ГиБ на 5 лет. В 10 ГиБ включены Redis и системный запас, 20% оставлены свободными. Резервные копии хранятся отдельно и в этот объём не входят.'
]
# Main report with the technical assignment as appendix.
d=new_doc('Типы аккумуляторов РПЗ и техническое задание');title(d,'Расчётно-пояснительная записка к лабораторным работам 1–5')
h(d,'Архитектура')
p(d,'Система предназначена для публикации и подбора типов аккумуляторов по ёмкости и номинальному напряжению. Гость просматривает опубликованные типы аккумуляторов. Создатель входит в систему, добавляет черновик с изображением и видео, заполняет характеристики и публикует тип аккумулятора. Лайк связывает пользователя и опубликованный тип аккумулятора и не меняет его характеристики.')
p(d,'Серверная часть — одно приложение NestJS с двумя доменами HTTP API: battery_type и users. Внутренний модуль AuthModule реализует аутентификацию, но его методы относятся к URL домена users. PostgreSQL хранит типы аккумуляторов, пользователей, лайки, справочник атрибутов и значения. Redis хранит сессии; MinIO хранит медиафайлы. Фронтенд ЛР5 — отдельное React-приложение на TypeScript с mock-данными.')
p(d,'Поле по теме — характеристика аккумулятора: ёмкость в мА·ч и номинальное напряжение в В. Они перенесены из столбцов battery_type в строки battery_type_attributes. В attributes хранятся названия и единицы измерения характеристик. Название модели, описание, статус, ссылки и системные даты остаются в battery_type; переносить туда все поля услуги не требуется.')
fig(d,'er.png','Рисунок 1 — ER-диаграмма базы данных')
page(d);h(d,'Структура базы данных')
meaning={'battery_type':'Основные сведения и жизненный цикл типа аккумулятора','attributes':'Общий справочник характеристик типов аккумуляторов','battery_type_attributes':'Значения характеристик конкретных типов аккумуляторов','users':'Учётные записи специалистов','likes':'Связи пользователей с понравившимися типами аккумуляторов'}
for i,(name,fields) in enumerate(schemas.items(),1):
 p(d,f'Таблица {i} — {name}. {meaning[name]}',True)
 table(d,['Поле','Тип','Ограничения'],fields,[6.0,5,5],11)
p(d,'Для значений уникальна пара (battery_type_id, attribute_id), для лайков — (user_id, battery_type_id). Отдельные FK в этих парах не уникальны. У создателя может быть не более одного черновика; это обеспечивается частичным уникальным индексом. Все внешние ключи запрещают каскадное удаление. В API удаление типа аккумулятора меняет status на deleted.')
p(d,'При добавлении нового атрибута через БД он появляется у всех типов аккумуляторов с пустым значением. Запрос начинается со справочника attributes и использует LEFT JOIN значений по идентификатору типа. Ёмкость фильтруется в БД после соединения справочника и вертикальной таблицы; числовое сравнение выполняется после проверки формата значения.')
page(d);h(d,'Структура программных компонентов')
fig(d,'classes.png','Рисунок 2 — Диаграмма классов с двумя интерфейсами',16)
p(d,'На общей диаграмме представлены четыре страницы итогового интерфейса, два интерфейса API, десять HTTP-методов, модели и таблицы. В ЛР5 реализованы только плитка и лента; вход и добавление проектируются для ЛР6. Модели BatteryType, Attribute, BatteryTypeAttribute, Like и User соответствуют пяти таблицам PostgreSQL.')
page(d);h(d,'Алгоритмы')
fig(d,'sequence.png','Рисунок 3 — Последовательность HTTP-запросов',15)
p(d,'Три линии жизни отражают фронтенд и два домена одного веб-сервиса. В сообщениях HTTP указаны параметры, а signature связан с операцией домена на диаграмме классов. Внутренние SQL-запросы и хранилища на этой диаграмме не показываются.')
page(d);h(d,'Расчёт аппаратных требований')
for text in calc:p(d,text)
page(d);h(d,'Описание интерфейса')
table(d,['Страница','Назначение и действия'],[
('Плитка battery_type','Гость и создатель просматривают опубликованные типы аккумуляторов и применяют нижнюю границу ёмкости. Нажатие на тип открывает ленту с его id.'),
('Лента battery_type','Видео, название, описание, ёмкость, напряжение и таблица атрибутов. Кнопка Далее открывает следующий опубликованный тип. Гость видит число лайков, создатель может поставить или отменить свой лайк.'),
('Добавление battery_type','Итоговый интерфейс ЛР6: название и файлы → создание черновика; описание, ёмкость и напряжение → публикация. Собственный черновик загружается без id.'),
('Вход users','Итоговый интерфейс ЛР6: логин и пароль, регистрация, вход и выход. Сервер создаёт и удаляет сессию Redis; браузер хранит connect.sid.')],[4.5,11.5],12)
p(d,'Цвета темы: кнопки #FC8507, основной текст #000000, светло-серый фон #EEEEEE. Белый текст поверх тёмного видео сохраняет читаемость. Портретный макет ЛР5 имеет фиксированную ширину 420 px, без переключений по ширине экрана. Адаптивность, PWA и публикация GitHub Pages относятся к ЛР7.')
h(d,'Источники')
for s in ['1. Репозиторий курса РИП: https://github.com/iu5git/Web','2. РПЗ Бромберг ИУ5-54Б: https://github.com/iu5git/Web/tree/main/reports','3. Исходный код: https://github.com/NXC0BM/Battery-type','4. NestJS: https://docs.nestjs.com/','5. PostgreSQL: https://www.postgresql.org/docs/16/','6. TypeORM: https://typeorm.io/','7. React: https://react.dev/','8. Redis: https://redis.io/docs/','9. MinIO: https://github.com/minio/minio']:
 source=p(d,s);source.paragraph_format.line_spacing=1;source.paragraph_format.space_after=Pt(2)
 for run in source.runs:run.font.size=Pt(12)
page(d);h(d,'Приложение А Техническое задание')
h(d,'1 Цель',2)
p(d,'1.1 Необходимо разработать систему, включающую веб-сервис на NestJS и веб-приложение на React, которая позволит специалистам публиковать типы аккумуляторов с их ёмкостью и номинальным напряжением, а пользователям — подбирать типы аккумуляторов по ёмкости, просматривать характеристики и отмечать понравившиеся типы.')
h(d,'2 Назначение разработки',2)
p(d,'2.1 Система предназначена для ведения и просмотра каталога типов аккумуляторов при подборе источника питания. Гость просматривает опубликованные типы и фильтрует их по ёмкости. Создатель публикует сведения о типах аккумуляторов, загружает изображение и видео, удаляет собственные типы и ставит или отменяет лайки. Для учебного расчёта принято 116 пользователей: 16 создателей и 100 читателей каталога.')
h(d,'3 Задачи',2)
tasks=[
'Разработать дизайн трёх страниц в Figma и серверные шаблоны на NestJS, Handlebars, HTML и CSS; подключить MinIO для медиафайлов (ЛР1).',
'Создать PostgreSQL и подключить TypeORM к серверным шаблонам; реализовать создание, публикацию и логическое удаление типов аккумуляторов (ЛР2).',
'Разработать REST API NestJS из десяти HTTP-методов, загрузку медиа в MinIO и проверки коллекцией Postman (ЛР3).',
'Реализовать вход, регистрацию, выход, сессии Redis и Swagger. Для отработки РК перенести ёмкость и напряжение в вертикальную таблицу значений атрибутов (ЛР4).',
'Создать отдельный репозиторий фронтенда React, TypeScript, Vite, React-Bootstrap; реализовать плитку и ленту на mock-данных без Redux и Context (ЛР5).',
'Подключить Axios и Redux Toolkit; реализовать четыре страницы с API, интерфейс создателя и аутентификацию (ЛР6).',
'Добавить адаптивность, PWA и HTTPS через реверс-прокси; обеспечить доступ с телефона к серверу по локальной сети (ЛР7).',
'Разместить демонстрационное React-приложение на GitHub Pages с mock-данными.',
'Подготовить РПЗ, ТЗ, ER, общую диаграмму классов, диаграмму последовательности, расчёт и отчёты со скриншотами в порядке показа.',
'Оформить отдельные репозитории бэкенда и фронтенда на GitHub с ветками лабораторных и инструкциями запуска.'
]
for i,s in enumerate(tasks,1):p(d,f'3.{i} {s}')
page(d);h(d,'4 Функциональные требования',2)
h(d,'4.1 Методы HTTP',3)
for row in api:p(d,f'4.1.{row[0]} {row[1]} {row[2]} — {row[3]}. Вход: {row[4]}. Ответ: {row[5]}.')
p(d,'4.1.11 Общий объект BatteryTypeDto содержит id: integer, modelName: string, shortDescription: string|null, imageUrl: string|null, videoUrl: string|null, capacityMah: integer|null, nominalVoltageV: number|null, likesCount: integer, isMine: 0|1, isLiked: 0|1, attributes: [{id: integer, code: string|null, name: string, value: string, unit: string|null}]. Пустое значение атрибута представляется пустой строкой. Системные поля не принимаются для изменения от клиента.')
p(d,'4.1.12 Гостю доступны чтение опубликованных типов, регистрация и вход. Создание, черновик, публикация, удаление и лайк требуют сессии. Публиковать и удалять можно только собственные типы. Лайк 1 создаёт связь пользователя и опубликованного типа; повторный лайк 1 не создаёт дубликат. Лайк 0 удаляет эту связь. Возврат опубликованного типа в черновик запрещён.')
h(d,'4.2 Меню',3)
p(d,'4.2.1 Внизу расположены четыре пункта: Лента, Добавление, Плитка и Вход. Гостю доступны Лента, Плитка и Вход; создателю — Лента, Добавление, Плитка и Выход. Для этапа ЛР5 доступны только Лента и Плитка, остальные пункты неактивны.')
h(d,'4.3 Окно аутентификации',3)
p(d,'4.3.1 Поля логина и пароля; кнопки регистрации и входа вызывают методы 4.1.8 и 4.1.9. Выход вызывает 4.1.10. Успешный вход создаёт серверную сессию Redis и cookie connect.sid.')
h(d,'4.4 Окно плитки типов аккумуляторов',3)
p(d,'4.4.1 Показать изображение, название и число лайков для каждого опубликованного типа. Поле «Ёмкость от, мА·ч» и кнопка «Показать» вызывают 4.1.1 с minCapacityMah. Выбранная граница сохраняется на странице после запроса. Нажатие на тип вызывает переход к окну 4.5; удаление собственного типа вызывает 4.1.6.')
h(d,'4.5 Окно ленты типов аккумуляторов',3)
p(d,'4.5.1 Получать данные методом 4.1.2. Показать видео, название, описание, ёмкость, напряжение, лайки и в нижней части таблицу «Характеристика — Значение». Кнопка «Далее» вызывает 4.1.2 с текущим id и next=true. Лайк создателя вызывает 4.1.7 с like=1 либо like=0. Для отсутствующих или недоступных медиа использовать локальные файлы по умолчанию.')
h(d,'4.6 Окно добавления типа аккумулятора',3)
p(d,'4.6.1 При открытии загрузить собственный черновик методом 4.1.3. Если черновика нет, ввести название, изображение и видео; кнопка «Далее» вызывает 4.1.4. Затем ввести описание, ёмкость и напряжение; кнопка «Опубликовать» вызывает 4.1.5. В нижней части показывается таблица атрибутов; общие названия редактируются в БД. Ёмкость и напряжение сохраняются как значения атрибутов. На этапе ЛР5 страница неактивна.')
h(d,'5 Требования к техническим средствам',2)
p(d,'5.1 Сервер: не менее 1 ядра CPU, 4 ГиБ ОП, 512 ГиБ диска на 5 лет при допущениях расчёта для 116 пользователей. Сетевой канал выбирается с учётом размера и одновременной передачи видео; средний объём медиа без кэша — до 30,76 ГиБ за рабочий день. Резервные копии размещаются отдельно.')
p(d,'5.2 Клиент: компьютер с современным браузером, доступом к сети и поддержкой HTML5 video. Для демонстрации ЛР1–5 требуется область просмотра шириной не менее 420 px; адаптивный интерфейс разрабатывается в ЛР7.')
h(d,'6 Требования к программному обеспечению',2)
p(d,'6.1 Сервер: Windows и Docker Desktop либо Linux; Node.js 22/24 LTS, NestJS 10, TypeScript 5, PostgreSQL 16, Redis 7, MinIO S3. Точные версии TypeORM, express-session и connect-redis фиксируются в package-lock.json.')
p(d,'6.2 Фронтенд: React 18, TypeScript 5, Vite 5, React-Bootstrap 2, react-router-dom 6. Проверка API — Postman; диаграммы — StarUML. Клиент: Chromium 120+ или Firefox 120+ с cookie и JavaScript.')
page(d);h(d,'Приложение Б Методы веб-сервиса')
p(d,'Домен battery_type',True)
table(d,['№','Метод и URL','Описание','Вход','Выход'],[(r[0],r[1]+' '+r[2],r[3],r[4],r[5]) for r in api[:7]],[.6,4.4,3.4,4.1,3.5],10)
p(d,'Домен users',True)
table(d,['№','Метод и URL','Описание','Вход','Выход'],[(r[0],r[1]+' '+r[2],r[3],r[4],r[5]) for r in api[7:]],[.6,4.4,3.4,4.1,3.5],10)
p(d,'Cookie: connect.sid=<значение сессии>. В Postman заголовок Cookie должен быть включён галочкой. Для JSON включён Content-Type: application/json. Для form-data Content-Type формирует сам Postman с boundary; задавать его вручную нельзя.')
save(d,OUT/'РПЗ_и_ТЗ_исправлено.docx')
# A single-page calculation (compact typesetting, no title page).
c=new_doc('Расчёт аппаратных требований для 116 пользователей');c.styles['Normal'].font.size=Pt(10);c.styles['Normal'].paragraph_format.line_spacing=1;c.styles['Normal'].paragraph_format.space_after=Pt(4);c.styles['Normal'].paragraph_format.first_line_indent=Cm(0)
r=c.add_paragraph('Расчёт аппаратных требований','Title');r.alignment=WD_ALIGN_PARAGRAPH.CENTER
for text in calc:p(c,text)
save(c,OUT/'Расчёт_116_пользователей.docx')
# A3: concrete example values, with original and three resulting tables.
pdfmetrics.registerFont(TTFont('Arial','C:/Windows/Fonts/arial.ttf'));pdfmetrics.registerFont(TTFont('ArialBold','C:/Windows/Fonts/arialbd.ttf'))
cv=canvas.Canvas(str(OUT/'А3_перенос_ёмкости_и_напряжения.pdf'),pagesize=landscape(A3));W,H=landscape(A3)
def text(x,y,s,size=13,b=False):cv.setFont('ArialBold' if b else 'Arial',size);cv.drawString(x,y,s)
def pdf_table(x,y,title,heads,rows,widths,rowh=27):
 text(x,y,title,15,True);y-=18
 for ri,row in enumerate([heads]+rows):
  xx=x
  for s,w in zip(row,widths):
   cv.rect(xx,y-rowh,w,rowh);cv.setFont('ArialBold' if ri==0 else 'Arial',10)
   cv.drawString(xx+5,y-rowh+9,str(s));xx+=w
  y-=rowh
 return y
text(35,H-35,'Перенос полей по теме в таблицы атрибутов',22,True)
text(35,H-60,'Пример: те же два типа аккумуляторов и те же значения до и после преобразования',13)
before=[['id','1','2'],['model_name','LG HG2 18650','Panasonic NCR18650B'],['short_description','Li-ion 18650','Li-ion 18650'],['status','published','published'],['image_url','acc-lg-hg2.jpg','acc-panasonic-ncr18650b.jpg'],['video_url','acc-lg-hg2.mp4','acc-panasonic-ncr18650b.mp4'],['capacity_mah','3000','3350'],['nominal_voltage_v','3.60','3.60'],['created_at','2026-11-01 10:00','2026-11-01 10:05'],['published_at','2026-11-01 10:10','2026-11-01 10:15'],['completed_at','NULL','NULL'],['creator_id','1','1'],['moderator_id','NULL','NULL']]
pdf_table(35,H-105,'ДО   battery_type',['Поле','Запись 1','Запись 2'],before,[145,175,215],21)
after=[r for r in before if r[0] not in ['capacity_mah','nominal_voltage_v']]
pdf_table(610,H-105,'ПОСЛЕ   1. battery_type',['Поле','Запись 1','Запись 2'],after,[145,175,215],21)
lefty=H-445
pdf_table(35,lefty,'2. attributes — название характеристики',['id','code','name','unit'],[['1','capacity_mah','Ёмкость','мА·ч'],['2','nominal_voltage_v','Напряжение','В']],[35,180,140,60])
pdf_table(610,lefty,'3. battery_type_attributes — значения',['id','battery_type_id','attribute_id','value'],[['1','1','1','3000'],['2','1','2','3.60'],['3','2','1','3350'],['4','2','2','3.60']],[35,150,140,80])
y=190
for line in ['battery_type.id  1 → много  battery_type_attributes.battery_type_id; attributes.id  1 → много  battery_type_attributes.attribute_id.',
             'Строка (1, 1, 3000): ёмкость LG HG2 равна 3000 мА·ч. Строка (2, 1, 3350): ёмкость Panasonic равна 3350 мА·ч.',
             'Названия и единицы общие; значения индивидуальны. UNIQUE (battery_type_id, attribute_id). Все FK: RESTRICT.',
             'Новый атрибут «Масса» виден у всех аккумуляторов. Нет строки значения → пустая ячейка (LEFT JOIN).',
             'Фильтр: JOIN по attribute_id, code=capacity_mah; value проверяется и сравнивается как число ≥ границы.',
             'Три таблицы ПОСЛЕ относятся к аккумуляторам и атрибутам. users и likes сохраняются отдельно.']:
 text(35,y,line,11);y-=23
cv.save();print('Created RПЗ/ТЗ, calculation, A3')
