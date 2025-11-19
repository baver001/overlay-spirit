# Loverlay

Loverlay — PWA-редактор оверлеев: загрузите фото, применяйте наборы эффектов, покупайте премиальные коллекции и управляйте ими через админ-панель.

## Стек
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix)
- Cloudflare Pages Functions (D1, R2, Stripe)

## Быстрый старт
```sh
npm install
npm run dev
```

### Роли и аутентификация
- Пользователь (customer) — покупает и использует наборы из каталога.
- Администратор (admin) — управляет контентом и настройками через `/admin`.

### Переменные окружения
Создайте `.env` / `.env.local`:
```
VITE_API_BASE=/
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_PROJECT=loverlay
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
MIGRATE_TOKEN=...
```

Cloudflare Pages bindings:
- `DB` — D1 база данных
- `R2` — бакет с изображениями оверлеев
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — ключи Stripe

### Миграция базы и сиды
```sh
wrangler d1 execute loverlay --file ./functions/api/schema.sql
wrangler d1 execute loverlay --file ./functions/api/seed.sql # опционально
```

### Миграция базы D1
```sh
wrangler d1 execute loverlay --file ./functions/api/schema.sql
```
либо
```sh
curl -X POST https://loverlay.com/api/migrate -H "x-migrate-token: $MIGRATE_TOKEN"
```

## Деплой
1. `npm run build`
2. `wrangler pages publish dist`
3. Настройте DNS домена `loverlay.com` в Cloudflare и привяжите проект.

## Структура каталога
- `src/` — клиентский код
- `src/pages/admin` — админ-панель (layout, маршруты, провайдер сессии)
- `functions/api/` — Cloudflare Functions
- `docs/` — аудит и план развития проекта

## Админ-панель
- `/admin/dashboard` — обзор метрик, графики покупок и выручки, топ-наборы, журнал действий.
- `/admin/categories` — управление категориями каталога.
- `/admin/sets` — управление наборами и привязками к категориям.
- `/admin/overlays` — управление отдельными слоями.
- `/admin/users` — статистика пользователей.
- `/admin/purchases` — мониторинг покупок и статусов оплат.
- `/admin/settings` — ключи Stripe и параметры каталога.

Доступ к маршрутам `/admin/*` ограничен проверкой роли `admin` на стороне API (`/api/admin`).

## API
- `/api/auth` — аутентификация, выдача сессий.
- `/api/admin` — защищённые админские операции (категории, наборы, слои, статистика, настройки, загрузки).
- `/api/sets` — публичный каталог для клиентов.
- `/api/stripe` — оформление платежей и вебхуки.

## Документация
- `docs/PROJECT_AUDIT.md`
- `docs/DEVELOPMENT_PLAN.md`

## Лицензия
MIT
