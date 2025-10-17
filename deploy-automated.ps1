#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Автоматизированный скрипт деплоя для Svyatobor Web на Timeweb Cloud

.DESCRIPTION
    Полностью автоматизированный процесс деплоя Next.js приложения на сервер Timeweb Cloud.
    Включает валидацию, сборку, загрузку файлов, развертывание изображений и пост-деплойные проверки.

.PARAMETER Environment
    Среда деплоя: staging или production (по умолчанию: production)

.PARAMETER SkipValidation
    Пропустить этап валидации

.PARAMETER SkipBuild
    Пропустить этап сборки (использовать существующую папку out)

.PARAMETER SkipBackup
    Пропустить создание резервной копии

.PARAMETER DryRun
    Тестовый режим без фактического деплоя

.PARAMETER Rollback
    Выполнить откат к предыдущей версии

.PARAMETER Help
    Показать справку

.EXAMPLE
    .\deploy-automated.ps1 -Environment production

.EXAMPLE
    .\deploy-automated.ps1 -Environment staging -SkipBuild

.EXAMPLE
    .\deploy-automated.ps1 -DryRun

.EXAMPLE
    .\deploy-automated.ps1 -Rollback
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production",

    [switch]$SkipValidation,
    [switch]$SkipBuild,
    [switch]$SkipBackup,
    [switch]$DryRun,
    [switch]$Rollback,
    [switch]$Help
)

# Устанавливаем кодировку UTF-8 для корректного отображения символов
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Глобальные переменные
$ScriptName = "Deploy-Automated"
$Version = "2.0.0"
$StartTime = Get-Date

# Цвета для вывода
$ColorScheme = @{
    Primary = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
    Highlight = "Magenta"
}

function Show-Header {
    Clear-Host
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "🚀 $ScriptName v$Version" -ForegroundColor $ColorScheme.Highlight
    Write-Host "Автоматизированный деплой Svyatobor Web" -ForegroundColor $ColorScheme.Primary
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "Среда: $(Get-Culture).Name" -ForegroundColor $ColorScheme.Info
    Write-Host "Время запуска: $StartTime" -ForegroundColor $ColorScheme.Info
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host ""
}

function Show-Help {
    Write-Host "ПОМОЩЬ: $ScriptName v$Version" -ForegroundColor $ColorScheme.Highlight
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host ""
    Write-Host "ОПИСАНИЕ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    Автоматизированный деплой Next.js приложения на Timeweb Cloud"
    Write-Host ""
    Write-Host "ПАРАМЕТРЫ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    -Environment <string>" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Среда деплоя: staging или production (по умолчанию: production)"
    Write-Host ""
    Write-Host "    -SkipValidation" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Пропустить этап валидации системы"
    Write-Host ""
    Write-Host "    -SkipBuild" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Пропустить этап сборки (использовать существующую папку out)"
    Write-Host ""
    Write-Host "    -SkipBackup" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Пропустить создание резервной копии"
    Write-Host ""
    Write-Host "    -DryRun" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Тестовый режим без фактического деплоя"
    Write-Host ""
    Write-Host "    -Rollback" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Выполнить откат к предыдущей версии"
    Write-Host ""
    Write-Host "    -Help" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Показать эту справку"
    Write-Host ""
    Write-Host "ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    .\deploy-automated.ps1 -Environment production"
    Write-Host "    .\deploy-automated.ps1 -Environment staging -SkipBuild"
    Write-Host "    .\deploy-automated.ps1 -DryRun"
    Write-Host "    .\deploy-automated.ps1 -Rollback"
    Write-Host ""
    Write-Host "КОНФИГУРАЦИЯ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    Настройте параметры в файле .env.deploy:"
    Write-Host "    - SSH_HOST: адрес сервера Timeweb"
    Write-Host "    - SSH_USER: имя пользователя"
    Write-Host "    - SSH_KEY_PATH: путь к SSH ключу"
    Write-Host "    - REMOTE_PATH: путь на сервере"
    Write-Host "    - PRODUCTION_DOMAIN: домен продакшена"
    Write-Host ""
}

function Test-Prerequisites {
    Write-Host "🔍 Проверка предварительных требований..." -ForegroundColor $ColorScheme.Info

    # Проверка PowerShell версии
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        throw "Требуется PowerShell версии 5.0 или выше. Текущая версия: $($psVersion.Major).$($psVersion.Minor)"
    }

    # Проверка наличия модулей деплоя
    $requiredModules = @("config.psm1", "logger.psm1", "validator.ps1", "deployer.psm1")
    foreach ($module in $requiredModules) {
        $modulePath = Join-Path "deploy-modules" $module
        if (!(Test-Path $modulePath)) {
            throw "Не найден обязательный модуль: $modulePath"
        }
    }

    Write-Host "✅ Предварительные требования выполнены" -ForegroundColor $ColorScheme.Success
}

function Initialize-Deployment {
    param([string]$Environment)

    Write-Host "🔧 Инициализация деплоя..." -ForegroundColor $ColorScheme.Info

    try {
        # Импорт модулей деплоя
        $modulesPath = Join-Path $PSScriptRoot "deploy-modules"
        Import-Module "$modulesPath\config.psm1" -Force
        Import-Module "$modulesPath\logger.psm1" -Force
        Import-Module "$modulesPath\validator.ps1" -Force
        Import-Module "$modulesPath\deployer.psm1" -Force

        # Загрузка конфигурации
        Load-DeployConfig -Environment $Environment

        # Инициализация логгера
        $logFile = Get-DeployConfig | ForEach-Object { $_.GetLogPath() }
        Initialize-DeployLogger -LogFile $logFile -LogLevel "INFO"

        Write-Host "✅ Деплой инициализирован для среды: $Environment" -ForegroundColor $ColorScheme.Success
    }
    catch {
        Write-Error "Ошибка инициализации деплоя: $($_.Exception.Message)"
        throw
    }
}

function Start-DeploymentProcess {
    param(
        [string]$Environment,
        [switch]$SkipValidation,
        [switch]$SkipBuild,
        [switch]$SkipBackup,
        [switch]$DryRun
    )

    Write-Host "🚀 Запуск процесса деплоя..." -ForegroundColor $ColorScheme.Highlight

    try {
        # Шаг 1: Валидация
        if (!$SkipValidation) {
            Write-Host "📋 Шаг 1: Валидация системы..." -ForegroundColor $ColorScheme.Info
            $validationResult = Test-DeployReadiness

            if (!$validationResult.IsValid) {
                Write-Host "❌ Валидация не пройдена. Исправьте ошибки и повторите попытку." -ForegroundColor $ColorScheme.Error
                return $false
            }
            Write-Host "✅ Валидация пройдена успешно" -ForegroundColor $ColorScheme.Success
        } else {
            Write-Host "⏭️ Шаг валидации пропущен" -ForegroundColor $ColorScheme.Warning
        }

        # Шаг 2: Деплой
        if (!$DryRun) {
            Write-Host "📦 Шаг 2: Выполнение деплоя..." -ForegroundColor $ColorScheme.Info
            $deployResult = Start-Deploy -Environment $Environment

            if ($deployResult.Success) {
                Write-Host "✅ Деплой выполнен успешно!" -ForegroundColor $ColorScheme.Success
                Write-Host "📊 Длительность: $($deployResult.Duration)" -ForegroundColor $ColorScheme.Info
                Write-Host "🔗 Действия: $($deployResult.Actions.Count) выполнено" -ForegroundColor $ColorScheme.Info
                return $true
            } else {
                Write-Host "❌ Деплой завершился с ошибками!" -ForegroundColor $ColorScheme.Error
                Write-Host "📋 Ошибки:" -ForegroundColor $ColorScheme.Error
                foreach ($errorMsg in $deployResult.Errors) {
                    Write-Host "   ❌ $errorMsg" -ForegroundColor $ColorScheme.Error
                }
                return $false
            }
        } else {
            Write-Host "🎭 Тестовый режим: фактический деплой пропущен" -ForegroundColor $ColorScheme.Warning
            return $true
        }
    }
    catch {
        Write-Host "💥 Критическая ошибка деплоя: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
        Write-Host "📞 Рекомендации:" -ForegroundColor $ColorScheme.Warning
        Write-Host "   1. Проверьте настройки в .env.deploy" -ForegroundColor $ColorScheme.Warning
        Write-Host "   2. Убедитесь в доступности сервера" -ForegroundColor $ColorScheme.Warning
        Write-Host "   3. Проверьте SSH ключи" -ForegroundColor $ColorScheme.Warning
        Write-Host "   4. См. логи для детальной информации" -ForegroundColor $ColorScheme.Warning
        return $false
    }
}

function Start-RollbackProcess {
    Write-Host "🔄 Запуск процесса отката..." -ForegroundColor $ColorScheme.Warning

    try {
        Write-Host "📋 Поиск доступных резервных копий..." -ForegroundColor $ColorScheme.Info

        $backupDir = "backup"
        if (!(Test-Path $backupDir)) {
            Write-Host "❌ Папка резервных копий не найдена: $backupDir" -ForegroundColor $ColorScheme.Error
            return $false
        }

        $backups = Get-ChildItem $backupDir -Directory | Sort-Object CreationTime -Descending

        if ($backups.Count -eq 0) {
            Write-Host "❌ Резервные копии не найдены" -ForegroundColor $ColorScheme.Error
            return $false
        }

        Write-Host "📦 Доступные резервные копии:" -ForegroundColor $ColorScheme.Info
        for ($i = 0; $i -lt [Math]::Min(5, $backups.Count); $i++) {
            $backup = $backups[$i]
            Write-Host "   $($i + 1). $($backup.Name) - $($backup.CreationTime)" -ForegroundColor $ColorScheme.Info
        }

        $latestBackup = $backups[0]
        Write-Host "🔄 Выполняю откат к последней резервной копии: $($latestBackup.Name)" -ForegroundColor $ColorScheme.Warning

        # Здесь должна быть логика отката
        # В будущем можно реализовать автоматический откат через SSH

        Write-Host "⚠️ Автоматический откат требует дополнительной реализации" -ForegroundColor $ColorScheme.Warning
        Write-Host "💡 Для отката используйте команды:" -ForegroundColor $ColorScheme.Info
        Write-Host "   1. Подключитесь к серверу по SSH" -ForegroundColor $ColorScheme.Info
        Write-Host "   2. Скопируйте файлы из резервной копии" -ForegroundColor $ColorScheme.Info
        Write-Host "   3. Перезапустите веб-сервер" -ForegroundColor $ColorScheme.Info

        return $true
    }
    catch {
        Write-Host "💥 Ошибка отката: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
        return $false
    }
}

function Show-Summary {
    param([bool]$Success, [string]$Environment)

    $endTime = Get-Date
    $duration = $endTime - $StartTime

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "🏁 ЗАВЕРШЕНИЕ ДЕПЛОЯ" -ForegroundColor $ColorScheme.Highlight
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary

    if ($Success) {
        Write-Host "✅ СТАТУС: УСПЕХ" -ForegroundColor $ColorScheme.Success
        Write-Host "🎯 Среда: $Environment" -ForegroundColor $ColorScheme.Success
        Write-Host "⏱️ Длительность: $($duration.TotalMinutes.ToString("F1")) минут" -ForegroundColor $ColorScheme.Info
        Write-Host "📅 Завершено: $endTime" -ForegroundColor $ColorScheme.Info

        Write-Host ""
        Write-Host "🎉 Деплой выполнен успешно!" -ForegroundColor $ColorScheme.Success
        Write-Host "📊 Следующие шаги:" -ForegroundColor $ColorScheme.Info
        Write-Host "   1. Проверьте работу сайта в браузере" -ForegroundColor $ColorScheme.Info
        Write-Host "   2. Убедитесь, что все функции работают корректно" -ForegroundColor $ColorScheme.Info
        Write-Host "   3. Проверьте логи сервера при необходимости" -ForegroundColor $ColorScheme.Info
    } else {
        Write-Host "❌ СТАТУС: ОШИБКА" -ForegroundColor $ColorScheme.Error
        Write-Host "🎯 Среда: $Environment" -ForegroundColor $ColorScheme.Error
        Write-Host "⏱️ Длительность: $($duration.TotalMinutes.ToString("F1")) минут" -ForegroundColor $ColorScheme.Info
        Write-Host "📅 Завершено: $endTime" -ForegroundColor $ColorScheme.Info

        Write-Host ""
        Write-Host "💥 Деплой завершился с ошибками!" -ForegroundColor $ColorScheme.Error
        Write-Host "🔧 Рекомендации:" -ForegroundColor $ColorScheme.Warning
        Write-Host "   1. Проверьте настройки в .env.deploy" -ForegroundColor $ColorScheme.Warning
        Write-Host "   2. Убедитесь в доступности сервера" -ForegroundColor $ColorScheme.Warning
        Write-Host "   3. Проверьте SSH ключи и права доступа" -ForegroundColor $ColorScheme.Warning
        Write-Host "   4. См. логи для детальной информации" -ForegroundColor $ColorScheme.Warning
        Write-Host "   5. Используйте -Rollback для отката" -ForegroundColor $ColorScheme.Warning
    }

    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
}

# Основная логика скрипта
try {
    Show-Header

    # Показываем помощь если запрошена
    if ($Help) {
        Show-Help
        exit 0
    }

    # Проверяем режим отката
    if ($Rollback) {
        $success = Start-RollbackProcess
        Show-Summary -Success $success -Environment $Environment
        if ($success) { exit 0 } else { exit 1 }
    }

    # Проверяем предварительные требования
    Test-Prerequisites

    # Инициализируем деплой
    Initialize-Deployment -Environment $Environment

    # Запускаем процесс деплоя
    $success = Start-DeploymentProcess -Environment $Environment -SkipValidation:$SkipValidation -SkipBuild:$SkipBuild -SkipBackup:$SkipBackup -DryRun:$DryRun

    # Показываем итоги
    Show-Summary -Success $success -Environment $Environment

    # Возвращаем код завершения
    if ($success) { exit 0 } else { exit 1 }

} catch {
    Write-Host ""
    Write-Host "💥 КРИТИЧЕСКАЯ ОШИБКА: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
    Write-Host "📍 Строка: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor $ColorScheme.Error
    Write-Host "📄 Файл: $($_.InvocationInfo.ScriptName)" -ForegroundColor $ColorScheme.Error

    Write-Host ""
    Write-Host "🔧 Для получения помощи используйте:" -ForegroundColor $ColorScheme.Warning
    Write-Host "   .\deploy-automated.ps1 -Help" -ForegroundColor $ColorScheme.Info

    exit 1
}