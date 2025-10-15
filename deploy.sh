#!/bin/bash

# Скрипт автоматического деплоя на Timeweb
# Использование: ./deploy.sh [staging|production]

set -e  # Прерывать выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Загрузка переменных окружения
if [ -f ".env.deploy" ]; then
    echo -e "${BLUE}📋 Загружаю переменные окружения из .env.deploy${NC}"
    source .env.deploy
fi

# Конфигурация
ENVIRONMENT=${1:-production}
PROJECT_NAME="svyatobor-web"
BUILD_DIR="out"
BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"

echo -e "${PURPLE}🚀 Начинаем деплой проекта $PROJECT_NAME в среду $ENVIRONMENT${NC}"
echo "=================================================="

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

# Загрузка через SSH (основной метод для Timeweb Cloud)
if [ ! -z "$SSH_HOST" ] && [ ! -z "$SSH_USER" ]; then
    echo -e "${BLUE}📡 Использую SSH для деплоя на Timeweb Cloud...${NC}"

    # Проверяем SSH ключ
    if [ ! -z "$SSH_KEY_PATH" ] && [ -f "$SSH_KEY_PATH" ]; then
        SSH_OPTS="-i $SSH_KEY_PATH"
        echo -e "${BLUE}🔑 Использую SSH ключ: $SSH_KEY_PATH${NC}"
    else
        SSH_OPTS="-o StrictHostKeyChecking=no"
        echo -e "${YELLOW}⚠️  SSH ключ не найден, использую парольную аутентификацию${NC}"
    fi

    # Загружаем файлы через rsync
    rsync -avz --delete -e "ssh $SSH_OPTS" --exclude='.git' --exclude='node_modules' --exclude='.env*' \
        $BUILD_DIR/ $SSH_USER@$SSH_HOST:$REMOTE_PATH/

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Файлы успешно загружены через SSH${NC}"
    else
        echo -e "${RED}❌ Ошибка при загрузке файлов через SSH${NC}"
        echo -e "${YELLOW}💡 Возможные причины:${NC}"
        echo -e "   - Неправильный SSH_HOST или SSH_USER"
        echo -e "   - SSH ключ не настроен или имеет неправильные права"
        echo -e "   - Сервер недоступен"
        exit 1
    fi

# Альтернатива через FTP (если доступна)
elif [ ! -z "$FTP_HOST" ] && [ ! -z "$FTP_USER" ] && [ ! -z "$FTP_PASS" ]; then
    echo -e "${BLUE}📡 Использую FTP для деплоя...${NC}"

    # Проверяем наличие lftp
    if command -v lftp &> /dev/null; then
        lftp -c "open -u $FTP_USER,$FTP_PASS $FTP_HOST; mirror -R $BUILD_DIR $REMOTE_PATH"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Файлы успешно загружены через FTP${NC}"
        else
            echo -e "${RED}❌ Ошибка при загрузке файлов через FTP${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ lftp не установлен. Установите lftp или используйте SSH${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Не настроены параметры подключения к серверу${NC}"
    echo -e "${YELLOW}Настройте переменные в .env.deploy:${NC}"
    echo -e "  SSH_HOST, SSH_USER или FTP_HOST, FTP_USER, FTP_PASS"
    exit 1
fi

echo -e "${GREEN}✅ Деплой файлов завершен успешно!${NC}"

# Пост-деплой действия
echo -e "${YELLOW}🔄 Выполняю пост-деплой действия...${NC}"

# Перезапуск веб-сервера
if [ ! -z "$SSH_HOST" ] && [ ! -z "$SSH_USER" ]; then
    echo -e "${BLUE}🔄 Перезапускаю веб-сервер...${NC}"

    # Определяем тип веб-сервера и перезапускаем соответствующий сервис
    ssh $SSH_USER@$SSH_HOST "sudo systemctl restart nginx || sudo systemctl restart apache2 || sudo systemctl restart httpd || echo 'Веб-сервер не обнаружен или уже работает'"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Веб-сервер успешно перезапущен${NC}"
    else
        echo -e "${YELLOW}⚠️  Не удалось перезапустить веб-сервер автоматически${NC}"
    fi

    # Проверяем статус сервиса
    echo -e "${BLUE}📊 Проверяю статус сервиса...${NC}"
    ssh $SSH_USER@$SSH_HOST "sudo systemctl status nginx || sudo systemctl status apache2 || sudo systemctl status httpd || echo 'Сервисы веб-сервера:' && ps aux | grep -E '(nginx|apache|httpd)' | grep -v grep"
fi

# Пост-деплой проверки
echo -e "${YELLOW}🔍 Выполняю пост-деплой проверки...${NC}"

# Проверка доступности сайта
if [ ! -z "$PRODUCTION_DOMAIN" ]; then
    echo -e "${BLUE}🌐 Проверяю доступность сайта...${NC}"
    if command -v curl &> /dev/null; then
        if curl -f -s "https://$PRODUCTION_DOMAIN" > /dev/null; then
            echo -e "${GREEN}✅ Сайт доступен по адресу: https://$PRODUCTION_DOMAIN${NC}"
        else
            echo -e "${YELLOW}⚠️  Сайт недоступен или отвечает с ошибкой${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl не установлен для проверки доступности сайта${NC}"
    fi
fi

echo ""
echo -e "${PURPLE}🎉 Деплой в среду $ENVIRONMENT завершен успешно!${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}📋 Следующие шаги:${NC}"
echo "1. Проверьте работу сайта в браузере"
echo "2. Убедитесь, что все функции работают корректно"
echo "3. Проверьте логи сервера при необходимости"
echo ""
echo -e "${YELLOW}🔒 Рекомендации по безопасности:${NC}"
echo "- Мониторьте доступ к сайту"
echo "- Проверяйте логи на наличие ошибок"
echo "- Обновляйте зависимости регулярно"
echo ""
echo -e "${GREEN}🚀 Проект готов к работе!${NC}"
echo -e "${GREEN}📅 Время завершения: $(date)${NC}"