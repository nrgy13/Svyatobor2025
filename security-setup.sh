#!/bin/bash

# Скрипт настройки безопасности для деплоя на Timeweb
# Выполняет настройку SSH, firewall и мониторинг безопасности

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔒 Настройка безопасности для деплоя${NC}"

# Проверка прав администратора
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Запустите скрипт с правами администратора: sudo $0${NC}"
    exit 1
fi

echo -e "${YELLOW}🔐 Настройка SSH безопасности...${NC}"

# Создание SSH ключа для деплоя (если не существует)
SSH_KEY_PATH="$HOME/.ssh/timeweb_deploy"
if [ ! -f "$SSH_KEY_PATH" ]; then
    ssh-keygen -t ed25519 -C "deploy@svyatobor.ru" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✅ SSH ключ создан: $SSH_KEY_PATH${NC}"
else
    echo -e "${GREEN}✅ SSH ключ уже существует${NC}"
fi

# Настройка SSH конфигурации
cat >> ~/.ssh/config << EOF

# Timeweb сервер для деплоя
Host timeweb-deploy
    HostName your-server.timeweb.ru
    User your_username
    IdentityFile ~/.ssh/timeweb_deploy
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel QUIET
EOF

# Установка правильных прав доступа
chmod 600 ~/.ssh/timeweb_deploy
chmod 644 ~/.ssh/timeweb_deploy.pub
chmod 600 ~/.ssh/config

echo -e "${GREEN}✅ SSH безопасность настроена${NC}"

# Настройка firewall
echo -e "${YELLOW}🔥 Настройка firewall...${NC}"

# Установка UFW (если не установлен)
if ! command -v ufw &> /dev/null; then
    apt update
    apt install -y ufw
fi

# Настройка правил firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Разрешенные порты
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Разрешенные сети (опционально)
# ufw allow from 192.168.1.0/24

ufw --force enable

echo -e "${GREEN}✅ Firewall настроен${NC}"

# Настройка fail2ban для защиты от атак
echo -e "${YELLOW}🛡️  Настройка fail2ban...${NC}"

if ! command -v fail2ban-server &> /dev/null; then
    apt install -y fail2ban
fi

# Создание конфигурации fail2ban для веб-приложений
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}✅ Fail2ban настроен${NC}"

# Настройка мониторинга логов
echo -e "${YELLOW}📊 Настройка мониторинга...${NC}"

# Создание скрипта мониторинга деплоя
cat > /usr/local/bin/monitor-deploy << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/deploy-monitor.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Мониторинг деплоя:" >> $LOG_FILE

# Проверка доступности сайта
if curl -f -s https://svyatobor.ru/ > /dev/null; then
    echo "✅ Сайт доступен" >> $LOG_FILE
else
    echo "❌ Сайт недоступен" >> $LOG_FILE
fi

# Проверка использования ресурсов
echo "📊 Использование ресурсов:" >> $LOG_FILE
df -h | grep '/$' >> $LOG_FILE
free -h | grep '^Mem:' >> $LOG_FILE

# Проверка процессов Node.js
if pgrep -x "node" > /dev/null; then
    echo "✅ Node.js процессы активны" >> $LOG_FILE
else
    echo "❌ Node.js процессы не найдены" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/monitor-deploy

# Добавление мониторинга в cron (каждые 5 минут)
crontab -l | grep -v "monitor-deploy" | crontab -
echo "*/5 * * * * /usr/local/bin/monitor-deploy" | crontab -

echo -e "${GREEN}✅ Мониторинг настроен${NC}"

# Создание скрипта резервного копирования
echo -e "${YELLOW}💾 Настройка резервного копирования...${NC}"

cat > /usr/local/bin/backup-deploy << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/svyatobor"
LOG_FILE="/var/log/backup.log"

# Создание директории резервных копий
mkdir -p $BACKUP_DIR

# Создание резервной копии сайта
tar -czf "$BACKUP_DIR/site-$(date +%Y%m%d-%H%M%S).tar.gz" -C /var/www html/

# Очистка старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Резервная копия создана" >> $LOG_FILE
EOF

chmod +x /usr/local/bin/backup-deploy

# Добавление резервного копирования в cron (ежедневно в 2:00)
crontab -l | grep -v "backup-deploy" | crontab -
echo "0 2 * * * /usr/local/bin/backup-deploy" | crontab -

echo -e "${GREEN}✅ Резервное копирование настроено${NC}"

# Настройка уведомлений
echo -e "${YELLOW}📢 Настройка уведомлений...${NC}"

# Создание скрипта уведомлений
cat > /usr/local/bin/deploy-notifications << 'EOF'
#!/bin/bash
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
TELEGRAM_TOKEN="your_bot_token"
TELEGRAM_CHAT="your_chat_id"

MESSAGE="🚀 Деплой завершен на $(hostname) в $(date)"

# Отправка в Slack
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        $WEBHOOK_URL
fi

# Отправка в Telegram
if [ -n "$TELEGRAM_TOKEN" ] && [ -n "$TELEGRAM_CHAT" ]; then
    curl -s -X POST \
        "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT" \
        -d text="$MESSAGE"
fi
EOF

chmod +x /usr/local/bin/deploy-notifications

echo -e "${GREEN}✅ Уведомления настроены${NC}"

# Финальные проверки
echo -e "${YELLOW}🔍 Выполнение финальных проверок...${NC}"

# Проверка статуса служб
systemctl is-active --quiet nginx && echo "✅ Nginx активен" || echo "❌ Nginx не активен"
systemctl is-active --quiet fail2ban && echo "✅ Fail2ban активен" || echo "❌ Fail2ban не активен"

# Проверка SSH доступа
ssh -o ConnectTimeout=5 -i ~/.ssh/timeweb_deploy timeweb-deploy "echo 'SSH доступ работает'" 2>/dev/null && echo "✅ SSH доступ работает" || echo "❌ SSH доступ не работает"

echo ""
echo -e "${GREEN}🎉 Настройка безопасности завершена!${NC}"
echo ""
echo -e "${YELLOW}📋 Рекомендации по безопасности:${NC}"
echo "1. Регулярно обновляйте систему: ${BLUE}sudo apt update && sudo apt upgrade${NC}"
echo "2. Мониторьте логи: ${BLUE}sudo tail -f /var/log/auth.log${NC}"
echo "3. Используйте VPN для доступа к серверу"
echo "4. Регулярно меняйте пароли"
echo "5. Настройте резервное копирование на внешний сервер"
echo ""
echo -e "${BLUE}🔑 Публичный SSH ключ для добавления в Timeweb:${NC}"
cat ~/.ssh/timeweb_deploy.pub