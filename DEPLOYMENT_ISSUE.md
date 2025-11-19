# Анализ проблемы с деплоем

## Проблема
Деплой через `wrangler pages deploy` не работает - ошибка `ECONNRESET` при загрузке 28/29 файла.

## Причина
Соединение разрывается при загрузке большого JS файла (1.63MB). Это типичная проблема:
- Таймаут соединения слишком короткий
- Нестабильное сетевое соединение
- Ограничения Cloudflare API при загрузке больших файлов

## Что было исправлено
1. ✅ Удалены конфликтующие переменные окружения `CF_API_KEY` и `CF_ACCOUNT_ID`
2. ✅ Обновлена авторизация через OAuth (`wrangler login`)
3. ✅ Исправлен `wrangler.toml` (удален `account_id` для Pages)
4. ✅ Wrangler обновлен до последней версии (4.45.4)

## Решения

### Вариант 1: Деплой через Git (рекомендуется)
Последний успешный деплой был через Git commit `f8c7507`. Cloudflare Pages автоматически деплоит при push:

```bash
git add .
git commit -m "Fix overlay image URLs"
git push origin main
```

### Вариант 2: Ручная загрузка через веб-интерфейс
1. Откройте [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → loverlay
2. Загрузите архив `dist-deploy.zip` или папку `dist`

### Вариант 3: Уменьшить размер JS файла
Добавить code splitting в `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        router: ['react-router-dom'],
      }
    }
  }
}
```

### Вариант 4: Повторить позже
Возможно, временная проблема Cloudflare API - попробуйте через несколько часов.

## Рекомендация
Используйте **Вариант 1 (Git)** - это самый надежный способ деплоя для Cloudflare Pages.


