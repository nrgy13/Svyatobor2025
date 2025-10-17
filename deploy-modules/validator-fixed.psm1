# Модуль валидации для деплоя
# Проверяет готовность системы к развертыванию

using module ".\config.psm1"
using module ".\logger.psm1"

class ValidationResult {
    [bool]$IsValid
    [string[]]$Errors
    [string[]]$Warnings
    [string[]]$Info

    ValidationResult() {
        $this.IsValid = $true
        $this.Errors = @()
        $this.Warnings = @()
        $this.Info = @()
    }

    [void] AddError([string]$errorMessage) {
        $this.IsValid = $false
        $this.Errors += $errorMessage
    }

    [void] AddWarning([string]$warning) {
        $this.Warnings += $warning
    }

    [void] AddInfo([string]$info) {
        $this.Info += $info
    }
}

class DeployValidator {
    [DeployConfig]$Config
    [DeployLogger]$Logger

    DeployValidator([DeployConfig]$config, [DeployLogger]$logger) {
        $this.Config = $config
        $this.Logger = $logger
    }

    [ValidationResult] ValidateAll() {
        $this.Logger.LogStep("ВАЛИДАЦИЯ СИСТЕМЫ", "Проверка готовности к деплою")

        $result = [ValidationResult]::new()

        # Проверяем системные требования
        $this.ValidateSystemRequirements($result)

        # Проверяем конфигурацию
        $this.ValidateConfiguration($result)

        # Проверяем проект
        $this.ValidateProject($result)

        # Проверяем сборку
        $this.ValidateBuild($result)

        # Проверяем сервер
        $this.ValidateServer($result)

        # Выводим результаты
        $this.DisplayValidationResults($result)

        return $result
    }

    [void] ValidateSystemRequirements([ValidationResult]$result) {
        $this.Logger.Info("🔍 Проверка системных требований...")

        # Проверка PowerShell версии
        $psVersionInfo = $PSVersionTable.PSVersion
        if ($psVersionInfo.Major -lt 5) {
            $result.AddError("Требуется PowerShell версии 5.0 или выше. Текущая версия: $($psVersionInfo.Major).$($psVersionInfo.Minor)")
        } else {
            $result.AddInfo("✅ PowerShell версия: $($psVersionInfo.Major).$($psVersionInfo.Minor)")
        }

        # Проверка наличия SSH клиента
        try {
            $sshVersion = ssh -V 2>$null
            if ($LASTEXITCODE -eq 0) {
                $result.AddInfo("✅ SSH клиент доступен")
            } else {
                $result.AddWarning("⚠️ SSH клиент не найден или не настроен")
            }
        }
        catch {
            $result.AddWarning("⚠️ SSH клиент не найден или не настроен")
        }

        # Проверка наличия Git
        try {
            $gitVersion = git --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $result.AddInfo("✅ Git доступен")
            } else {
                $result.AddWarning("⚠️ Git не найден")
            }
        }
        catch {
            $result.AddWarning("⚠️ Git не найден")
        }
    }

    [void] ValidateConfiguration([ValidationResult]$result) {
        $this.Logger.Info("🔍 Проверка конфигурации...")

        # Проверка наличия .env.deploy файла
        $envFile = ".env.deploy"
        if (Test-Path $envFile) {
            $result.AddInfo("✅ Файл конфигурации найден: $envFile")
        } else {
            $result.AddWarning("⚠️ Файл конфигурации не найден: $envFile")
        }

        # Проверка SSH настроек
        if ([string]::IsNullOrEmpty($this.Config.SSHHost)) {
            $result.AddError("SSH_HOST не настроен в конфигурации")
        } else {
            $result.AddInfo("✅ SSH_HOST настроен: $($this.Config.SSHHost)")
        }

        if ([string]::IsNullOrEmpty($this.Config.SSHUser)) {
            $result.AddError("SSH_USER не настроен в конфигурации")
        } else {
            $result.AddInfo("✅ SSH_USER настроен: $($this.Config.SSHUser)")
        }

        if ([string]::IsNullOrEmpty($this.Config.RemotePath)) {
            $result.AddError("REMOTE_PATH не настроен в конфигурации")
        } else {
            $result.AddInfo("✅ REMOTE_PATH настроен: $($this.Config.RemotePath)")
        }

        # Проверка домена
        if ([string]::IsNullOrEmpty($this.Config.ProductionDomain)) {
            $result.AddError("PRODUCTION_DOMAIN не настроен в конфигурации")
        } else {
            $result.AddInfo("✅ PRODUCTION_DOMAIN настроен: $($this.Config.ProductionDomain)")
        }
    }

    [void] ValidateProject([ValidationResult]$result) {
        $this.Logger.Info("🔍 Проверка проекта...")

        # Проверка наличия package.json
        if (Test-Path "package.json") {
            $result.AddInfo("✅ package.json найден")
        } else {
            $result.AddError("package.json не найден")
            return
        }

        # Проверка наличия node_modules
        if (Test-Path "node_modules") {
            $result.AddInfo("✅ Зависимости установлены (node_modules)")
        } else {
            $result.AddWarning("⚠️ Зависимости не установлены (node_modules не найдена)")
        }

        # Проверка наличия папки с изображениями
        if (Test-Path "images") {
            $imageCount = (Get-ChildItem "images" -File | Measure-Object).Count
            $result.AddInfo("✅ Папка изображений найдена: $imageCount файлов")
        } else {
            $result.AddWarning("⚠️ Папка изображений не найдена")
        }

        # Проверка наличия папки public/images
        if (Test-Path "public/images") {
            $publicImageCount = (Get-ChildItem "public/images" -File | Measure-Object).Count
            $result.AddInfo("✅ Папка public/images найдена: $publicImageCount файлов")
        } else {
            $result.AddWarning("⚠️ Папка public/images не найдена")
        }
    }

    [void] ValidateBuild([ValidationResult]$result) {
        $this.Logger.Info("🔍 Проверка сборки...")

        # Проверка наличия папки out
        if (Test-Path "out") {
            $buildItems = Get-ChildItem "out" -Recurse
            $fileCount = ($buildItems | Where-Object { !$_.PSIsContainer }).Count
            $totalSize = ($buildItems | Measure-Object -Property Length -Sum).Sum

            $result.AddInfo("✅ Папка сборки найдена: $fileCount файлов, $($this.FormatBytes($totalSize))")
        } else {
            $result.AddWarning("⚠️ Папка сборки не найдена (out). Запустите сборку командой: npm run build")
        }

        # Проверка критических файлов сборки
        $criticalFiles = @("out/index.html", "out/404.html", "out/favicon.ico")
        foreach ($file in $criticalFiles) {
            if (Test-Path $file) {
                $fileSize = (Get-Item $file).Length
                $result.AddInfo("✅ Критический файл найден: $(Split-Path $file -Leaf) ($($this.FormatBytes($fileSize)))")
            } else {
                $result.AddWarning("⚠️ Критический файл не найден: $(Split-Path $file -Leaf)")
            }
        }
    }

    [void] ValidateServer([ValidationResult]$result) {
        $this.Logger.Info("🔍 Проверка доступности сервера...")

        if ([string]::IsNullOrEmpty($this.Config.SSHHost) -or [string]::IsNullOrEmpty($this.Config.SSHUser)) {
            $result.AddWarning("⚠️ SSH настройки неполные, пропускаю проверку сервера")
            return
        }

        # Проверка SSH подключения
        try {
            $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR "$($this.Config.SSHUser)@$($this.Config.SSHHost)" "echo 'SSH connection successful'" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $result.AddInfo("✅ SSH подключение к серверу работает")
            } else {
                $result.AddWarning("⚠️ SSH подключение к серверу не работает")
            }
        }
        catch {
            $result.AddWarning("⚠️ SSH подключение к серверу не работает: $($_.Exception.Message)")
        }

        # Проверка доступности веб-сервера (если домен настроен)
        if (![string]::IsNullOrEmpty($this.Config.ProductionDomain)) {
            try {
                $webRequest = Invoke-WebRequest -Uri "https://$($this.Config.ProductionDomain)" -TimeoutSec 10 -ErrorAction SilentlyContinue
                if ($webRequest.StatusCode -eq 200) {
                    $result.AddInfo("✅ Веб-сервер отвечает (HTTP $($webRequest.StatusCode))")
                } else {
                    $result.AddWarning("⚠️ Веб-сервер отвечает с кодом $($webRequest.StatusCode)")
                }
            }
            catch {
                $result.AddWarning("⚠️ Веб-сервер недоступен: $($_.Exception.Message)")
            }
        }
    }

    [string] FormatBytes([long]$bytes) {
        $units = "Б", "КБ", "МБ", "ГБ", "ТБ"
        $i = 0

        while ($bytes -ge 1KB -and $i -lt 4) {
            $bytes = $bytes / 1KB
            $i++
        }

        return "{0:N1} {1}" -f $bytes, $units[$i]
    }

    [void] DisplayValidationResults([ValidationResult]$result) {
        $this.Logger.Info("📋 РЕЗУЛЬТАТЫ ВАЛИДАЦИИ")
        $this.Logger.Info("===============================================")

        if ($result.Info.Count -gt 0) {
            $this.Logger.Info("ℹ️ ИНФОРМАЦИЯ:")
            foreach ($info in $result.Info) {
                $this.Logger.Info("  $info")
            }
        }

        if ($result.Warnings.Count -gt 0) {
            $this.Logger.Warn("⚠️ ПРЕДУПРЕЖДЕНИЯ:")
            foreach ($warning in $result.Warnings) {
                $this.Logger.Warn("  $warning")
            }
        }

        if ($result.Errors.Count -gt 0) {
            $this.Logger.Error("❌ ОШИБКИ:")
            foreach ($errorMessage in $result.Errors) {
                $this.Logger.Error("  $errorMessage")
            }
        }

        $this.Logger.Info("===============================================")

        if ($result.IsValid) {
            $this.Logger.LogSuccess("ВАЛИДАЦИЯ ПРОЙДЕНА", "Система готова к деплою")
        } else {
            $this.Logger.LogError("ВАЛИДАЦИЯ НЕ ПРОЙДЕНА", "Исправьте ошибки перед деплоем")
        }
    }
}

# Функции экспорта модуля
function Test-DeployReadiness {
    $config = Get-DeployConfig
    $logger = Get-DeployLogger
    $validator = [DeployValidator]::new($config, $logger)
    return $validator.ValidateAll()
}

function Test-SystemRequirements {
    $config = Get-DeployConfig
    $logger = Get-DeployLogger
    $validator = [DeployValidator]::new($config, $logger)

    $result = [ValidationResult]::new()
    $validator.ValidateSystemRequirements($result)
    return $result
}

function Test-ProjectStructure {
    $config = Get-DeployConfig
    $logger = Get-DeployLogger
    $validator = [DeployValidator]::new($config, $logger)

    $result = [ValidationResult]::new()
    $validator.ValidateProject($result)
    return $result
}

function Test-ServerConnection {
    $config = Get-DeployConfig
    $logger = Get-DeployLogger
    $validator = [DeployValidator]::new($config, $logger)

    $result = [ValidationResult]::new()
    $validator.ValidateServer($result)
    return $result
}

Export-ModuleMember -Function Test-DeployReadiness, Test-SystemRequirements, Test-ProjectStructure, Test-ServerConnection