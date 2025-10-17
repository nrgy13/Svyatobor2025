# Модуль логирования для деплоя
# Обеспечивает детальное логирование всех действий с поддержкой ротации файлов

enum LogLevel {
    DEBUG = 0
    INFO = 1
    WARN = 2
    ERROR = 3
    FATAL = 4
}

class DeployLogger {
    [string]$LogFile
    [LogLevel]$MinLevel
    [int]$MaxFileSize
    [bool]$ShowConsole
    [bool]$ShowTimestamp
    [bool]$ShowLevel

    DeployLogger([string]$logFile, [LogLevel]$minLevel = [LogLevel]::INFO) {
        $this.LogFile = $logFile
        $this.MinLevel = $minLevel
        $this.MaxFileSize = 10MB
        $this.ShowConsole = $true
        $this.ShowTimestamp = $true
        $this.ShowLevel = $true

        # Создаем директорию для логов если она не существует
        $logDir = Split-Path $this.LogFile -Parent
        if ($logDir -and !(Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
    }

    [string] FormatMessage([LogLevel]$level, [string]$message) {
        $timestamp = if ($this.ShowTimestamp) { "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')]" } else { "" }
        $levelStr = if ($this.ShowLevel) { "[$($level.ToString())]" } else { "" }

        $formatted = "$timestamp$levelStr $message"
        return $formatted.Trim()
    }

    [void] WriteToFile([string]$message) {
        try {
            # Проверяем размер файла и ротируем если необходимо
            if (Test-Path $this.LogFile) {
                $fileSize = (Get-Item $this.LogFile).Length
                if ($fileSize -gt $this.MaxFileSize) {
                    $this.RotateLogFile()
                }
            }

            Add-Content -Path $this.LogFile -Value $message -Encoding UTF8
        }
        catch {
            Write-Warning "Не удалось записать в файл лога: $($_.Exception.Message)"
        }
    }

    [void] RotateLogFile() {
        try {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupFile = $this.LogFile -replace '\.log$', "_$timestamp.log"

            if (Test-Path $this.LogFile) {
                Move-Item -Path $this.LogFile -Destination $backupFile -Force
            }
        }
        catch {
            Write-Warning "Не удалось ротировать файл лога: $($_.Exception.Message)"
        }
    }

    [void] WriteLog([LogLevel]$level, [string]$message) {
        if ($level -ge $this.MinLevel) {
            $formattedMessage = $this.FormatMessage($level, $message)
            $this.WriteToFile($formattedMessage)

            if ($this.ShowConsole) {
                $this.WriteToConsole($level, $formattedMessage)
            }
        }
    }

    [void] WriteToConsole([LogLevel]$level, [string]$message) {
        $color = switch ($level) {
            ([LogLevel]::DEBUG) { "Gray" }
            ([LogLevel]::INFO) { "Green" }
            ([LogLevel]::WARN) { "Yellow" }
            ([LogLevel]::ERROR) { "Red" }
            ([LogLevel]::FATAL) { "Magenta" }
        }

        Write-Host $message -ForegroundColor $color
    }

    [void] Debug([string]$message) { $this.WriteLog([LogLevel]::DEBUG, $message) }
    [void] Info([string]$message) { $this.WriteLog([LogLevel]::INFO, $message) }
    [void] Warn([string]$message) { $this.WriteLog([LogLevel]::WARN, $message) }
    [void] Error([string]$message) { $this.WriteLog([LogLevel]::ERROR, $message) }
    [void] Fatal([string]$message) { $this.WriteLog([LogLevel]::FATAL, $message) }

    [void] LogStep([string]$step, [string]$details = "") {
        $message = "🚀 ШАГ: $step"
        if ($details) {
            $message += " - $details"
        }
        $this.Info($message)
    }

    [void] LogError([string]$operation, [string]$errorMessage) {
        $message = "❌ ОШИБКА в $operation`: $errorMessage"
        $this.Error($message)
    }

    [void] LogSuccess([string]$operation, [string]$details = "") {
        $message = "✅ УСПЕХ: $operation"
        if ($details) {
            $message += " - $details"
        }
        $this.Info($message)
    }

    [void] LogWarning([string]$operation, [string]$warningMessage) {
        $message = "⚠️  ПРЕДУПРЕЖДЕНИЕ в $operation`: $warningMessage"
        $this.Warn($message)
    }

    [void] LogProgress([string]$operation, [int]$current, [int]$total) {
        $percentage = [math]::Round(($current / $total) * 100, 1)
        $message = "📈 ПРОГРЕСС: $operation - $current/$total ($percentage%)"
        $this.Info($message)
    }

    [void] LogDeploymentStart([string]$environment, [string]$version) {
        $this.Info("==================================================")
        $this.Info("🚀 НАЧАЛО ДЕПЛОЯ")
        $this.Info("Среда: $environment")
        $this.Info("Версия: $version")
        $this.Info("Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
        $this.Info("==================================================")
    }

    [void] LogDeploymentEnd([string]$environment, [string]$status, [string]$duration) {
        $this.Info("==================================================")
        $this.Info("🏁 ЗАВЕРШЕНИЕ ДЕПЛОЯ")
        $this.Info("Среда: $environment")
        $this.Info("Статус: $status")
        $this.Info("Длительность: $duration")
        $this.Info("Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
        $this.Info("==================================================")
    }
}

# Глобальный экземпляр логгера
$Global:DeployLogger = $null

function Initialize-DeployLogger {
    param(
        [string]$LogFile = "logs/deploy.log",
        [string]$LogLevel = "INFO"
    )

    $level = switch ($LogLevel.ToUpper()) {
        "DEBUG" { [LogLevel]::DEBUG }
        "WARN" { [LogLevel]::WARN }
        "ERROR" { [LogLevel]::ERROR }
        "FATAL" { [LogLevel]::FATAL }
        default { [LogLevel]::INFO }
    }

    $Global:DeployLogger = [DeployLogger]::new($LogFile, $level)
    $Global:DeployLogger.Info("Логгер инициализирован: $LogFile (уровень: $LogLevel)")
}

function Get-DeployLogger {
    if ($null -eq $Global:DeployLogger) {
        Initialize-DeployLogger
    }
    return $Global:DeployLogger
}

function Write-DeployLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $logger = Get-DeployLogger

    switch ($Level.ToUpper()) {
        "DEBUG" { $logger.Debug($Message) }
        "WARN" { $logger.Warn($Message) }
        "ERROR" { $logger.Error($Message) }
        "FATAL" { $logger.Fatal($Message) }
        default { $logger.Info($Message) }
    }
}

function Write-DeployStep {
    param([string]$Step, [string]$Details = "")
    $logger = Get-DeployLogger
    $logger.LogStep($Step, $Details)
}

function Write-DeployError {
    param([string]$Operation, [string]$ErrorMessage)
    $logger = Get-DeployLogger
    $logger.LogError($Operation, $ErrorMessage)
}

function Write-DeploySuccess {
    param([string]$Operation, [string]$Details = "")
    $logger = Get-DeployLogger
    $logger.LogSuccess($Operation, $Details)
}

function Write-DeployWarning {
    param([string]$Operation, [string]$WarningMessage)
    $logger = Get-DeployLogger
    $logger.LogWarning($Operation, $WarningMessage)
}

function Write-DeployProgress {
    param([string]$Operation, [int]$Current, [int]$Total)
    $logger = Get-DeployLogger
    $logger.LogProgress($Operation, $Current, $Total)
}

# Инициализация логгера при импорте модуля
if ($null -eq $Global:DeployLogger) {
    Initialize-DeployLogger
}

Export-ModuleMember -Function Get-DeployLogger, Write-DeployLog, Write-DeployStep, Write-DeployError, Write-DeploySuccess, Write-DeployWarning, Write-DeployProgress