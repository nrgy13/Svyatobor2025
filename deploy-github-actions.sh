#!/bin/bash

# 🚀 Скрипт деплоя для GitHub Actions
# Автоматическое развертывание Svyatobor Web на Timeweb Cloud

set -e  # Прерывание при ошибке

echo "🚀 Начинаю деплой Svyatobor Web..."
echo "📅 Время: $(date)"
echo "🌐 Домен: $PRODUCTION_DOMAIN"

# Проверка переменных окружения
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$PRODUCTION_DOMAIN" ]; then
    echo "❌ Ошибка: Не все переменные окружения установлены"
    echo "Требуемые переменные: SSH_HOST, SSH_USER, PRODUCTION_DOMAIN"
    exit 1
fi

# Создание резервной копии (только для продакшена)
if [ "$GITHUB_REF" = "refs/heads/main" ]; then
    echo "💾 Создание резервной копии..."
    ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "mkdir -p backup && cp -r /var/www/html backup/backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Резервная копия создана"
fi

# Очистка целевой директории
echo "🧹 Очистка старых файлов..."
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "rm -rf /var/www/html/*"

# Создание структуры директорий
echo "📁 Создание структуры директорий..."
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "mkdir -p /var/www/html/images /var/www/html/public/images"

# Загрузка основных файлов через rsync
echo "📤 Загрузка основных файлов..."
rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" ./out/ $SSH_USER@$SSH_HOST:/var/www/html/

# Загрузка изображений
echo "🖼️ Загрузка изображений..."
rsync -avz -e "ssh -o StrictHostKeyChecking=no" ./images/ $SSH_USER@$SSH_HOST:/var/www/html/images/
rsync -avz -e "ssh -o StrictHostKeyChecking=no" ./public/images/ $SSH_USER@$SSH_HOST:/var/www/html/public/images/

# Настройка прав доступа
echo "🔐 Настройка прав доступа..."
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "chmod -R 755 /var/www/html/"
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "find /var/www/html/ -type f -exec chmod 644 {} \;"

# Перезапуск веб-сервера
echo "🔄 Перезапуск веб-сервера..."
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "sudo systemctl reload nginx && sudo systemctl status nginx --no-pager"

# Пост-деплойные проверки
echo "🔍 Пост-деплойные проверки..."

# Проверка основных файлов
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "test -f /var/www/html/index.html && echo '✅ index.html развернут' || echo '❌ index.html не найден'"
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "test -d /var/www/html/images && echo '✅ Папка images развернута' || echo '❌ Папка images не найдена'"

# Проверка размера файлов
TOTAL_SIZE=$(ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "du -sh /var/www/html/ | cut -f1")
echo "📊 Общий размер файлов: $TOTAL_SIZE"

# Количество изображений
IMG_COUNT=$(ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "find /var/www/html/images/ /var/www/html/public/images/ -type f -name '*.jpg' -o -name '*.png' -o -name '*.jpeg' | wc -l")
echo "🖼️ Количество изображений: $IMG_COUNT"

echo "🎉 Деплой завершен успешно!"
echo "🌐 Сайт доступен по адресу: https://$PRODUCTION_DOMAIN"
echo "📊 Статистика деплоя:"
echo "   - Размер приложения: $TOTAL_SIZE"
echo "   - Изображений: $IMG_COUNT файлов"
echo "   - Время завершения: $(date)"

# Выход с кодом успеха
exit 0