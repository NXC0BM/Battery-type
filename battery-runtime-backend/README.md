# AMPHOUR — REST API (ЛР3)

REST API сервис для учёта аккумуляторов: карточки-черновики, публикация, лента, лайки, мягкое удаление. Хранение данных — PostgreSQL (TypeORM), файлы изображений/видео — MinIO.

## Таблицы базы данных

### accumulators

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
| accumulator_id | FK → accumulators.id | какой карточке |

Уникальность пары (user_id, accumulator_id) не даёт одному пользователю лайкнуть карточку дважды.

## Методы сервисов

### AccumulatorsService

| Метод | Через что | Описание |
|---|---|---|
| `findPublished(minCapacityMah?)` | ORM (QueryBuilder) | список опубликованных карточек, фильтр по ёмкости, подсчёт лайков подзапросом |
| `getFeedItem(id?, next?)` | raw SQL (курсор) | одна карточка ленты — текущая или следующая по id |
| `getDraft()` | ORM | черновик текущего пользователя |
| `createDraft(modelName, imageFile?, videoFile?)` | ORM + MinIO | создаёт черновик, загружает файлы в MinIO |
| `publish(id, shortDescription, capacityMah, nominalVoltageV)` | ORM | переводит черновик в статус published |
| `remove(id)` | raw SQL (курсор, UPDATE) | мягкое удаление — статус meняется на deleted; доступно только владельцу карточки |
| `setLike(accumulatorId, like)` | ORM | ставит/снимает лайк, с проверкой текущего состояния |

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

### Accumulators (`/api/accumulators`)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/accumulators` | список опубликованных, фильтр `?minCapacityMah=` |
| GET | `/api/accumulators/feed` | лента, параметры `?id=&next=true` |
| GET | `/api/accumulators/draft` | черновик текущего пользователя |
| POST | `/api/accumulators` | создать черновик (`form-data`: `modelName`, `image`, `video`) |
| PUT | `/api/accumulators/:id/publish` | опубликовать черновик |
| DELETE | `/api/accumulators/:id` | удалить (только своё) |
| POST | `/api/accumulators/:id/like` | поставить/снять лайк (`{ "like": 0 \| 1 }`) |

## Хранение файлов

Картинки и видео загружаются в MinIO (бакет `bucket1`). В БД хранится только имя файла (ключ), полный URL собирается сервисом `MinioService.buildUrl(key)` при формировании ответа API.
