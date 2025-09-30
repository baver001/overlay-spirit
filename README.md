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
- `functions/api/` — Cloudflare Functions
- `docs/` — аудит и план развития проекта

## Документация
- `docs/PROJECT_AUDIT.md`
- `docs/DEVELOPMENT_PLAN.md`

## Лицензия
MIT
