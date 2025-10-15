#!/bin/bash

# Скрипт автоматического деплоя на Timeweb
# Использование: ./deploy.sh [staging|production]

set -e  # Прерывать выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация
ENVIRONMENT=${1:-production}
PROJECT_NAME="svyatobor-web"
BUILD_DIR="out"
BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"

echo -e "${GREEN}🚀 Начинаем деплой проекта $PROJECT_NAME в среду $ENVIRONMENT${NC}"

# Проверка окружения
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Неизвестная среда: $ENVIRONMENT. Используйте 'staging' или 'production'${NC}"
    exit 1
fi

# Проверка наличия сборки
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}⚠️  Директория сборки $BUILD_DIR не найдена. Выполняю сборку...${NC}"
    npm run build

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Сборка завершилась с ошибкой${NC}"
        exit 1
    fi
fi

# Создание резервной копии (только для продакшена)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}📦 Создаю резервную копию...${NC}"
    mkdir -p backup
    # Здесь должна быть команда резервного копирования с сервера
    # scp -r user@timeweb-server:/var/www/html $BACKUP_DIR
fi

# Проверка размера сборки
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
echo -e "${GREEN}📊 Размер сборки: $BUILD_SIZE${NC}"

# Валидация критических файлов
CRITICAL_FILES=("$BUILD_DIR/index.html" "$BUILD_DIR/.htaccess")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Критический файл отсутствует: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Валидация прошла успешно${NC}"

# Деплой файлов на сервер
echo -e "${YELLOW}📤 Загружаю файлы на сервер...${NC}"

# Здесь должны быть команды загрузки файлов на Timeweb
# Например, через rsync или scp:
# rsync -avz --delete $BUILD_DIR/ user@timeweb-server:/var/www/html/

# Альтернатива через FTP:
# lftp -c "open -u $FTP_USER,$FTP_PASS $FTP_HOST; mirror -R $BUILD_DIR /var/www/html"

echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"

# Пост-деплой проверки
echo -e "${YELLOW}🔍 Выполняю пост-деплой проверки...${NC}"

# Здесь можно добавить проверки доступности сайта
# curl -f https://your-domain.com/ || exit 1

echo -e "${GREEN}🎉 Деплой в среду $ENVIRONMENT завершен успешно!${NC}"
echo -e "${GREEN}📅 Время завершения: $(date)${NC}"