# План интеграции n8n и обновления контактных данных

## Обзор задачи

Заменить интеграцию с Supabase на n8n webhook для обработки заявок с сайта Святобор, а также обновить контактные данные на сайте.

---

## ЧАСТЬ 1: Интеграция с n8n

### Текущее состояние
- API route: `/app/api/contact/route.ts` - сохраняет данные в таблицу `contact_submissions` в Supabase
- Клиентская функция: `/lib/supabase.ts` - содержит `submitContactForm()`
- Компонент формы: `/components/ContactSection.tsx` - использует функцию отправки

### Требуемые изменения

#### 1.1 Изменить форму ContactSection.tsx
**Файл:** `components/ContactSection.tsx`

**Добавить поля:**
- Email (необязательное поле)
- Адрес (необязательное поле)
- Выбор услуги (выпадающий список)
- Выбор типа объекта (выпадающий список)
- Сообщение (текстовое поле)

**Новые поля формы:**
```typescript
email: z.string().email().optional(),
address: z.string().optional(),
service: z.string().optional(),
objectType: z.string().optional(),
message: z.string().optional(),
```

#### 1.2 Создать новый API route для n8n webhook
**Файл:** `app/api/contact/route.ts` (полностью переписать)

**Логика:**
- Получить данные формы
- Валидировать обязательные поля (name, phone)
- Отправить POST запрос на n8n webhook URL
- Вернуть ответ клиенту

**Формат отправки на n8n webhook:**
```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "service": "string",
  "objectType": "string",
  "preferredTime": "string",
  "message": "string",
  "chatId": "telegram_chat_id" // если нужно для TG бота
}
```

#### 1.3 Удалить Supabase интеграцию
**Файлы для удаления/изменения:**
- `lib/supabase.ts` - можно удалить или оставить для других целей
- Переменные окружения в `.env`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### 1.4 Адаптировать n8n воркфлоу
**Файл:** `n8n/Svyatobor_Bot.json`

**Изменения:**
1. Изменить webhook path с `/DTU_zayavki` на `/svyatobor-zayavki`
2. Изменить email адрес в Gmail node с `deztexug@yandex.ru` на `svyatobor.23@yandex.ru`
3. Убрать DataTable node (если не нужен для Святобора)
4. Настроить Telegram bot credentials (уже настроен по словам пользователя)

---

## ЧАСТЬ 2: Обновление контактных данных

### Текущие данные
- Телефон: +7 (925) 000-00-33
- WhatsApp: wa.me/79250000033

### Новые данные
- Телефон: +7 (995) 169-38-88
- WhatsApp: wa.me/79883398963

### Файлы для обновления

#### 2.1 components/Header.tsx
**Строки:**
- Линия 63: `href="tel:+79250000033"` → `href="tel:+79951693888"`
- Линия 83: `+7 (925) 000-00-33` → `+7 (995) 169-38-88`
- Линия 145: `href="tel:+79250000033"` → `href="tel:+79951693888"`
- Линия 149: `+7 (925) 000-00-33` → `+7 (995) 169-38-88`
- Линия 151: `href="https://wa.me/79250000033"` → `href="https://wa.me/79883398963"`

#### 2.2 components/Footer.tsx
**Строки:**
- Линия 15: `href="https://wa.me/79250000033"` → `href="https://wa.me/79883398963"`
- Линия 24: `href="tel:+79250000033"` → `href="tel:+79951693888"`
- Линия 75: `href="tel:+79250000033"` → `href="tel:+79951693888"`
- Линия 76: `+7 (925) 000-00-33` → `+7 (995) 169-38-88`

#### 2.3 components/ContactSection.tsx
**Строки:**
- Линия 149: `href="tel:+79250000033"` → `href="tel:+79951693888"`
- Линия 150: `+7 (925) 000-00-33` → `+7 (995) 169-38-88`
- Линия 198: `href="https://wa.me/79250000033"` → `href="https://wa.me/79883398963"`
- Линия 206: `href="tel:+79250000033"` → `href="tel:+79951693888"`

#### 2.4 components/HeroSection.tsx
**Строки:**
- Линия 163: `window.open('https://wa.me/79250000033', '_blank')` → `window.open('https://wa.me/79883398963', '_blank')`

---

## ЧАСТЬ 3: Переменные окружения

### Добавить в .env
```env
# n8n Webhook URL
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/svyatobor-zayavki

# Telegram Chat ID (для уведомлений)
TELEGRAM_CHAT_ID=your_chat_id
```

---

## ЧАСТЬ 4: Порядок выполнения

1. **Обновить контактные данные** (быстрые изменения)
   - Header.tsx
   - Footer.tsx
   - ContactSection.tsx
   - HeroSection.tsx

2. **Расширить форму ContactSection.tsx**
   - Добавить новые поля формы
   - Обновить схему валидации Zod

3. **Переписать API route**
   - Заменить `/app/api/contact/route.ts` для отправки на n8n webhook

4. **Адаптировать n8n воркфлоу**
   - Обновить путь webhook
   - Изменить email адрес
   - Настроить узлы под Святобор

5. **Тестирование**
   - Проверить отправку формы
   - Проверить получение уведомлений в Telegram
   - Проверить получение email
   - Проверить обновление контактных ссылок

---

## Примечания

- Email для уведомлений: `svyatobor.23@yandex.ru`
- Токен Telegram бота уже настроен в n8n
- DataTable node из оригинального воркфлоу может быть удален, если не нужен для хранения данных в n8n
- AI агент (GPT-4O) можно сохранить для классификации заявок, но это потребует дополнительной настройки под услуги Святобора
