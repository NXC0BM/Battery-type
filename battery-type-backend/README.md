# Battery Type — battery-runtime-backend (Sprint 1)

Расчёт времени работы устройства от аккумулятора. Бэкенд на NestJS,
коллекция в памяти (без БД), картинки/видео — из Minio.

## Установка

```
npm install
```

## Настройка Minio

Убедитесь, что Minio запущен и в bucket `battery-runtime` (публичный доступ)
загружены файлы с именами, указанными в `src/battery_type/battery_type.service.ts`
(поля `imageKey` / `videoKey`), например `acc-samsung-25r.jpg`.

Если адрес Minio отличается от `http://localhost:9000`, задайте переменную окружения:

```
export MINIO_PUBLIC_URL=http://localhost:9000
```

## Запуск

```
npm run start:dev
```

Откройте:
- http://localhost:3000/battery_type — Плитка
- http://localhost:3000/battery_type/draft — Добавление
- http://localhost:3000/battery_type/feed — Лента

Чистые JSON-эндпоинты (для показа во вкладке Network на защите):
- GET /api/battery_type?minCapacityMah=2000
- GET /api/battery_type/draft
- GET /api/battery_type/:id?next=true

## Структура

```
src/
  battery_type/
    entities/
      battery_type.entity.ts
      battery_type-status.enum.ts
    battery_type.controller.ts
    battery_type.service.ts
    battery_type.module.ts
  minio/
    minio.service.ts
    minio.module.ts
  app.module.ts
  main.ts
views/         — hbs-шаблоны трёх страниц (без JavaScript)
public/        — styles.css (стиль скопирован с dns-shop.ru)
```
