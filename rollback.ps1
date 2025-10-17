#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Скрипт отката для Svyatobor Web

.DESCRIPTION
    Выполняет откат к предыдущей версии приложения в случае проблем с деплоем.
    Работает с локальными резервными копиями и серверными бэкапами.

.PARAMETER Environment
    Среда для отката: staging или production (по умолчанию: production)

.PARAMETER BackupName
    Имя конкретной резервной копии для отката

.PARAMETER ListBackups
    Показать список доступных резервных копий

.PARAMETER Force
    Принудительный откат без подтверждения

.PARAMETER Help
    Показать справку

.EXAMPLE
    .\rollback.ps1 -Environment production

.EXAMPLE
    .\rollback.ps1 -BackupName "production_20231017_143000"

.EXAMPLE
    .\rollback.ps1 -ListBackups

.EXAMPLE
    .\rollback.ps1 -Environment production -Force
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production",

    [Parameter(Mandatory = $false)]
    [string]$BackupName,

    [switch]$ListBackups,
    [switch]$Force,
    [switch]$Help
)

# Устанавливаем кодировку UTF-8 для корректного отображения символов
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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
    Write-Host "🔄 Rollback Script v1.0.0" -ForegroundColor $ColorScheme.Highlight
    Write-Host "Экстренный откат Svyatobor Web" -ForegroundColor $ColorScheme.Primary
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "Среда: $(Get-Culture).Name" -ForegroundColor $ColorScheme.Info
    Write-Host "Время запуска: $(Get-Date)" -ForegroundColor $ColorScheme.Info
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host ""
}

function Show-Help {
    Write-Host "ПОМОЩЬ: Rollback Script v1.0.0" -ForegroundColor $ColorScheme.Highlight
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host ""
    Write-Host "ОПИСАНИЕ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    Экстренный откат к предыдущей версии приложения"
    Write-Host ""
    Write-Host "ПАРАМЕТРЫ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    -Environment <string>" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Среда для отката: staging или production (по умолчанию: production)"
    Write-Host ""
    Write-Host "    -BackupName <string>" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Имя конкретной резервной копии для отката"
    Write-Host ""
    Write-Host "    -ListBackups" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Показать список доступных резервных копий"
    Write-Host ""
    Write-Host "    -Force" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Принудительный откат без подтверждения"
    Write-Host ""
    Write-Host "    -Help" -ForegroundColor $ColorScheme.Warning
    Write-Host "        Показать эту справку"
    Write-Host ""
    Write-Host "ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:" -ForegroundColor $ColorScheme.Success
    Write-Host "    .\rollback.ps1 -Environment production"
    Write-Host "    .\rollback.ps1 -BackupName 'production_20231017_143000'"
    Write-Host "    .\rollback.ps1 -ListBackups"
    Write-Host "    .\rollback.ps1 -Environment production -Force"
    Write-Host ""
}

function Get-AvailableBackups {
    param([string]$Environment)

    Write-Host "📋 Поиск резервных копий для среды: $Environment" -ForegroundColor $ColorScheme.Info

    $backups = @()

    # Локальные резервные копии
    $localBackupDir = "backup"
    if (Test-Path $localBackupDir) {
        $localBackups = Get-ChildItem $localBackupDir -Directory | Where-Object {
            $_.Name -like "$Environment*"
        } | Sort-Object CreationTime -Descending

        foreach ($backup in $localBackups) {
            $backups += @{
                Name = $backup.Name
                Path = $backup.FullName
                Type = "Локальная"
                Size = Get-DirectorySize -Path $backup.FullName
                Date = $backup.CreationTime
            }
        }
    }

    return $backups
}

function Show-BackupList {
    param([array]$Backups)

    if ($Backups.Count -eq 0) {
        Write-Host "❌ Резервные копии не найдены" -ForegroundColor $ColorScheme.Error
        return $false
    }

    Write-Host "📦 Доступные резервные копии:" -ForegroundColor $ColorScheme.Success
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary

    for ($i = 0; $i -lt $Backups.Count; $i++) {
        $backup = $Backups[$i]
        $sizeFormatted = FormatBytes -Bytes $backup.Size
        $dateFormatted = $backup.Date.ToString("yyyy-MM-dd HH:mm:ss")

        Write-Host "$($i + 1). $($backup.Name)" -ForegroundColor $ColorScheme.Warning
        Write-Host "   Тип: $($backup.Type)" -ForegroundColor $ColorScheme.Info
        Write-Host "   Размер: $sizeFormatted" -ForegroundColor $ColorScheme.Info
        Write-Host "   Дата: $dateFormatted" -ForegroundColor $ColorScheme.Info
        Write-Host "   Путь: $($backup.Path)" -ForegroundColor $ColorScheme.Info
        Write-Host ""
    }

    return $true
}

function Get-DirectorySize {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        return 0
    }

    $items = Get-ChildItem $Path -Recurse -ErrorAction SilentlyContinue
    $totalSize = 0

    foreach ($item in $items) {
        if (!$item.PSIsContainer) {
            $totalSize += $item.Length
        }
    }

    return $totalSize
}

function FormatBytes {
    param([long]$Bytes)

    $units = "Б", "КБ", "МБ", "ГБ", "ТБ"
    $i = 0

    while ($Bytes -ge 1KB -and $i -lt 4) {
        $Bytes = $Bytes / 1KB
        $i++
    }

    return "{0:N1} {1}" -f $Bytes, $units[$i]
}

function Confirm-Rollback {
    param([string]$BackupName, [string]$Environment)

    if ($Force) {
        return $true
    }

    Write-Host "⚠️ ВЫПОЛНЕНИЕ ОТКАТА" -ForegroundColor $ColorScheme.Warning
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "Среда: $Environment" -ForegroundColor $ColorScheme.Warning
    Write-Host "Резервная копия: $BackupName" -ForegroundColor $ColorScheme.Warning
    Write-Host ""
    Write-Host "Это действие:" -ForegroundColor $ColorScheme.Error
    Write-Host "  ❌ Заменит текущую версию приложения" -ForegroundColor $ColorScheme.Error
    Write-Host "  ❌ Может привести к потере данных" -ForegroundColor $ColorScheme.Error
    Write-Host "  ❌ Требует перезапуска веб-сервера" -ForegroundColor $ColorScheme.Error
    Write-Host ""

    $confirmation = Read-Host "Вы уверены, что хотите выполнить откат? (yes/no)"

    return $confirmation -eq "yes" -or $confirmation -eq "y"
}

function Test-ServerConnection {
    Write-Host "🔍 Проверка подключения к серверу..." -ForegroundColor $ColorScheme.Info

    # Импорт модулей
    Import-Module ".\deploy-modules\config.psm1" -Force
    Import-Module ".\deploy-modules\logger.psm1" -Force

    # Загрузка конфигурации
    Load-DeployConfig -Environment $Environment

    $config = Get-DeployConfig

    if ([string]::IsNullOrEmpty($config.SSHHost) -or [string]::IsNullOrEmpty($config.SSHUser)) {
        Write-Host "❌ SSH настройки неполные в .env.deploy" -ForegroundColor $ColorScheme.Error
        return $false
    }

    try {
        $sshOptions = $config.GetSSHOptions()
        $testCommand = "ssh $($sshOptions) $($config.SSHUser)@$($config.SSHHost) 'echo 'Подключение успешно' && ls -la $($config.RemotePath)'"

        $testProcess = Start-Process "bash" -ArgumentList "-c", $testCommand -NoNewWindow -Wait -PassThru

        if ($testProcess.ExitCode -eq 0) {
            Write-Host "✅ Подключение к серверу работает" -ForegroundColor $ColorScheme.Success
            return $true
        } else {
            Write-Host "❌ Не удалось подключиться к серверу" -ForegroundColor $ColorScheme.Error
            return $false
        }
    }
    catch {
        Write-Host "❌ Ошибка подключения: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
        return $false
    }
}

function Start-RollbackProcess {
    param([string]$BackupName, [string]$Environment)

    Write-Host "🔄 Начинаю процесс отката..." -ForegroundColor $ColorScheme.Warning

    try {
        # Шаг 1: Проверка подключения к серверу
        if (!(Test-ServerConnection)) {
            Write-Host "❌ Невозможно выполнить откат без подключения к серверу" -ForegroundColor $ColorScheme.Error
            return $false
        }

        # Шаг 2: Создание резервной копии текущего состояния
        Write-Host "💾 Создаю резервную копию текущего состояния..." -ForegroundColor $ColorScheme.Info
        $currentBackupName = "$Environment`_current_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        $currentBackupPath = "backup\$currentBackupName"

        if (Test-Path "out") {
            New-Item -ItemType Directory -Path $currentBackupPath -Force | Out-Null
            Copy-Item "out\*" $currentBackupPath -Recurse -Force
            Write-Host "✅ Текущая резервная копия создана: $currentBackupName" -ForegroundColor $ColorScheme.Success
        }

        # Шаг 3: Поиск выбранной резервной копии
        Write-Host "🔍 Поиск резервной копии: $BackupName" -ForegroundColor $ColorScheme.Info

        $backupPath = "backup\$BackupName"
        if (!(Test-Path $backupPath)) {
            Write-Host "❌ Резервная копия не найдена: $backupPath" -ForegroundColor $ColorScheme.Error
            return $false
        }

        # Шаг 4: Восстановление из резервной копии
        Write-Host "🔄 Восстанавливаю файлы из резервной копии..." -ForegroundColor $ColorScheme.Warning

        # Удаляем текущую сборку
        if (Test-Path "out") {
            Remove-Item "out" -Recurse -Force
        }

        # Копируем файлы из резервной копии
        Copy-Item "$backupPath\*" "out" -Recurse -Force

        Write-Host "✅ Файлы восстановлены из резервной копии" -ForegroundColor $ColorScheme.Success

        # Шаг 5: Деплой восстановленных файлов на сервер
        Write-Host "📤 Загружаю восстановленные файлы на сервер..." -ForegroundColor $ColorScheme.Info

        # Импорт модуля деплоя
        Import-Module ".\deploy-modules\deployer.psm1" -Force

        $deployResult = Start-Deploy -Environment $Environment

        if ($deployResult.Success) {
            Write-Host "✅ Откат выполнен успешно!" -ForegroundColor $ColorScheme.Success
            Write-Host "📊 Длительность отката: $($deployResult.Duration)" -ForegroundColor $ColorScheme.Info
            return $true
        } else {
            Write-Host "❌ Ошибка при деплое восстановленных файлов" -ForegroundColor $ColorScheme.Error
            return $false
        }

    }
    catch {
        Write-Host "💥 Критическая ошибка отката: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
        return $false
    }
}

# Основная логика скрипта
try {
    Show-Header

    # Показываем помощь если запрошена
    if ($Help) {
        Show-Help
        exit 0
    }

    # Показываем список резервных копий
    if ($ListBackups) {
        $backups = Get-AvailableBackups -Environment $Environment
        $hasBackups = Show-BackupList -Backups $backups

        if ($hasBackups) {
            Write-Host "💡 Используйте -BackupName для выбора конкретной резервной копии" -ForegroundColor $ColorScheme.Info
        }

        exit 0
    }

    # Определяем резервную копию для отката
    $targetBackup = $BackupName
    if ([string]::IsNullOrEmpty($targetBackup)) {
        $backups = Get-AvailableBackups -Environment $Environment

        if ($backups.Count -eq 0) {
            Write-Host "❌ Резервные копии не найдены для среды: $Environment" -ForegroundColor $ColorScheme.Error
            exit 1
        }

        $targetBackup = $backups[0].Name
        Write-Host "📋 Использую последнюю резервную копию: $targetBackup" -ForegroundColor $ColorScheme.Info
    }

    # Подтверждение отката
    if (!(Confirm-Rollback -BackupName $targetBackup -Environment $Environment)) {
        Write-Host "❌ Откат отменен пользователем" -ForegroundColor $ColorScheme.Warning
        exit 0
    }

    # Выполнение отката
    $success = Start-RollbackProcess -BackupName $targetBackup -Environment $Environment

    # Результаты
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary
    Write-Host "🏁 РЕЗУЛЬТАТ ОТКАТА" -ForegroundColor $ColorScheme.Highlight
    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary

    if ($success) {
        Write-Host "✅ ОТКАТ ВЫПОЛНЕН УСПЕШНО" -ForegroundColor $ColorScheme.Success
        Write-Host "🎯 Среда: $Environment" -ForegroundColor $ColorScheme.Success
        Write-Host "📦 Резервная копия: $targetBackup" -ForegroundColor $ColorScheme.Success
        Write-Host "📅 Время завершения: $(Get-Date)" -ForegroundColor $ColorScheme.Info

        Write-Host ""
        Write-Host "🎉 Приложение восстановлено из резервной копии!" -ForegroundColor $ColorScheme.Success
        Write-Host "📊 Рекомендации:" -ForegroundColor $ColorScheme.Info
        Write-Host "   1. Проверьте работу сайта в браузере" -ForegroundColor $ColorScheme.Info
        Write-Host "   2. Убедитесь, что все функции работают корректно" -ForegroundColor $ColorScheme.Info
        Write-Host "   3. Мониторьте логи сервера" -ForegroundColor $ColorScheme.Info
    } else {
        Write-Host "❌ ОТКАТ ЗАВЕРШИЛСЯ С ОШИБКАМИ" -ForegroundColor $ColorScheme.Error
        Write-Host "🎯 Среда: $Environment" -ForegroundColor $ColorScheme.Error
        Write-Host "📦 Резервная копия: $targetBackup" -ForegroundColor $ColorScheme.Error
        Write-Host "📅 Время завершения: $(Get-Date)" -ForegroundColor $ColorScheme.Info

        Write-Host ""
        Write-Host "💥 Во время отката произошли ошибки!" -ForegroundColor $ColorScheme.Error
        Write-Host "🔧 Возможные причины:" -ForegroundColor $ColorScheme.Warning
        Write-Host "   1. Проблемы с подключением к серверу" -ForegroundColor $ColorScheme.Warning
        Write-Host "   2. Поврежденная резервная копия" -ForegroundColor $ColorScheme.Warning
        Write-Host "   3. Недостаточно прав доступа" -ForegroundColor $ColorScheme.Warning
        Write-Host "   4. Проблемы с SSH ключами" -ForegroundColor $ColorScheme.Warning
    }

    Write-Host "==================================================" -ForegroundColor $ColorScheme.Primary

    if ($success) { exit 0 } else { exit 1 }

} catch {
    Write-Host ""
    Write-Host "💥 КРИТИЧЕСКАЯ ОШИБКА: $($_.Exception.Message)" -ForegroundColor $ColorScheme.Error
    Write-Host "📍 Строка: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor $ColorScheme.Error
    Write-Host "📄 Файл: $($_.InvocationInfo.ScriptName)" -ForegroundColor $ColorScheme.Error

    Write-Host ""
    Write-Host "🔧 Для получения помощи используйте:" -ForegroundColor $ColorScheme.Warning
    Write-Host "   .\rollback.ps1 -Help" -ForegroundColor $ColorScheme.Info

    exit 1
}