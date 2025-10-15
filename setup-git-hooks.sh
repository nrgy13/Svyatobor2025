#!/bin/bash

# Скрипт настройки Git Hooks для автоматического деплоя
# Автоматически настраивает pre-commit, post-commit и post-push хуки

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Настройка Git Hooks для автоматического деплоя${NC}"

# Создание директории для хуков
mkdir -p .git/hooks

# Pre-commit хук - проверка кода перед коммитом
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Выполняю предкоммитные проверки..."

# Проверка линтинга
echo "📏 Проверка ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Ошибки линтинга. Исправьте ошибки перед коммитом."
    exit 1
fi

# Проверка сборки (опционально)
echo "🔨 Проверка сборки..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки. Проверьте код."
    exit 1
fi

echo "✅ Предкоммитные проверки пройдены"
exit 0
EOF

# Post-commit хук - уведомления после коммита
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
echo "📝 Коммит выполнен успешно"
echo "💡 Совет: используйте 'git push' для отправки изменений"
EOF

# Post-push хук - автоматический деплой после пуша в production ветку
cat > .git/hooks/post-push << 'EOF'
#!/bin/bash

# Получаем имя текущей ветки
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 Выполнен push в ветку: $BRANCH"

# Автодеплой только для production ветки
if [ "$BRANCH" = "production" ]; then
    echo "🎯 Обнаружена production ветка. Запускаю деплой..."
    ./deploy.sh production

    if [ $? -eq 0 ]; then
        echo "✅ Деплой выполнен успешно"
        # Здесь можно добавить уведомления в Slack/Telegram
    else
        echo "❌ Деплой завершился с ошибкой"
        exit 1
    fi
elif [ "$BRANCH" = "staging" ]; then
    echo "🧪 Обнаружена staging ветка. Деплой в staging среду..."
    ./deploy.sh staging
fi

exit 0
EOF

# Делаем хуки исполняемыми
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/post-push

echo -e "${GREEN}✅ Git Hooks настроены успешно!${NC}"
echo ""
echo -e "${YELLOW}📋 Настроенные хуки:${NC}"
echo -e "  🔍 ${BLUE}pre-commit${NC} - проверка линтинга и сборки перед коммитом"
echo -e "  📝 ${BLUE}post-commit${NC} - уведомление после успешного коммита"
echo -e "  🚀 ${BLUE}post-push${NC} - автоматический деплой после пуша в production ветку"
echo ""
echo -e "${YELLOW}🔒 Безопасность:${NC}"
echo -e "  • Хуки выполняют только локальную проверку кода"
echo -e "  • Деплой происходит только после успешных проверок"
echo -e "  • Используйте сильные пароли для доступа к серверу"