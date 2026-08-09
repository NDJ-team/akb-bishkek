# AKB Бишкек — сайт продажи автомобильных аккумуляторов

Современный лендинг + админ-панель для магазина аккумуляторов в Бишкеке.

## Стек

- **Frontend:** HTML5 + CSS3 + Vanilla JS (mobile-first, без фреймворков)
- **Backend:** Node.js + Express
- **База данных:** SQLite через Prisma ORM (лёгкий переход на PostgreSQL — 2 строки в `prisma/schema.prisma`)
- **API:** REST + JWT авторизация администратора

## Возможности

- Hero-блок, преимущества, каталог, фильтры (бренд / цена / ёмкость / полярность)
- Форма заявки с валидацией (сохраняется в БД)
- Контакты, карта, WhatsApp, SEO (title, description, OpenGraph, robots.txt, sitemap.xml)
- Админ-панель `/admin.html`: статистика, заявки (статусы Новая/В работе/Выполнена), CRUD товаров, загрузка фото
- Безопасность: helmet, CORS, rate limit, JWT, экранирование, multer с ограничением файлов
- Gzip-сжатие (compression), lazy-loading изображений, минификация через `npm run build`

## Быстрый старт

Требуется **Node.js 18+**.

```bash
npm install
npm run dev
```

Сервер запустится на `http://localhost:3000`:

| Адрес | Что это |
|---|---|
| http://localhost:3000 | Главная страница |
| http://localhost:3000/admin.html | Админ-панель |
| http://localhost:3000/api/products | API (JSON) |

При первом запуске БД создаётся автоматически и заполняется тестовыми данными.

## Данные для входа в админку

По умолчанию (можно поменять в `.env`):

- Логин: `admin`
- Пароль: `admin123`

## Команды

```bash
npm run dev        # запуск в режиме разработки (nodemon)
npm start          # запуск в production-режиме
npm run build      # минификация CSS/JS в client/dist
npm run db:push    # создание/обновление схемы БД
npm run db:seed    # ручной seed тестовых данных
npm run setup      # полная инициализация: generate + push + seed
```

## Структура проекта

```
├── client/                  # фронтенд
│   ├── index.html           # главная страница
│   ├── admin.html           # админ-панель
│   ├── css/                 # стили
│   ├── js/                  # скрипты
│   ├── images/              # изображения (SVG)
│   ├── robots.txt
│   └── sitemap.xml
├── server/                  # бэкенд
│   ├── app.js               # точка входа
│   ├── routes/              # маршруты API
│   ├── controllers/         # бизнес-логика
│   ├── middleware/          # auth, upload, validation, errors, logger
│   ├── database/            # Prisma client + seed
│   ├── uploads/             # загруженные фото товаров
│   └── utils/build.js       # минификация
├── prisma/schema.prisma     # схема БД
├── .env                     # конфигурация (создаётся из .env.example)
└── package.json
```

## REST API

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| GET | `/api/products` | публичный | список товаров + фильтры `brand, minPrice, maxPrice, capacity, polarity, search, sort` |
| GET | `/api/products/:id` | публичный | один товар |
| POST | `/api/products` | админ | создать товар (multipart, фото) |
| PUT | `/api/products/:id` | админ | обновить товар |
| DELETE | `/api/products/:id` | админ | удалить товар |
| GET | `/api/orders` | админ | все заявки (фильтр `status`) |
| POST | `/api/orders` | публичный | создать заявку |
| PATCH | `/api/orders/:id/status` | админ | сменить статус |
| DELETE | `/api/orders/:id` | админ | удалить заявку |
| POST | `/api/login` | публичный | вход админа → JWT |
| GET | `/api/stats` | админ | статистика для панели |

Админские эндпоинты требуют заголовок: `Authorization: Bearer <token>`.

## Переход на PostgreSQL

1. В `prisma/schema.prisma` замените:
   ```prisma
   provider = "sqlite"
   ```
   на
   ```prisma
   provider = "postgresql"
   ```
2. В `.env` задайте:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/akb"
   ```
3. Выполните `npm run db:push` и `npm run db:seed`.

## Деплой

1. Скопируйте проект на сервер.
2. `npm install` (в production можно `npm ci --omit=dev`).
3. Настройте `.env` (порт, секрет JWT, данные магазина).
4. `npm start` (или через process manager: PM2 / systemd).
5. Для минификации: `npm run build` (при `npm ci --omit=dev` сначала установите dev-зависимости или соберите на своей машине).

## Настройка под свой магазин

- Телефон, WhatsApp, адрес, часы работы — в `client/index.html`
- Контакты магазина и админ-пароль — в `.env`
- Домен для SEO (canonical, sitemap) — в `client/index.html`, `client/sitemap.xml`, `client/robots.txt`
- Цены и ассортимент удобно менять из админ-панели
