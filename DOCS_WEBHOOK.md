# 🔗 Интеграция Next.js формы с n8n Webhook

Это руководство описывает проверенный и безопасный способ настройки отправки данных из формы Next.js в n8n через серверный API Route.

## 🏗️ Архитектура

```mermaid
graph LR
    User[Пользователь] -->|POST JSON| NextJS[Next.js Server (/api/contact)]
    NextJS -->|Validation & Auth| n8n[n8n Webhook]
    n8n -->|Processing| Telegram[Telegram/CRM]
```

**Преимущества:**
*   🔒 **Безопасность:** URL вебхука и Токен авторизации скрыты от пользователя.
*   🛡️ **CORS:** Решает проблемы с кросс-доменными запросами.
*   ✅ **Валидация:** Данные проверяются перед отправкой.

---

## 1️⃣ Настройка n8n

1.  Создайте новый Workflow.
2.  Добавьте узел **Webhook**.
3.  Настройте узел:
    *   **HTTP Method:** `POST`
    *   **Path:** придумайте уникальный путь (например, `svyatobor-zayavki`).
    *   **Authentication:** `Header Auth`.
    *   **Header Name:** `Authorization` (стандартный заголовок) или `X-Api-Key`.
    *   **Header Value:** Придумайте сложный ключ.
        *   *Пример для Authorization:* `Bearer my-secret-token-123`
        *   *Пример для X-Api-Key:* `my-secret-token-123`
4.  **Важно:** В поле "Header Name" пишите **имя заголовка** (например, `Authorization`), а не имя переменной!
5.  Сохраните Workflow и нажмите **Activate** (свитч вверху справа).
6.  Скопируйте **Production URL** (вкладка "Production URL" в узле Webhook).

---

## 2️⃣ Настройка Next.js (Код)

### A. API Route (`app/api/contact/route.ts`)

Создайте обработчик, который принимает запрос от клиента и пересылает его в n8n.

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Читаем переменные окружения
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const N8N_AUTH_HEADER_NAME = process.env.N8N_AUTH_HEADER_NAME;
const N8N_AUTH_HEADER_VALUE = process.env.N8N_AUTH_HEADER_VALUE;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Валидация данных
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }

    // 2. Подготовка заголовков для n8n
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Добавляем авторизацию, если она настроена
    if (N8N_AUTH_HEADER_NAME && N8N_AUTH_HEADER_VALUE) {
      headers[N8N_AUTH_HEADER_NAME] = N8N_AUTH_HEADER_VALUE;
    }

    // 3. Отправка в n8n
    const response = await fetch(N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('n8n error:', await response.text());
      return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
```

### B. Конфигурация (`next.config.js`)

**Критически важно** для работы за прокси (Nginx/Caddy) и предотвращения ошибок `Missing 'origin' header`.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Для деплоя в Docker/Timeweb
  output: 'standalone',
  
  // Отключаем редиректы /api -> /api/ (важно для POST)
  trailingSlash: false,

  experimental: {
    serverActions: {
      // Разрешаем запросы с этих доменов (решает проблему Origin)
      allowedOrigins: [
        'localhost:3000',
        'ваш-домен.ru',
        'xn--punycode-домен.online', 
        'n8n.ваш-домен.ru'
      ],
    },
  },
  
  // Настройка CORS (опционально, но полезно)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 3️⃣ Настройка Деплоя (Переменные окружения)

В панели хостинга (Timeweb/Vercel/Docker) добавьте переменные:

| Имя переменной | Значение (Пример) | Описание |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `https://n8n.site.ru/webhook/my-form` | Полный URL вебхука (Production) |
| `N8N_AUTH_HEADER_NAME` | `Authorization` | Имя заголовка (должно совпадать с n8n) |
| `N8N_AUTH_HEADER_VALUE` | `Bearer my-secret-123` | Значение токена |

---

## 4️⃣ Чек-лист для отладки (Troubleshooting) 🛠️

Если API возвращает ошибку:

1.  **Ошибка 405 (Method Not Allowed):**
    *   Проверьте `trailingSlash: false` в `next.config.js`.
    *   Убедитесь, что запрос идет на правильный URL (без слэша на конце, если отключено).

2.  **Ошибка 500 (Internal Server Error):**
    *   **Смотрите логи сервера!** (В Timeweb: "Логи приложения").
    *   Если `Missing 'origin' header`: Добавьте домен в `allowedOrigins` в `next.config.js`.
    *   Если `n8n error: 403 Forbidden`: Неверный токен или имя заголовка. Проверьте переменные окружения.
    *   Если `fetch failed`: Неверный URL вебхука.

3.  **Ошибка 403/401 от n8n:**
    *   Убедитесь, что `N8N_AUTH_HEADER_NAME` в Timeweb совпадает с полем "Name" в настройках Webhook узла в n8n.

---

## 5️⃣ Dockerfile (для Timeweb App Platform)

Для надежной работы используйте `Dockerfile` вместо автоматической сборки.

```dockerfile
FROM node:20-alpine AS base
# ... (стандартный multi-stage build) ...

# Отключаем HEALTHCHECK, если он вызывает таймауты
# HEALTHCHECK ...

# Явно указываем порт
ENV PORT 3000
EXPOSE 3000

CMD ["node", "server.js"]
```
