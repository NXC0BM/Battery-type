import json,shutil
from pathlib import Path
root=Path('.');out=Path('submission');schemas=json.loads((out/'schema.json').read_text(encoding='utf-8'));api=json.loads((out/'api-table.json').read_text(encoding='utf-8'))
s=['# battery_type — бэкенд NestJS','', 'Поля темы: ёмкость в мА·ч и номинальное напряжение в В. Фильтрация по минимальной ёмкости. Два домена API: battery_type и users.','', '## Запуск отдельного проверочного окружения','', '```powershell','Copy-Item .env.example .env','docker compose -p battery-type-review -f compose.review.yml up -d','npm ci','npm run review:init','npm run build','npm start','```','', 'Порт API задаётся PORT в .env. Для проверок этого комплекта используется 53000. Swagger: http://127.0.0.1:53000/api/docs. Проверочное окружение использует собственные тома, БД battery_type_review и порты PostgreSQL 55432, Redis 56379, MinIO 59000/59001. Его пароли в .env.example предназначены для локальной демонстрации.','', '## Миграция существующей БД','', 'Сначала сделать резервную копию. Указать подключения в .env и выполнить `npm run migrate`. Runner переименует accumulators при наличии старой таблицы, создаст таблицы атрибутов, перенесёт существующие значения и удалит два прежних столбца. При дубликатах лайков/черновиков миграция прервётся: данные автоматически не удаляются. `synchronize` отключён. Старый scripts/migrate.ts с synchronize не использовать.','', '## Таблицы','']
for name,fields in schemas.items():
 s += ['### '+name,'','| Поле | Тип | Ограничения |','|---|---|---|']+[f'| {n} | {t} | {k} |' for n,t,k in fields]+['']
s+=['Ёмкость и напряжение находятся только в `battery_type_attributes`. `attributes.code`: capacity_mah / nominal_voltage_v; общие названия: Ёмкость / Напряжение. Отсутствие строки значения означает пустое значение. LEFT JOIN начинается от общего справочника, поэтому новый атрибут виден у всех типов.','', 'Ограничения: UNIQUE (battery_type_id, attribute_id), UNIQUE (user_id, battery_type_id), один draft на creator_id. Каскадное удаление запрещено; DELETE API — изменение status на deleted.','', '## HTTP API','', '| Метод | URL | Действие |','|---|---|---|']+[f'| {r[1]} | {r[2]} | {r[3]} |' for r in api]
s+=['', 'Публичны GET списка и ленты, регистрация и вход. Остальные операции с типами требуют Cookie connect.sid; публикация и удаление разрешены только владельцу. POST like принимает 0/1: 1 создаёт связь, 0 удаляет; повторный 1 не создаёт дубликат. В ответе isLiked — текущий пользователь, likesCount — общее количество лайков.','', 'В JSON публикации: shortDescription, capacityMah (integer ≥1), nominalVoltageV (0.01..99.99), attributes? (существующие атрибуты). Системные поля запрещены. При создании используются multipart modelName, image, video.','', '## Проверки','', '```powershell','npm run review:migration','npm run review:verify','```','', 'Запускать проверки только с DB_DATABASE=battery_type_review и отдельным окружением. Отчёты — ../submission/evidence. Postman-коллекция — ../submission/postman/battery_type.postman_collection.json.','', 'Фронтенд ЛР5 подготовлен отдельно в C:/Web/Battery-type-frontend. Адаптивность, PWA, Redux и Tauri в эту ЛР не добавляются.']
Path('battery-runtime-backend/README.md').write_text('\n'.join(s)+'\n',encoding='utf-8')
frontend='''# battery_type — фронтенд ЛР5

Отдельное SPA React 18 + TypeScript 5 + Vite 5 + React-Bootstrap 2.
В ЛР5 доступны плитка и лента на mock-данных. API, Redux и Context не используются.

## Запуск

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 53001
npm run build
```

## Страницы

- `/battery_type`: плитка типов аккумуляторов. Поле «Ёмкость от, мА·ч», кнопка «Показать», изображение, модель и лайки. Нажатие открывает `/battery_type/feed/:id`.
- `/battery_type/feed` и `/battery_type/feed/:id`: лента, видео, описание, ёмкость, напряжение, таблица атрибутов, просмотр лайков и кнопка «Далее».
- Меню из четырёх пунктов: Лента, Добавление, Плитка, Вход. В ЛР5 активны первые и третий; добавление и вход реализуются в ЛР6.

Шаблон фиксированной ширины 420 px и минимальной высоты 800 px. Нет @media и размеров, зависящих от viewport; адаптивность относится к ЛР7. Цвет кнопок #FC8507, текст #000000, фон #EEEEEE; текст поверх видео белый для читаемости.

## Данные и компоненты

`modules/mock.ts` — коллекция типов; `batteryApi.ts` — асинхронные функции выборки mock.
`GridPage` хранит фильтр, список и загрузку в useState. `CapacityFilter` принимает value, setValue, onSubmit, loading через props.
`FeedPage` хранит тип и список в собственном useState; useEffect загружает их при монтировании и смене id. Кнопка «Далее» идёт по общему порядку типов.
Маршрутизация: useParams, useNavigate, useLocation. Outlet используется без context.
`BatteryCard` и `FeedPage` подставляют DefaultImage.jpg и DefaultVideo.mp4, если URL пустой или не загрузился.

## Поля по теме

Ёмкость — capacityMah (мА·ч); напряжение — nominalVoltageV (В). Фильтр выбирает ёмкость не ниже границы.
В итоговой БД эти значения хранятся в вертикальной таблице атрибутов; удобные числовые поля JSON формирует бэкенд. В ЛР5 mock повторяет такое представление ответа.

Бэкенд: https://github.com/NXC0BM/Battery-type
'''
Path('battery-runtime-frontend/README.md').write_text(frontend,encoding='utf-8')
target=Path('C:/Web/Battery-type-frontend');target.mkdir(exist_ok=True)
for f in Path('battery-runtime-frontend').rglob('*'):
 rel=f.relative_to('battery-runtime-frontend')
 if any(x in ['node_modules','dist','.git'] for x in rel.parts):continue
 if f.is_file():dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
Path('.gitignore').write_text('submission/qa/\nnode_modules/\n*.log\n',encoding='utf-8')
Path('README.md').write_text('''# battery_type — исправления замечаний преподавателя

Тема: типы аккумуляторов. Ёмкость и напряжение; фильтр по ёмкости; NestJS.

- `battery-runtime-backend` — исправленный итоговый API ЛР4 и отработки РК.
- `submission/РПЗ_и_ТЗ_исправлено.docx` — РПЗ, три диаграммы, ТЗ из шести разделов, белая таблица десяти методов.
- `submission/Расчёт_116_пользователей.docx` — расчёт на одном листе.
- `submission/А3_перенос_ёмкости_и_напряжения.pdf` — таблицы до и после с конкретными значениями.
- `submission/Замечания_и_порядок_защиты.docx` — ответы на замечания, объяснения атрибутов/лайка, порядок показа.
- `submission/WEB_ALL_IN_ONE_fixed.mdj` — ER, одна диаграмма классов с двумя интерфейсами и последовательность с тремя линиями жизни.
- `submission/postman` — Postman-коллекция с включёнными заголовками и порядком показа.
- `submission/evidence` — результаты реальных проверок и скриншоты.

Локальные ветки этапов: `fixes/lab1`, `fixes/lab2`, `fixes/lab3`; рабочие папки C:/Web/Battery-type-lab1, -lab2, -lab3. Они сохраняют требования соответствующего этапа (без реальной авторизации в ЛР3).
ЛР5 вынесена в отдельный локальный репозиторий C:/Web/Battery-type-frontend. Папка frontend в этой ветке остаётся как исходник изменений для сверки; сдавать фронтенд нужно из отдельного репозитория.

Весь комплект подготовлен локально; факт принятия преподавателем не утверждается. Точное оформление интерфейсов нужно сверить после объяснения Никиты. Личные замечания по посещению занятий не закрываются кодом.
''',encoding='utf-8')
print('Readmes and separate frontend prepared')
