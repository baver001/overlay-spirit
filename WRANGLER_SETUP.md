# Настройка Wrangler для Cloudflare Pages

## Быстрая настройка

1. **Авторизация через OAuth (рекомендуется):**
   ```bash
   wrangler login
   ```
   Откроется браузер для авторизации через Cloudflare.

2. **Убедитесь, что в `wrangler.toml` нет `account_id`:**
   ```toml
   name = "loverlay"
   compatibility_date = "2024-09-19"
   pages_build_output_dir = "dist"
   # account_id не нужен для Pages - берется из OAuth токена
   ```

3. **Удалите устаревшие переменные окружения:**
   - `CF_API_KEY` (устарело, используйте `CLOUDFLARE_API_KEY` если нужен API токен)
   - `CF_ACCOUNT_ID` (устарело, используйте `CLOUDFLARE_ACCOUNT_ID` если нужен)

   **Важно:** Для Pages лучше использовать только OAuth авторизацию через `wrangler login`.

4. **Деплой:**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=loverlay
   ```

## Альтернатива: API токен (если OAuth не работает)

Если нужно использовать API токен вместо OAuth:

1. Создайте API токен в [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens):
   - Permissions: `Account` → `Cloudflare Pages` → `Edit`
   - Account Resources: ваш аккаунт

2. Установите переменные окружения:
   ```powershell
   $env:CLOUDFLARE_API_TOKEN = "ваш_токен"
   $env:CLOUDFLARE_ACCOUNT_ID = "9e75a3866eb9269f8d3c3407bdef7cf8"
   ```

3. Деплой:
   ```bash
   wrangler pages deploy dist --project-name=loverlay
   ```

## Проверка настроек

```bash
# Проверить текущую авторизацию
wrangler whoami

# Список проектов Pages
wrangler pages project list
```

## Решение проблем

### Ошибка "account_id not supported"
- Удалите `account_id` из `wrangler.toml` для Pages проектов

### Ошибка "Failed to upload files"
- Проверьте интернет-соединение
- Попробуйте повторить деплой позже
- Используйте веб-интерфейс Cloudflare для ручной загрузки

### Конфликт переменных окружения
- Удалите `CF_API_KEY` и `CF_ACCOUNT_ID`
- Используйте только OAuth (`wrangler login`) или новые переменные `CLOUDFLARE_API_TOKEN`

