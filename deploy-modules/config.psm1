# Модуль конфигурации для деплоя
# Управляет настройками и переменными окружения

class DeployConfig {
    # Основные настройки сервера
    [string]$SSHHost
    [string]$SSHUser
    [string]$SSHKeyPath
    [string]$RemotePath

    # FTP настройки (альтернатива)
    [string]$FTPHost
    [string]$FTPUser
    [string]$FTPPass

    # Домены
    [string]$ProductionDomain
    [string]$StagingDomain

    # Пути проекта
    [string]$ProjectRoot
    [string]$BuildDir
    [string]$BackupDir

    # Настройки логирования
    [string]$LogLevel
    [string]$LogFile
    [int]$LogMaxSize

    # Настройки резервного копирования
    [bool]$BackupEnabled
    [int]$BackupRetentionDays
    [string]$BackupCompression

    # Настройки безопасности
    [bool]$DeployKeyEncryption
    [string[]]$AllowedBranches
    [bool]$RequireMFAForDeploy

    # Настройки производительности
    [bool]$EnableCompression
    [bool]$CacheStaticAssets
    [bool]$CDNEnabled

    # Настройки мониторинга
    [string]$HealthCheckURL
    [string]$MonitoringEmail

    # Настройки уведомлений
    [string]$SlackWebhookURL
    [string]$TelegramBotToken
    [string]$TelegramChatID

    DeployConfig() {
        $this.ProjectRoot = $PSScriptRoot | Split-Path -Parent
        $this.BuildDir = "out"
        $this.BackupDir = "backup"
        $this.LogLevel = "info"
        $this.LogFile = "logs/deploy.log"
        $this.LogMaxSize = 10MB
        $this.BackupEnabled = $true
        $this.BackupRetentionDays = 30
        $this.BackupCompression = "gzip"
        $this.DeployKeyEncryption = $true
        $this.AllowedBranches = @("develop", "staging", "production")
        $this.RequireMFAForDeploy = $true
        $this.EnableCompression = $true
        $this.CacheStaticAssets = $true
        $this.CDNEnabled = $false
    }

    [void] LoadFromEnvFile([string]$envFile) {
        if (Test-Path $envFile) {
            Write-Host "📋 Загружаю переменные окружения из $envFile" -ForegroundColor Blue

            Get-Content $envFile | ForEach-Object {
                if ($_ -match '^([^=]+)=(.*)$') {
                    $key = $matches[1].Trim()
                    $value = $matches[2].Trim()

                    switch ($key) {
                        "SSH_HOST" { $this.SSHHost = $value }
                        "SSH_USER" { $this.SSHUser = $value }
                        "SSH_KEY_PATH" { $this.SSHKeyPath = $value }
                        "REMOTE_PATH" { $this.RemotePath = $value }
                        "FTP_HOST" { $this.FTPHost = $value }
                        "FTP_USER" { $this.FTPUser = $value }
                        "FTP_PASS" { $this.FTPPass = $value }
                        "PRODUCTION_DOMAIN" { $this.ProductionDomain = $value }
                        "STAGING_DOMAIN" { $this.StagingDomain = $value }
                        "LOG_LEVEL" { $this.LogLevel = $value }
                        "LOG_FILE" { $this.LogFile = $value }
                        "LOG_MAX_SIZE" { $this.LogMaxSize = $this.ParseSize($value) }
                        "BACKUP_ENABLED" { $this.BackupEnabled = $this.ParseBool($value) }
                        "BACKUP_RETENTION_DAYS" { $this.BackupRetentionDays = [int]$value }
                        "BACKUP_COMPRESSION" { $this.BackupCompression = $value }
                        "DEPLOY_KEY_ENCRYPTION" { $this.DeployKeyEncryption = $this.ParseBool($value) }
                        "REQUIRE_MFA_FOR_DEPLOY" { $this.RequireMFAForDeploy = $this.ParseBool($value) }
                        "ENABLE_COMPRESSION" { $this.EnableCompression = $this.ParseBool($value) }
                        "CACHE_STATIC_ASSETS" { $this.CacheStaticAssets = $this.ParseBool($value) }
                        "CDN_ENABLED" { $this.CDNEnabled = $this.ParseBool($value) }
                        "HEALTH_CHECK_URL" { $this.HealthCheckURL = $value }
                        "MONITORING_EMAIL" { $this.MonitoringEmail = $value }
                        "SLACK_WEBHOOK_URL" { $this.SlackWebhookURL = $value }
                        "TELEGRAM_BOT_TOKEN" { $this.TelegramBotToken = $value }
                        "TELEGRAM_CHAT_ID" { $this.TelegramChatID = $value }
                    }
                }
            }
        } else {
            Write-Warning "Файл окружения $envFile не найден"
        }
    }

    [bool] ParseBool([string]$value) {
        return $value -eq "true" -or $value -eq "1"
    }

    [int] ParseSize([string]$sizeStr) {
        if ($sizeStr -match '(\d+)([KMGT]?B?)') {
            $size = [int]$matches[1]
            $unit = $matches[2]

            switch ($unit.ToUpper()) {
                "KB" { return $size * 1KB }
                "MB" { return $size * 1MB }
                "GB" { return $size * 1GB }
                "TB" { return $size * 1TB }
                default { return $size }
            }
        }
        return 1MB
    }

    [void] Validate() {
        $errors = @()

        if ([string]::IsNullOrEmpty($this.SSHHost)) {
            $errors += "SSH_HOST не настроен"
        }
        if ([string]::IsNullOrEmpty($this.SSHUser)) {
            $errors += "SSH_USER не настроен"
        }
        if ([string]::IsNullOrEmpty($this.RemotePath)) {
            $errors += "REMOTE_PATH не настроен"
        }
        if ([string]::IsNullOrEmpty($this.ProductionDomain)) {
            $errors += "PRODUCTION_DOMAIN не настроен"
        }

        if ($errors.Count -gt 0) {
            throw "Ошибки конфигурации:`n$($errors -join "`n")"
        }
    }

    [string] GetBackupPath([string]$environment) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        return Join-Path $this.BackupDir "$environment`_$timestamp"
    }

    [string] GetLogPath() {
        $logDir = Split-Path $this.LogFile -Parent
        if ($logDir -and !(Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        return $this.LogFile
    }
}

# Глобальная переменная конфигурации
$Global:DeployConfig = [DeployConfig]::new()

# Функции экспорта модуля
function Get-DeployConfig {
    return $Global:DeployConfig
}

function Set-DeployConfig {
    param([DeployConfig]$Config)
    $Global:DeployConfig = $Config
}

function Load-DeployConfig {
    param([string]$Environment = "production")

    $envFile = ".env.deploy"
    if (!(Test-Path $envFile)) {
        $envFile = ".env"
    }

    $Global:DeployConfig.LoadFromEnvFile($envFile)
    $Global:DeployConfig.Validate()

    Write-Host "✅ Конфигурация загружена для среды: $Environment" -ForegroundColor Green
}

Export-ModuleMember -Function Get-DeployConfig, Set-DeployConfig, Load-DeployConfig