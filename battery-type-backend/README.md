# AMPHOUR — battery-runtime-backend (Sprint 1)

Расчёт времени работы устройства от аккумулятора. Бэкенд на NestJS,
коллекция в памяти (без БД), картинки/видео — из Minio.

## Установка

```
npm install
```

## Настройка Minio

Убедитесь, что Minio запущен и в bucket `battery-runtime` (публичный доступ)
загружены файлы с именами, указанными в `src/accumulators/accumulators.service.ts`
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
- http://localhost:3000/03-plitka — Плитка
- http://localhost:3000/02-dobavlenie — Добавление
- http://localhost:3000/01-lenta — Лента

Чистые JSON-эндпоинты (для показа во вкладке Network на защите):
- GET /api/accumulators?minCapacityMah=2000
- GET /api/accumulators/draft
- GET /api/accumulators/:id?next=true

## Структура

```
src/
  accumulators/
    entities/
      accumulator.entity.ts
      accumulator-status.enum.ts
    accumulators.controller.ts
    accumulators.service.ts
    accumulators.module.ts
  minio/
    minio.service.ts
    minio.module.ts
  app.module.ts
  main.ts
views/         — hbs-шаблоны трёх страниц (без JavaScript)
public/        — styles.css (стиль скопирован с dns-shop.ru)
```
