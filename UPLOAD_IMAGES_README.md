# Загрузка изображений в Supabase Storage

Этот документ содержит инструкции по настройке и использованию скрипта загрузки изображений в Supabase Storage.

## Структура проекта

Скрипт создает следующую структуру папок в бакете Supabase:

```
Svyatobor2025/
├── logos/           # Логотипы компании
│   ├── logo.png
│   └── logo-circle.png
├── backgrounds/     # Фоновые изображения
│   ├── hero-bg.jpg
│   └── result-bg.jpg
├── sections/        # Изображения для секций
│   ├── advantages-image.jpg
│   └── problem-image.jpg
├── services/        # Изображения услуг
│   ├── service-trees.jpg
│   ├── service-grass.jpg
│   ├── service-spraying.jpg
│   ├── service-removal.jpg
│   └── service-construction.jpg
└── clients/         # Изображения клиентов
    ├── client-1.jpg
    ├── client-2.jpg
    └── client-3.jpg
```

## Настройка переменных окружения

### 1. Получите ключи Supabase

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел **Settings > API**
4. Скопируйте следующие ключи:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Создайте файл .env.local

Создайте файл `.env.local` в корне проекта и добавьте ваши ключи:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Storage Configuration (для загрузки изображений)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Создайте бакет в Supabase Storage

1. В Supabase Dashboard перейдите в **Storage**
2. Создайте новый бакет с именем `Svyatobor2025`
3. Установите настройки:
   - **Public bucket**: Включено (для публичного доступа к изображениям)
   - **File size limit**: 10 MB (или больше, если нужно)

## Подготовка локальных изображений

Убедитесь, что в папке `public/images/` находятся следующие файлы:

### Обязательные файлы:
- `logo.png` - основной логотип компании
- `hero-bg.jpg` - фоновое изображение для главной секции
- `result-bg.jpg` - фоновое изображение для секции результатов
- `advantages-image.jpg` - изображение для секции преимуществ
- `problem-image.jpg` - изображение для секции проблем

### Опциональные файлы:
- `logo-circle.png` - круглая версия логотипа
- `service-trees.jpg` - изображение услуги по уходу за деревьями
- `service-grass.jpg` - изображение услуги по уходу за газоном
- `service-spraying.jpg` - изображение услуги по опрыскиванию
- `service-removal.jpg` - изображение услуги по удалению
- `service-construction.jpg` - изображение услуги по строительству
- `client-1.jpg`, `client-2.jpg`, `client-3.jpg` - фото клиентов

## Запуск скрипта загрузки

### Установка зависимостей

Убедитесь, что установлен Node.js (версия 16+), затем выполните:

```bash
npm install @supabase/supabase-js
```

### Запуск скрипта

```bash
node upload-images.js
```

### Что делает скрипт:

1. **Подключается к Supabase** используя ваши ключи
2. **Создает структуру папок** в бакете
3. **Загружает существующие локальные изображения**
4. **Создает плейсхолдеры** для недостающих файлов
5. **Генерирует обновленные константы** для `lib/constants.ts`

## Результат выполнения

После успешного выполнения скрипта:

### ✅ Будут загружены существующие изображения:
- `logo.png` → `logos/logo.png`
- `hero-bg.jpg` → `backgrounds/hero-bg.jpg`
- `result-bg.jpg` → `backgrounds/result-bg.jpg`
- `advantages-image.jpg` → `sections/advantages-image.jpg`
- `problem-image.jpg` → `sections/problem-image.jpg`

### 🎨 Будут созданы плейсхолдеры для отсутствующих файлов:
- `logo-circle.png` → `logos/logo-circle.png`
- Все файлы услуг в папке `services/`
- Все файлы клиентов в папке `clients/`

### 📝 Будет обновлен файл `lib/constants.ts` с правильными URL изображений

## Замена плейсхолдеров

После загрузки плейсхолдеров замените их на реальные изображения:

1. Подготовьте реальные изображения с нужными именами
2. Поместите их в папку `public/images/`
3. Запустите скрипт повторно: `node upload-images.js`

## Проверка результатов

После загрузки проверьте:

1. В Supabase Dashboard → Storage → `Svyatobor2025` бакет
2. Все файлы загружены в правильные папки
3. Изображения доступны по публичным URL
4. Константы в `lib/constants.ts` обновлены

## Возможные ошибки

### "The resource already exists"
- Это нормально, означает что папка уже существует

### "Missing environment variable"
- Проверьте что все переменные в `.env.local` указаны правильно
- Убедитесь что `.env.local` файл создан в корне проекта

### "Permission denied"
- Убедитесь что `SUPABASE_SERVICE_ROLE_KEY` правильный
- Проверьте настройки бакета в Supabase (должен быть публичным)

## Поддержка

Если возникнут проблемы:
1. Проверьте консоль на наличие ошибок
2. Убедитесь что все переменные окружения установлены
3. Проверьте настройки бакета в Supabase Dashboard
4. Убедитесь что файлы существуют локально перед загрузкой