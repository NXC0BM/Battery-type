# battery_type — бэкенд NestJS

Поля темы: ёмкость в мА·ч и номинальное напряжение в В. Фильтрация по минимальной ёмкости. Два домена API: battery_type и users.

## Запуск отдельного проверочного окружения

```powershell
Copy-Item .env.example .env
docker compose -p battery-type-review -f compose.review.yml up -d
npm ci
npm run review:init
npm run build
npm start
```

Порт API задаётся PORT в .env. Для проверок этого комплекта используется 53000. Swagger: http://127.0.0.1:53000/api/docs. Проверочное окружение использует собственные тома, БД battery_type_review и порты PostgreSQL 55432, Redis 56379, MinIO 59000/59001. Его пароли в .env.example предназначены для локальной демонстрации.

## Миграция существующей БД

Сначала сделать резервную копию. Указать подключения в .env и выполнить `npm run migrate`. Runner переименует accumulators при наличии старой таблицы, создаст таблицы атрибутов, перенесёт существующие значения и удалит два прежних столбца. При дубликатах лайков/черновиков миграция прервётся: данные автоматически не удаляются. `synchronize` отключён. Старый scripts/migrate.ts с synchronize не использовать.

## Таблицы

### battery_type

| Поле | Тип | Ограничения |
|---|---|---|
| id | INTEGER | PK |
| model_name | VARCHAR(100) |  |
| short_description | VARCHAR(255) | NULL |
| status | VARCHAR(20) |  |
| image_url | VARCHAR(255) | NULL |
| video_url | VARCHAR(255) | NULL |
| created_at | TIMESTAMP |  |
| published_at | TIMESTAMP | NULL |
| completed_at | TIMESTAMP | NULL |
| creator_id | INTEGER | FK |
| moderator_id | INTEGER | FK NULL |

### attributes

| Поле | Тип | Ограничения |
|---|---|---|
| id | INTEGER | PK |
| code | VARCHAR(50) | UQ NULL |
| name | VARCHAR(100) | UQ |
| unit | VARCHAR(20) | NULL |

### battery_type_attributes

| Поле | Тип | Ограничения |
|---|---|---|
| id | INTEGER | PK |
| battery_type_id | INTEGER | FK |
| attribute_id | INTEGER | FK |
| value | VARCHAR(255) |  |

### users

| Поле | Тип | Ограничения |
|---|---|---|
| id | INTEGER | PK |
| username | VARCHAR(50) | UQ |
| password | VARCHAR(255) |  |

### likes

| Поле | Тип | Ограничения |
|---|---|---|
| id | INTEGER | PK |
| user_id | INTEGER | FK |
| battery_type_id | INTEGER | FK |

Ёмкость и напряжение находятся только в `battery_type_attributes`. `attributes.code`: capacity_mah / nominal_voltage_v; общие названия: Ёмкость / Напряжение. Отсутствие строки значения означает пустое значение. LEFT JOIN начинается от общего справочника, поэтому новый атрибут виден у всех типов.

Ограничения: UNIQUE (battery_type_id, attribute_id), UNIQUE (user_id, battery_type_id), один draft на creator_id. Каскадное удаление запрещено; DELETE API — изменение status на deleted.

## HTTP API

| Метод | URL | Действие |
|---|---|---|
| GET | /api/battery_type | Опубликованные типы; фильтр ёмкости |
| GET | /api/battery_type/feed | Один опубликованный тип; следующий при next=true |
| GET | /api/battery_type/draft | Черновик текущего создателя |
| POST | /api/battery_type | Создание черновика и загрузка файлов |
| PUT | /api/battery_type/:id/publish | Публикация своего черновика |
| DELETE | /api/battery_type/:id | Логическое удаление своего типа |
| POST | /api/battery_type/:id/like | Поставить или отменить лайк |
| POST | /api/users/register | Регистрация специалиста |
| POST | /api/users/login | Вход и создание сессии Redis |
| POST | /api/users/logout | Выход и удаление сессии Redis |

Публичны GET списка и ленты, регистрация и вход. Остальные операции с типами требуют Cookie connect.sid; публикация и удаление разрешены только владельцу. POST like принимает 0/1: 1 создаёт связь, 0 удаляет; повторный 1 не создаёт дубликат. В ответе isLiked — текущий пользователь, likesCount — общее количество лайков.

В JSON публикации: shortDescription, capacityMah (integer ≥1), nominalVoltageV (0.01..99.99), attributes? (существующие атрибуты). Системные поля запрещены. При создании используются multipart modelName, image, video.

## Проверки

```powershell
npm run review:migration
npm run review:verify
```

Запускать проверки только с DB_DATABASE=battery_type_review и отдельным окружением. Отчёты — ../submission/evidence. Postman-коллекция — ../submission/postman/battery_type.postman_collection.json.

Фронтенд ЛР5 подготовлен отдельно в C:/Web/Battery-type-frontend. Адаптивность, PWA, Redux и Tauri в эту ЛР не добавляются.
