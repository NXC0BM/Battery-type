# AMPHOUR — REST API (ЛР3)

REST API сервис для учёта аккумуляторов: карточки-черновики, публикация, лента, лайки, мягкое удаление. Хранение данных — PostgreSQL (TypeORM), файлы изображений/видео — MinIO.

## Таблицы базы данных

### battery_type

| Колонка | Тип | Описание |
|---|---|---|
| id | serial, PK | идентификатор |
| model_name | varchar(100) | название модели |
| short_description | varchar(255), nullable | краткое описание (заполняется при публикации) |
| status | varchar(20) | `draft` / `published` / `deleted` |
| image_url | varchar(255), nullable | ключ файла фото в MinIO |
| video_url | varchar(255), nullable | ключ файла видео в MinIO |
| capacity_mah | integer, nullable | ёмкость, мА·ч |
| nominal_voltage_v | numeric(4,2), nullable | номинальное напряжение, В |
| created_at | timestamp | дата создания |
| published_at | timestamp, nullable | дата публикации |
| creator_id | FK → users.id | владелец карточки |

### users

| Колонка | Тип | Описание |
|---|---|---|
| id | serial, PK | идентификатор |
| username | varchar | имя пользователя |

### likes

| Колонка | Тип | Описание |
|---|---|---|
| id | serial, PK | идентификатор |
| user_id | FK → users.id | кто поставил лайк |
| battery_type_id | FK → battery_type.id | какой карточке |

Уникальность пары (user_id, battery_type_id) не даёт одному пользователю лайкнуть карточку дважды.

### attributes (EAV — атрибуты)

| Поле | Тип | Описание |
|---|---|---|
| id | serial PK | идентификатор атрибута |
| name | varchar(100) unique | название характеристики («Химия», «Масса», …) |
| unit | varchar(20) null | единица измерения |

### battery_type_attributes (EAV — значения, М-М)

| Поле | Тип | Описание |
|---|---|---|
| id | serial PK | идентификатор |
| battery_type_id | int FK → battery_type.id | услуга |
| attribute_id | int FK → attributes.id | атрибут |
| value | varchar(255) | значение атрибута для услуги |

Уникальность (battery_type_id, attribute_id). Миграция: `migrations/002_attributes_eav.sql`.
Атрибуты передаются необязательным массивом `attributes: [{ name, value, unit? }]` в `PUT /api/battery_type/:id/publish`
и возвращаются в карточке ленты (`GET /api/battery_type/feed`) — странице «подробнее об услуге».

## Методы сервисов

### BatteryTypeService

| Метод | Через что | Описание |
|---|---|---|
| `findPublished(minCapacityMah?)` | ORM (QueryBuilder) | список опубликованных карточек, фильтр по ёмкости, подсчёт лайков подзапросом |
| `getFeedItem(id?, next?)` | raw SQL (курсор) | одна карточка ленты — текущая или следующая по id |
| `getDraft()` | ORM | черновик текущего пользователя |
| `createDraft(modelName, imageFile?, videoFile?)` | ORM + MinIO | создаёт черновик, загружает файлы в MinIO |
| `publish(id, shortDescription, capacityMah, nominalVoltageV)` | ORM | переводит черновик в статус published |
| `remove(id)` | raw SQL (курсор, UPDATE) | мягкое удаление — статус meняется на deleted; доступно только владельцу карточки |
| `setLike(batteryTypeId, like)` | ORM | ставит/снимает лайк, с проверкой текущего состояния |

### UsersService

| Метод | Описание |
|---|---|
| `register(username)` | создаёт нового пользователя |
| `login()` | возвращает текущего пользователя (заглушка без авторизации, см. `CurrentUserProvider`) |

## REST API — маршруты

### Users (`/api/users`)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/users/register` | регистрация |
| POST | `/api/users/login` | вход |
| POST | `/api/users/logout` | выход |

### BatteryType (`/api/battery_type`)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/battery_type` | список опубликованных, фильтр `?minCapacityMah=` |
| GET | `/api/battery_type/feed` | лента, параметры `?id=&next=true` |
| GET | `/api/battery_type/draft` | черновик текущего пользователя |
| POST | `/api/battery_type` | создать черновик (`form-data`: `modelName`, `image`, `video`) |
| PUT | `/api/battery_type/:id/publish` | опубликовать черновик |
| DELETE | `/api/battery_type/:id` | удалить (только своё) |
| POST | `/api/battery_type/:id/like` | поставить/снять лайк (`{ "like": 0 \| 1 }`) |

## Хранение файлов

Картинки и видео загружаются в MinIO (бакет `bucket1`). В БД хранится только имя файла (ключ), полный URL собирается сервисом `MinioService.buildUrl(key)` при формировании ответа API.

## Активные сессии (Redis + Lua)

Сессии хранятся в Redis (connect-redis, ключи `sess:<sid>`). Скрипт `scripts/redis/active_sessions.lua`
обходит ключи через `SCAN`, разбирает JSON сессии и выводит только авторизованные сессии (`userId`) с TTL.

```bash
npm run sessions
# или
docker exec redis redis-cli EVAL "$(cat scripts/redis/active_sessions.lua)" 0
```

Пример вывода:

```
1) "active sessions: 1"
2) "userId=5 | ttl=86400s | sess:abc..."
```
