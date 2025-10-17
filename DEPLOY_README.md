# 🚀 Система Автоматизированного Деплоя Svyatobor Web

Полностью автоматизированная система развертывания Next.js приложения на сервер Timeweb Cloud с поддержкой Windows PowerShell.

## 📋 Содержание

- [Возможности](#возможности)
- [Структура файлов](#структура-файлов)
- [Быстрый старт](#быстрый-старт)
- [Подробная настройка](#подробная-настройка)
- [Команды деплоя](#команды-деплоя)
- [Откат системы](#откат-системы)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Устранение проблем](#устранение-проблем)
- [Лучшие практики](#лучшие-практики)

## ✨ Возможности

### 🔧 Полная автоматизация
- Автоматическая сборка Next.js приложения
- Загрузка файлов через SSH + rsync
- Развертывание изображений в несколько папок
- Пост-деплойные проверки и перезапуск сервера

### 🛡️ Безопасность и надежность
- Валидация системы перед деплоем
- Создание резервных копий (только продакшн)
- Обработка ошибок и откат при сбоях
- Детальное логирование всех действий

### 🎯 Адаптация для Windows PowerShell
- Корректный синтаксис для PowerShell
- Использование Invoke-WebRequest вместо curl
- Правильная обработка путей и команд
- Поддержка кириллических символов

### 📊 Мониторинг и контроль
- Пост-деплойная проверка здоровья приложения
- Детальные логи с уровнями важности
- Отчеты о статусе деплоя
- Мониторинг использования ресурсов

## 📁 Структура файлов

```
deploy-automated.ps1          # Основной скрипт деплоя
rollback.ps1                  # Скрипт отката
deploy-modules/               # Модули системы деплоя
├── config.psm1              # Модуль конфигурации
├── logger.psm1              # Модуль логирования
├── validator.ps1            # Модуль валидации
└── deployer.psm1            # Модуль деплоя
.env.deploy                  # Переменные окружения
DEPLOY_README.md             # Документация (этот файл)
```

## 🚀 Быстрый старт

### 1. Предварительная настройка

Убедитесь, что у вас есть:
- ✅ PowerShell 5.0 или выше
- ✅ SSH клиент (Git Bash или OpenSSH)
- ✅ Настроенный SSH ключ для сервера Timeweb
- ✅ Файл `.env.deploy` с правильными настройками

### 2. Базовый деплой

```powershell
# Деплой в продакшн (рекомендуется)
.\deploy-automated.ps1 -Environment production

# Деплой в staging
.\deploy-automated.ps1 -Environment staging

# Тестовый режим (без фактического деплоя)
.\deploy-automated.ps1 -DryRun
```

### 3. Проверка готовности

```powershell
# Полная проверка системы
.\deploy-automated.ps1 -Environment production -SkipValidation:$false

# Только проверка проекта
.\deploy-modules\validator.ps1 -ProjectOnly

# Только проверка сервера
.\deploy-modules\validator.ps1 -ServerOnly
```

## ⚙️ Подробная настройка

### Настройка .env.deploy

Создайте или отредактируйте файл `.env.deploy`:

```bash
# Timeweb Cloud - SSH доступ (основной метод)
SSH_HOST=ВАШ_СЕРВЕР.timeweb.ru
SSH_USER=ВАШ_ЛОГИН_ОТ_TIMEWEB
SSH_KEY_PATH=~/.ssh/id_rsa

# FTP настройки (если доступны)
FTP_HOST=ftp.timeweb.ru
FTP_USER=ВАШ_ЛОГИН_ОТ_TIMEWEB
FTP_PASS=ВАШ_ПАРОЛЬ_ОТ_TIMEWEB

# Пути на сервере
REMOTE_PATH=/var/www/html
BACKUP_PATH=/var/www/backup

# Домены
PRODUCTION_DOMAIN=svyatobor.ru
STAGING_DOMAIN=staging.svyatobor.ru

# Логирование
LOG_LEVEL=info
LOG_FILE=logs/deploy.log
LOG_MAX_SIZE=10MB

# Резервное копирование
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
```

### Настройка SSH доступа

1. **Генерация SSH ключа:**
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@svyatobor.ru" -f ~/.ssh/timeweb_key
```

2. **Добавление ключа на сервер:**
```bash
ssh-copy-id -i ~/.ssh/timeweb_key.pub ВАШ_ЛОГИН@ВАШ_СЕРВЕР.timeweb.ru
```

3. **Проверка подключения:**
```bash
ssh -i ~/.ssh/timeweb_key ВАШ_ЛОГИН@ВАШ_СЕРВЕР.timeweb.ru "echo 'SSH работает!'"
```

## 🎮 Команды деплоя

### Основные команды

| Команда | Описание |
|---------|----------|
| `.\deploy-automated.ps1` | Полный деплой в продакшн |
| `.\deploy-automated.ps1 -Environment staging` | Деплой в staging |
| `.\deploy-automated.ps1 -SkipBuild` | Деплой без пересборки |
| `.\deploy-automated.ps1 -DryRun` | Тестовый режим |

### Расширенные параметры

```powershell
# Деплой с пропуском валидации
.\deploy-automated.ps1 -SkipValidation

# Деплой без создания резервной копии
.\deploy-automated.ps1 -SkipBackup

# Комбинированные параметры
.\deploy-automated.ps1 -Environment production -SkipValidation -SkipBuild

# Полная проверка системы
.\deploy-automated.ps1 -Environment production
```

### Модульные команды

```powershell
# Только валидация
.\deploy-modules\validator.ps1

# Только сборка
npm run build

# Только деплой (если сборка уже выполнена)
.\deploy-modules\deployer.ps1

# Проверка подключения к серверу
.\deploy-modules\deployer.ps1 -ConnectionTest
```

## 🔄 Откат системы

### Автоматический откат

```powershell
# Откат к последней резервной копии
.\rollback.ps1

# Откат к конкретной резервной копии
.\rollback.ps1 -BackupName "production_20231017_143000"

# Показать список доступных резервных копий
.\rollback.ps1 -ListBackups

# Принудительный откат без подтверждения
.\rollback.ps1 -Force
```

### Ручной откат

Если автоматический откат недоступен:

1. **Подключитесь к серверу:**
```bash
ssh ВАШ_ЛОГИН@ВАШ_СЕРВЕР.timeweb.ru
```

2. **Найдите резервную копию:**
```bash
ls -la /var/www/backup/
```

3. **Восстановите файлы:**
```bash
cp -r /var/www/backup/ИМЯ_РЕЗЕРВНОЙ_КОПИИ/* /var/www/html/
```

4. **Перезапустите сервер:**
```bash
sudo systemctl restart nginx
```

## 📊 Мониторинг и логи

### Структура логов

```
logs/
├── deploy.log              # Основной лог деплоя
├── deploy_20231017_143000.log  # Ротированные логи
└── error.log              # Критические ошибки
```

### Уровни логирования

- **DEBUG**: Подробная информация для отладки
- **INFO**: Общая информация о процессе (по умолчанию)
- **WARN**: Предупреждения
- **ERROR**: Ошибки
- **FATAL**: Критические ошибки

### Просмотр логов

```powershell
# Последние записи в логе
Get-Content logs/deploy.log -Tail 20

# Поиск ошибок
Get-Content logs/deploy.log | Select-String "ERROR"

# Мониторинг в реальном времени
Get-Content logs/deploy.log -Wait
```

### Метрики деплоя

После каждого деплоя система предоставляет:
- ⏱️ Время выполнения
- 📦 Размер приложения
- 🔗 Количество загруженных файлов
- 📊 Статус каждой операции
- 🚨 Обнаруженные проблемы

## 🚨 Устранение проблем

### Распространенные ошибки

#### ❌ "SSH_HOST не настроен"
**Решение:**
1. Откройте `.env.deploy`
2. Укажите правильный адрес сервера Timeweb
3. Пример: `SSH_HOST=vh123.timeweb.ru`

#### ❌ "SSH ключ не найден"
**Решение:**
1. Проверьте путь к SSH ключу в `.env.deploy`
2. Убедитесь, что ключ существует: `Test-Path ~/.ssh/id_rsa`
3. Настройте правильные права: `chmod 600 ~/.ssh/id_rsa`

#### ❌ "Сборка завершилась с ошибкой"
**Решение:**
1. Проверьте зависимости: `npm install`
2. Очистите кэш: `npm run clean` (если доступно)
3. Проверьте переменные окружения в `.env`

#### ❌ "Сервер недоступен"
**Решение:**
1. Проверьте подключение: `ping ВАШ_СЕРВЕР.timeweb.ru`
2. Убедитесь в правильности SSH настроек
3. Свяжитесь с поддержкой Timeweb

### Диагностика

```powershell
# Полная диагностика системы
.\deploy-modules\validator.ps1

# Проверка только системных требований
.\deploy-modules\validator.ps1 -SystemOnly

# Проверка только структуры проекта
.\deploy-modules\validator.ps1 -ProjectOnly

# Проверка только подключения к серверу
.\deploy-modules\validator.ps1 -ServerOnly
```

### Сбор информации для поддержки

```powershell
# Сохраните эту информацию при обращении в поддержку
Write-Output "=== ДИАГНОСТИЧЕСКАЯ ИНФОРМАЦИЯ ==="
Write-Output "PowerShell версия: $($PSVersionTable.PSVersion)"
Write-Output "Операционная система: $(Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version)"
Write-Output "Время: $(Get-Date)"
Write-Output "Последние логи:"
Get-Content logs/deploy.log -Tail 10
```

## 📚 Лучшие практики

### Перед деплоем

1. **✅ Всегда выполняйте тестовый деплой:**
```powershell
.\deploy-automated.ps1 -DryRun
```

2. **✅ Проверяйте валидацию:**
```powershell
.\deploy-modules\validator.ps1
```

3. **✅ Создавайте резервные копии:**
```powershell
# Перед важными обновлениями
.\deploy-automated.ps1 -Environment staging
```

### Во время деплоя

1. **📊 Мониторьте процесс:**
- Следите за выводом скрипта
- Проверяйте логи в реальном времени
- Не закрывайте консоль до завершения

2. **🚨 Будьте готовы к откату:**
- Имейте под рукой команду отката
- Следите за статусом приложения
- Проверяйте работу критических функций

### После деплоя

1. **🔍 Проверяйте приложение:**
- Откройте сайт в браузере
- Протестируйте основные функции
- Проверьте загрузку изображений

2. **📈 Мониторьте производительность:**
- Следите за логами сервера
- Проверяйте использование ресурсов
- Мониторьте доступность сайта

### Безопасность

1. **🔐 SSH ключи:**
- Используйте отдельные ключи для деплоя
- Не используйте парольную аутентификацию
- Регулярно ротируйте ключи

2. **📁 Права доступа:**
- Минимальные права для пользователя деплоя
- Регулярные аудиты доступа
- Мониторинг логов аутентификации

3. **🔄 Резервное копирование:**
- Автоматическое резервное копирование при деплое
- Регулярное тестирование восстановления
- Хранение резервных копий в безопасном месте

## 🔧 Расширенная настройка

### Кастомизация модулей

Каждый модуль можно настроить под ваши нужды:

#### Конфигурация (config.psm1)
```powershell
# Добавьте кастомные настройки
$Global:DeployConfig.CustomSetting = "value"
```

#### Логирование (logger.psm1)
```powershell
# Измените уровень логирования
Initialize-DeployLogger -LogLevel "DEBUG"
```

#### Валидация (validator.ps1)
```powershell
# Добавьте кастомные проверки
function Test-CustomValidation { ... }
```

### Интеграция с CI/CD

Для интеграции с системами непрерывной интеграции:

1. **GitHub Actions:**
```yaml
- name: Deploy to Production
  run: .\deploy-automated.ps1 -Environment production
```

2. **GitLab CI:**
```yaml
deploy:
  script:
    - pwsh -File deploy-automated.ps1 -Environment $CI_ENVIRONMENT_NAME
```

3. **Jenkins:**
```groovy
powershell '''
.\deploy-automated.ps1 -Environment production
'''
```

## 📞 Поддержка

### Полезные команды

```powershell
# Показать справку
.\deploy-automated.ps1 -Help

# Показать справку по откату
.\rollback.ps1 -Help

# Показать доступные резервные копии
.\rollback.ps1 -ListBackups

# Полная диагностика
.\deploy-modules\validator.ps1
```

### Контакты

При возникновении проблем:
1. Проверьте логи в папке `logs/`
2. Выполните диагностику системы
3. Соберите информацию для поддержки
4. Обратитесь к документации Timeweb Cloud

---

**Создано для проекта Svyatobor Web** 🚀
**Версия системы деплоя: 2.0.0**
**Дата обновления: 18.10.2025**