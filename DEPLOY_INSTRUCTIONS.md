# 🚀 Пошаговые инструкции по обновлению деплоя на Timeweb

## 📋 Обзор системы деплоя

**Текущая конфигурация:**
- **Основной метод:** SSH + rsync
- **Тип приложения:** Next.js со статической генерацией
- **Целевой сервер:** Timeweb Cloud
- **Основные скрипты:** `deploy.sh`, `init-deploy.sh`

**Необходимые переменные окружения:**
- `SSH_HOST`, `SSH_USER`, `SSH_KEY_PATH` (основной метод)
- `FTP_HOST`, `FTP_USER`, `FTP_PASS` (альтернатива)
- `REMOTE_PATH`, `PRODUCTION_DOMAIN`
- Переменные Supabase

---

## 1. 🔧 Подготовка к деплою

### 1.1 Проверка системных требований

**Для Windows (PowerShell):**
```powershell
# Проверка наличия Node.js
node --version

# Проверка наличия Git
git --version

# Проверка наличия SSH клиента
ssh -V

# Проверка наличия rsync (через Git Bash или WSL)
rsync --version
```

**Для Linux/macOS:**
```bash
# Проверка наличия системных зависимостей
node --version
git --version
ssh -V
rsync --version
```

### 1.2 Настройка переменных окружения

Создайте или обновите файл `.env.deploy`:

```bash
# SSH конфигурация (основной метод)
SSH_HOST="your-server.timeweb.ru"
SSH_USER="your-username"
SSH_KEY_PATH="~/.ssh/timeweb_key"

# Альтернативная FTP конфигурация
FTP_HOST="your-server.timeweb.ru"
FTP_USER="your-ftp-username"
FTP_PASS="your-ftp-password"

# Пути и домены
REMOTE_PATH="/var/www/html"
PRODUCTION_DOMAIN="your-domain.com"

# Supabase переменные (добавьте из .env)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

### 1.3 Настройка SSH доступа

**Генерация SSH ключа (если отсутствует):**
```bash
# Генерация нового SSH ключа
ssh-keygen -t rsa -b 4096 -C "deploy@your-domain.com" -f ~/.ssh/timeweb_key

# Добавление ключа в SSH агент
ssh-add ~/.ssh/timeweb_key

# Копирование публичного ключа на сервер
ssh-copy-id -i ~/.ssh/timeweb_key.pub SSH_USER@SSH_HOST
```

**Проверка SSH соединения:**
```bash
# Тест подключения
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "echo 'SSH connection successful'"

# Проверка прав доступа к целевой директории
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "ls -la REMOTE_PATH"
```

### 1.4 Подготовка проекта

```bash
# Установка зависимостей
npm install

# Проверка сборки в режиме разработки
npm run build

# Проверка отсутствия ошибок линтинга
npm run lint
```

---

## 2. 🔨 Процесс сборки приложения

### 2.1 Локальная сборка

**Стандартная сборка:**
```bash
# Сборка для продакшена
npm run build

# Проверка созданных файлов
ls -la out/
```

**Проверка критических файлов:**
```bash
# Проверка наличия основных файлов сборки
test -f "out/index.html" && echo "✅ index.html найден" || echo "❌ index.html отсутствует"
test -f "out/.htaccess" && echo "✅ .htaccess найден" || echo "❌ .htaccess отсутствует"

# Проверка размера сборки
du -sh out/
```

### 2.2 Преддеплойная проверка

**Валидация сборки:**
```bash
# Запуск скрипта деплоя в тестовом режиме (без загрузки)
./deploy.sh production --dry-run  # (если добавлена опция dry-run)

# Проверка логов сборки
ls -la logs/
```

---

## 3. 📤 Загрузка файлов на сервер

### 3.1 Основной деплой через SSH

**Полный деплой:**
```bash
# Запуск деплоя в продакшн
./deploy.sh production

# Альтернативно для staging
./deploy.sh staging
```

**Что происходит во время деплоя:**
1. ✅ Проверка переменных окружения
2. ✅ Валидация сборки или выполнение `npm run build`
3. ✅ Создание резервной копии (только для продакшена)
4. ✅ Загрузка файлов через rsync
5. ✅ Загрузка изображений из папок `images/` и `public/images/`
6. ✅ Настройка прав доступа (755)
7. ✅ Проверка загрузки изображений
8. ✅ Перезапуск веб-сервера
9. ✅ Пост-деплойные проверки

### 3.2 Альтернативный деплой через FTP

**Если SSH недоступен:**
```bash
# Установка lftp (если отсутствует)
# Для Ubuntu/Debian: sudo apt-get install lftp
# Для CentOS/RHEL: sudo yum install lftp
# Для macOS: brew install lftp

# Деплой через FTP
FTP_HOST="your-server.timeweb.ru" \
FTP_USER="your-ftp-username" \
FTP_PASS="your-ftp-password" \
./deploy.sh production
```

### 3.3 Мониторинг процесса деплоя

**Просмотр прогресса в реальном времени:**
```bash
# Запуск деплоя с подробным выводом
./deploy.sh production | tee deploy-$(date +%Y%m%d-%H%M%S).log

# Мониторинг логов сервера во время деплоя
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "tail -f /var/log/nginx/access.log"
```

---

## 4. 🔍 Пост-деплойные проверки

### 4.1 Проверка доступности сайта

**Автоматическая проверка:**
```bash
# Проверка HTTP статуса
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEAD

# Проверка доступности главной страницы
$response = Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/"
$response.Content | Select-Object -First 20

# Проверка доступности изображений
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEADimages/
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEADpublic/images/
```

**Ручная проверка:**
1. Откройте сайт в браузере
2. Проверьте работу всех основных функций
3. Убедитесь в корректной загрузке изображений
4. Проверьте отсутствие ошибок в консоли браузера

### 4.2 Проверка работоспособности на сервере

**SSH команды для диагностики:**
```bash
# Проверка статуса веб-сервера
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo systemctl status nginx"

# Проверка использования дискового пространства
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "df -h"

# Проверка последних логов ошибок
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo tail -50 /var/log/nginx/error.log"

# Проверка процессов Node.js (если используется)
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "ps aux | grep node"
```

### 4.3 Проверка функциональности приложения

**Тестирование основных функций:**
```bash
# Проверка API endpoints (если есть)
$response = Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/api/health"
$response.Content || echo "API endpoint не найден"

# Проверка Supabase подключения
$response = Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/"
if ($response.Content -match "supabase") {
    Write-Host "Supabase найден на главной странице"
} else {
    Write-Host "Supabase не используется на главной странице"
}
```

---

## 5. ⏪ Откат в случае проблем

### 5.1 Автоматический откат

**Если деплой завершился с ошибкой:**
```bash
# Восстановление из резервной копии
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "cp -r BACKUP_DIR/* REMOTE_PATH/"

# Перезапуск веб-сервера после отката
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo systemctl restart nginx"
```

### 5.2 Ручной откат

**Подготовка команды отката заранее:**
```bash
# Создание скрипта отката
cat > rollback.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backup/$(ls -t backup/ | head -1)"
echo "Восстанавливаю из резервной копии: $BACKUP_DIR"
scp -r $BACKUP_DIR/* SSH_USER@SSH_HOST:REMOTE_PATH/
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo systemctl restart nginx"
EOF

chmod +x rollback.sh
```

### 5.3 Проверка после отката

```bash
# Проверка доступности сайта после отката
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEAD

# Проверка функциональности после отката
$response = Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/"
if ($response.Content -match "error") {
    Write-Host "Найдены ошибки на странице"
} else {
    Write-Host "Ошибок не найдено"
}
```

---

## 6. 📊 Мониторинг и логирование

### 6.1 Настройка логирования

**Создание расширенного логирования:**
```bash
# Добавление в deploy.sh
LOG_FILE="logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Перенаправление всего вывода в лог
./deploy.sh production 2>&1 | tee $LOG_FILE
```

### 6.2 Мониторинг в реальном времени

**Команды мониторинга:**
```bash
# Мониторинг доступа к сайту
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo tail -f /var/log/nginx/access.log"

# Мониторинг ошибок
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo tail -f /var/log/nginx/error.log"

# Мониторинг использования ресурсов
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "htop || top"
```

### 6.3 Анализ логов деплоя

**Просмотр истории деплоев:**
```bash
# Список всех логов деплоя
ls -la logs/deploy-*.log | tail -5

# Просмотр последнего деплоя
tail -100 logs/deploy-$(ls -t logs/deploy-*.log | head -1)

# Поиск ошибок в логах
grep -i "error" logs/deploy-*.log
```

### 6.4 Настройка уведомлений

**Telegram уведомления о деплое:**
```bash
# Установка telegram-bot (npm install -g telegram-bot)
# Настройка бота и добавление в deploy.sh

curl -s -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
  -d chat_id=$TELEGRAM_CHAT_ID \
  -d text="🚀 Деплой завершен: $PRODUCTION_DOMAIN" \
  -d parse_mode="Markdown"
```

---

## 7. 🛠️ Устранение неполадок

### 7.1 Распространенные проблемы

**Проблема: "Permission denied" при SSH подключении**
```bash
# Проверка прав доступа к SSH ключу
chmod 600 ~/.ssh/timeweb_key
chmod 644 ~/.ssh/timeweb_key.pub

# Проверка SSH агента
ssh-add -l

# Тест подключения с verbose выводом
ssh -v -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST
```

**Проблема: Ошибка сборки Next.js**
```bash
# Очистка кэша Next.js
rm -rf .next out node_modules/.cache

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install

# Сборка с подробным выводом
npm run build --verbose
```

**Проблема: Изображения не загружаются**
```bash
# Проверка существования папок изображений локально
ls -la images/ public/images/

# Проверка прав доступа на сервере
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "ls -la REMOTE_PATH/images/"

# Проверка публичного доступа
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEADimages/$(ls images/ | head -1)
```

### 7.2 Диагностические команды

**Полная диагностика деплоя:**
```bash
# Создание диагностического скрипта
cat > diagnose-deploy.sh << 'EOF'
#!/bin/bash
echo "=== Диагностика деплоя ==="
echo "1. Локальная проверка:"
test -f "out/index.html" && echo "✅ Сборка существует" || echo "❌ Сборка отсутствует"
test -d "images" && echo "✅ Папка images существует" || echo "❌ Папка images отсутствует"

echo "2. SSH проверка:"
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "echo 'SSH OK'" || echo "❌ SSH ошибка"

echo "3. Проверка сервера:"
ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "ls -la REMOTE_PATH/"

echo "4. Проверка веб-сервера:"
Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEAD
EOF

chmod +x diagnose-deploy.sh
./diagnose-deploy.sh
```

---

## 8. ⚡ Оптимизация и лучшие практики

### 8.1 Ускорение деплоя

**Параллельная загрузка:**
```bash
# Одновременная загрузка файлов и изображений
./deploy.sh production &
DEPLOY_PID=$!

# Мониторинг прогресса
wait $DEPLOY_PID
```

### 8.2 Автоматизация деплоя

**GitHub Actions интеграция:**
```bash
# Создание workflow файла .github/workflows/deploy.yml
# (уже включено в init-deploy.sh)

# Настройка секретов в GitHub репозитории:
# FTP_USER, FTP_PASS, SSH_KEY, PRODUCTION_DOMAIN
```

### 8.3 Резервное копирование

**Автоматическое резервное копирование:**
```bash
# Создание ежедневных резервных копий
echo "0 2 * * * scp -r SSH_USER@SSH_HOST:REMOTE_PATH backup/daily-$(date +%Y%m%d)" | crontab -

# Очистка старых резервных копий (старше 30 дней)
find backup/ -type d -mtime +30 -exec rm -rf {} \;
```

---

## 📞 Поддержка и контакты

**Быстрая помощь:**
- Проверьте логи деплоя: `tail -100 logs/deploy-$(ls -t logs/deploy-*.log | head -1)`
- Тестируйте SSH подключение: `ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST`
- Проверьте статус сервера: `Invoke-WebRequest -Uri "https://PRODUCTION_DOMAIN/" -Method HEAD`

**Экстренный откат:**
```bash
# Если сайт недоступен
./rollback.sh || ssh -i ~/.ssh/timeweb_key SSH_USER@SSH_HOST "sudo systemctl restart nginx"
```

---

*Последнее обновление: $(date)*
*Версия инструкции: 1.0*