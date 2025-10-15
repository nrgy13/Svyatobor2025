#!/bin/bash

# Скрипт инициализации проекта для деплоя на Timeweb
# Выполняет полную настройку CI/CD инфраструктуры

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Инициализация проекта для деплоя на Timeweb${NC}"
echo "=================================================="

# Проверка наличия Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git не установлен. Установите Git и попробуйте снова.${NC}"
    exit 1
fi

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не установлен. Установите Node.js и попробуйте снова.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проверка системных зависимостей пройдена${NC}"

# Инициализация Git репозитория (если не инициализирован)
if [ ! -d .git ]; then
    echo -e "${YELLOW}📁 Инициализация Git репозитория...${NC}"
    git init
    git checkout -b main
else
    echo -e "${GREEN}📁 Git репозиторий уже инициализирован${NC}"
fi

# Создание структуры веток
echo -e "${YELLOW}🌿 Создание структуры веток разработки...${NC}"

git checkout -b develop || git checkout develop
git checkout -b staging || git checkout staging
git checkout main

echo -e "${GREEN}✅ Структура веток создана:${NC}"
echo -e "  🌿 ${BLUE}main${NC} - основная ветка (продакшн)"
echo -e "  🔧 ${BLUE}develop${NC} - ветка разработки"
echo -e "  🧪 ${BLUE}staging${NC} - промежуточная среда"

# Создание необходимых директорий
echo -e "${YELLOW}📁 Создание директорий проекта...${NC}"
mkdir -p logs backup scripts .github/workflows

# Настройка Git Hooks
echo -e "${YELLOW}🔧 Настройка Git Hooks...${NC}"
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh

# Создание файлов конфигурации
echo -e "${YELLOW}⚙️  Создание конфигурационных файлов...${NC}"

# .gitignore для деплоя
cat > .gitignore.deploy << 'EOF'
# Деплой и сборка
out/
.next/
build/
dist/

# Логи
logs/
*.log
npm-debug.log*

# Резервные копии
backup/
*.backup

# Временные файлы
.tmp/
temp/
*.tmp

# Переменные окружения
.env.local
.env.production
.env.staging

# IDE
.vscode/
.idea/
*.swp
*.swo

# ОС
.DS_Store
Thumbs.db

# Ключи и сертификаты
*.key
*.pem
*.crt
EOF

# Добавление новых строк в существующий .gitignore
if [ -f .gitignore ]; then
    cat .gitignore.deploy >> .gitignore
    rm .gitignore.deploy
fi

# Создание скриптов деплоя
chmod +x deploy.sh
chmod +x init-deploy.sh

# Создание GitHub Actions workflow (если используется GitHub)
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Timeweb

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build project
      run: npm run build

    - name: Deploy to Timeweb
      if: github.ref == 'refs/heads/main'
      run: ./deploy.sh production
      env:
        FTP_USER: ${{ secrets.FTP_USER }}
        FTP_PASS: ${{ secrets.FTP_PASS }}

    - name: Deploy to staging
      if: github.ref == 'refs/heads/staging'
      run: ./deploy.sh staging
EOF

echo -e "${GREEN}✅ Конфигурационные файлы созданы${NC}"

# Инициализация логов
touch logs/deploy.log

# Первый коммит (если репозиторий пустой)
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo -e "${GREEN}📝 Репозиторий уже содержит коммиты${NC}"
else
    echo -e "${YELLOW}📝 Создание начального коммита...${NC}"
    git add .
    git commit -m "🎉 Initial commit: настройка CI/CD для деплоя на Timeweb

- Добавлены скрипты автоматического деплоя
- Настроены Git Hooks для проверки кода
- Создана структура веток разработки
- Добавлены конфигурации безопасности"
fi

echo ""
echo -e "${PURPLE}🎉 Инициализация завершена успешно!${NC}"
echo "====================================="
echo ""
echo -e "${GREEN}📋 Следующие шаги:${NC}"
echo "1. Настройте переменные окружения в .env.local"
echo "2. Добавьте удаленный репозиторий Timeweb:"
echo "   ${BLUE}git remote add timeweb https://git.timeweb.com/username/repo.git${NC}"
echo "3. Отправьте код в репозиторий:"
echo "   ${BLUE}git push timeweb main${NC}"
echo "4. Настройте автоматический деплой в панели Timeweb"
echo ""
echo -e "${YELLOW}🔒 Не забудьте настроить безопасность:${NC}"
echo "- Используйте SSH ключи вместо паролей"
echo "- Включите двухфакторную аутентификацию"
echo "- Ограничьте доступ к серверу"
echo ""
echo -e "${GREEN}🚀 Проект готов к автоматическому деплою!${NC}"