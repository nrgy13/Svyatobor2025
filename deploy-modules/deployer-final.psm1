# Модуль деплоя для автоматизации развертывания
# Содержит основные операции деплоя: сборка, загрузка, развертывание

using module ".\config.psm1"
using module ".\logger.psm1"

class DeployResult {
    [bool]$Success
    [string]$Environment
    [string[]]$Actions
    [string[]]$Errors
    [string]$Duration
    [string]$Timestamp

    DeployResult() {
        $this.Success = $true
        $this.Actions = @()
        $this.Errors = @()
        $this.Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }

    [void] AddAction([string]$action) {
        $this.Actions += $action
    }

    [void] AddError([string]$errorMessage) {
        $this.Success = $false
        $this.Errors += $errorMessage
    }
}

class Deployer {
    [DeployConfig]$Config
    [DeployLogger]$Logger
    [System.Diagnostics.Stopwatch]$Stopwatch

    Deployer([DeployConfig]$config, [DeployLogger]$logger) {
        $this.Config = $config
        $this.Logger = $logger
        $this.Stopwatch = [System.Diagnostics.Stopwatch]::new()
    }

    [DeployResult] Deploy([string]$environment) {
        $this.Logger.LogDeploymentStart($environment, "1.0.0")
        $this.Stopwatch.Start()

        $result = [DeployResult]::new()
        $result.Environment = $environment

        try {
            # Шаг 1: Валидация перед деплоем
            $this.Logger.LogStep("ВАЛИДАЦИЯ", "Проверка готовности к деплою")
            $validationResult = $this.ValidateBeforeDeploy()
            if (!$validationResult.IsValid) {
                throw "Валидация не пройдена. Исправьте ошибки перед деплоем."
            }
            $result.AddAction("Валидация пройдена успешно")

            # Шаг 2: Сборка проекта
            $this.Logger.LogStep("СБОРКА", "Сборка Next.js приложения")
            $buildResult = $this.BuildProject()
            if (!$buildResult) {
                throw "Сборка проекта завершилась неудачно"
            }
            $result.AddAction("Проект собран успешно")

            # Шаг 3: Создание резервной копии (только для продакшена)
            if ($environment -eq "production" -and $this.Config.BackupEnabled) {
                $this.Logger.LogStep("РЕЗЕРВНОЕ КОПИРОВАНИЕ", "Создание резервной копии")
                $backupResult = $this.CreateBackup($environment)
                if ($backupResult) {
                    $result.AddAction("Резервная копия создана: $backupResult")
                }
            }

            # Шаг 4: Деплой файлов на сервер
            $this.Logger.LogStep("ДЕПЛОЙ ФАЙЛОВ", "Загрузка файлов на сервер")
            $deployResult = $this.DeployFiles($environment)
            if (!$deployResult) {
                throw "Деплой файлов завершился неудачно"
            }
            $result.AddAction("Файлы загружены на сервер успешно")

            # Шаг 5: Деплой изображений
            $this.Logger.LogStep("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Загрузка изображений на сервер")
            $imagesResult = $this.DeployImages()
            if ($imagesResult) {
                $result.AddAction("Изображения загружены успешно")
            } else {
                $result.AddAction("Предупреждение: проблемы с загрузкой изображений")
            }

            # Шаг 6: Пост-деплой действия
            $this.Logger.LogStep("ПОСТ-ДЕПЛОЙ", "Выполнение пост-деплойных действий")
            $postDeployResult = $this.PostDeployActions($environment)
            if ($postDeployResult) {
                $result.AddAction("Пост-деплойные действия выполнены")
            }

            # Шаг 7: Проверка деплоя
            $this.Logger.LogStep("ПРОВЕРКА", "Проверка успешности деплоя")
            $healthCheckResult = $this.HealthCheck($environment)
            if ($healthCheckResult) {
                $result.AddAction("Проверка здоровья пройдена успешно")
            } else {
                $result.AddAction("Предупреждение: проблемы с проверкой здоровья")
            }

            $result.AddAction("Деплой в среду $environment завершен успешно")
        }
        catch {
            $errorMessage = $_.Exception.Message
            $this.Logger.LogError("ДЕПЛОЙ", $errorMessage)
            $result.AddError($errorMessage)
        }
        finally {
            $this.Stopwatch.Stop()
            $result.Duration = $this.FormatDuration($this.Stopwatch.Elapsed)

            if ($result.Success) {
                $this.Logger.LogDeploymentEnd($environment, "УСПЕХ", $result.Duration)
            } else {
                $this.Logger.LogDeploymentEnd($environment, "ОШИБКА", $result.Duration)
            }
        }

        return $result
    }

    [hashtable] ValidateBeforeDeploy() {
        # Импортируем и используем модуль валидации
        . ".\validator.ps1"

        $validationResult = Test-DeployReadiness

        return @{
            IsValid = $validationResult.IsValid
            Errors = $validationResult.Errors
            Warnings = $validationResult.Warnings
        }
    }

    [bool] BuildProject() {
        try {
            $this.Logger.Info("📦 Начинаю сборку проекта...")

            # Проверяем наличие папки сборки
            if (Test-Path "out") {
                $this.Logger.Info("🗑️ Удаляю предыдущую сборку...")
                Remove-Item "out" -Recurse -Force
            }

            # Выполняем сборку
            $this.Logger.Info("🔨 Запускаю команду сборки: npm run build")
            $buildProcess = Start-Process "npm" -ArgumentList "run build" -NoNewWindow -Wait -PassThru

            if ($buildProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("СБОРКА ПРОЕКТА", "Сборка завершена успешно")

                # Проверяем размер сборки
                $buildSize = $this.GetDirectorySize("out")
                $this.Logger.Info("📊 Размер сборки: $(FormatBytes $buildSize)")

                return $true
            } else {
                $this.Logger.LogError("СБОРКА ПРОЕКТА", "Сборка завершилась с ошибкой (код $($buildProcess.ExitCode))")
                return $false
            }
        }
        catch {
            $this.Logger.LogError("СБОРКА ПРОЕКТА", $_.Exception.Message)
            return $false
        }
    }

    [string] CreateBackup([string]$environment) {
        if (!$this.Config.BackupEnabled) {
            $this.Logger.Info("⏭️ Резервное копирование отключено в конфигурации")
            return $null
        }

        try {
            $backupPath = $this.Config.GetBackupPath($environment)
            $this.Logger.Info("💾 Создаю резервную копию в: $backupPath")

            # Создаем локальную резервную копию сборки
            if (Test-Path "out") {
                New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
                Copy-Item "out\*" $backupPath -Recurse -Force
                $this.Logger.LogSuccess("РЕЗЕРВНОЕ КОПИРОВАНИЕ", "Локальная резервная копия создана")
                return $backupPath
            }

            return $null
        }
        catch {
            $this.Logger.LogError("РЕЗЕРВНОЕ КОПИРОВАНИЕ", $_.Exception.Message)
            return $null
        }
    }

    [bool] DeployFiles([string]$environment) {
        try {
            $this.Logger.Info("📤 Начинаю загрузку файлов на сервер...")

            if ([string]::IsNullOrEmpty($this.Config.SSHHost) -or [string]::IsNullOrEmpty($this.Config.SSHUser)) {
                throw "SSH настройки неполные"
            }

            # Подготавливаем SSH опции
            $sshOptions = $this.GetSSHOptions()

            # Загружаем файлы через rsync
            $rsyncCommand = "rsync -avz --delete -e 'ssh $($sshOptions)' --exclude='.git' --exclude='node_modules' --exclude='.env*' out/ $($this.Config.SSHUser)@$($this.Config.SSHHost):$($this.Config.RemotePath)/"

            $this.Logger.Info("🔄 Выполняю команду: $rsyncCommand")
            $rsyncProcess = Start-Process "bash" -ArgumentList "-c `"$rsyncCommand`"" -NoNewWindow -Wait -PassThru

            if ($rsyncProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("ДЕПЛОЙ ФАЙЛОВ", "Файлы успешно загружены через SSH")
                return $true
            } else {
                $this.Logger.LogError("ДЕПЛОЙ ФАЙЛОВ", "Ошибка при загрузке файлов (код $($rsyncProcess.ExitCode))")
                return $false
            }
        }
        catch {
            $this.Logger.LogError("ДЕПЛОЙ ФАЙЛОВ", $_.Exception.Message)
            return $false
        }
    }

    [bool] DeployImages() {
        try {
            $this.Logger.Info("🖼️ Начинаю загрузку изображений...")

            if ([string]::IsNullOrEmpty($this.Config.SSHHost) -or [string]::IsNullOrEmpty($this.Config.SSHUser)) {
                $this.Logger.LogWarning("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "SSH настройки неполные, пропускаю загрузку изображений")
                return $false
            }

            $sshOptions = $this.GetSSHOptions()
            $totalImages = 0

            # Создаем структуру папок изображений на сервере
            $this.Logger.Info("📁 Создаю структуру папок изображений на сервере...")
            $mkdirCommand = "ssh $($sshOptions) $($this.Config.SSHUser)@$($this.Config.SSHHost) 'mkdir -p $($this.Config.RemotePath)/images $($this.Config.RemotePath)/public/images'"

            $mkdirProcess = Start-Process "bash" -ArgumentList "-c `"$mkdirCommand`"" -NoNewWindow -Wait -PassThru
            if ($mkdirProcess.ExitCode -ne 0) {
                $this.Logger.LogWarning("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Не удалось создать структуру папок изображений")
            }

            # Загружаем изображения из локальной папки images/
            if (Test-Path "images") {
                $this.Logger.Info("📤 Загружаю изображения из папки images/...")
                $localImages = Get-ChildItem "images" -File
                $totalImages += $localImages.Count

                $rsyncImagesCommand = "rsync -avz -e 'ssh $($sshOptions)' --delete images/ $($this.Config.SSHUser)@$($this.Config.SSHHost):$($this.Config.RemotePath)/images/"

                $rsyncImagesProcess = Start-Process "bash" -ArgumentList "-c `"$rsyncImagesCommand`"" -NoNewWindow -Wait -PassThru

                if ($rsyncImagesProcess.ExitCode -eq 0) {
                    $this.Logger.LogSuccess("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Изображения из папки images/ загружены успешно")
                } else {
                    $this.Logger.LogWarning("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Ошибка при загрузке изображений из папки images/")
                }
            }

            # Загружаем изображения из локальной папки public/images/
            if (Test-Path "public/images") {
                $this.Logger.Info("📤 Загружаю изображения из папки public/images/...")
                $publicImages = Get-ChildItem "public/images" -File
                $totalImages += $publicImages.Count

                $rsyncPublicImagesCommand = "rsync -avz -e 'ssh $($sshOptions)' --delete public/images/ $($this.Config.SSHUser)@$($this.Config.SSHHost):$($this.Config.RemotePath)/public/images/"

                $rsyncPublicImagesProcess = Start-Process "bash" -ArgumentList "-c `"$rsyncPublicImagesCommand`"" -NoNewWindow -Wait -PassThru

                if ($rsyncPublicImagesProcess.ExitCode -eq 0) {
                    $this.Logger.LogSuccess("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Изображения из папки public/images/ загружены успешно")
                } else {
                    $this.Logger.LogWarning("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Ошибка при загрузке изображений из папки public/images/")
                }
            }

            # Настройка прав доступа к изображениям
            if ($totalImages -gt 0) {
                $this.Logger.Info("🔐 Настраиваю права доступа к изображениям...")
                $chmodCommand = "ssh $($sshOptions) $($this.Config.SSHUser)@$($this.Config.SSHHost) 'chmod -R 755 $($this.Config.RemotePath)/images $($this.Config.RemotePath)/public/images'"

                $chmodProcess = Start-Process "bash" -ArgumentList "-c `"$chmodCommand`"" -NoNewWindow -Wait -PassThru

                if ($chmodProcess.ExitCode -eq 0) {
                    $this.Logger.LogSuccess("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Права доступа к изображениям настроены")
                } else {
                    $this.Logger.LogWarning("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", "Не удалось настроить права доступа к изображениям")
                }
            }

            $this.Logger.Info("📊 Всего обработано изображений: $totalImages")
            return $totalImages -gt 0
        }
        catch {
            $this.Logger.LogError("ДЕПЛОЙ ИЗОБРАЖЕНИЙ", $_.Exception.Message)
            return $false
        }
    }

    [bool] PostDeployActions([string]$environment) {
        try {
            $this.Logger.Info("🔄 Выполняю пост-деплойные действия...")

            if ([string]::IsNullOrEmpty($this.Config.SSHHost) -or [string]::IsNullOrEmpty($this.Config.SSHUser)) {
                $this.Logger.LogWarning("ПОСТ-ДЕПЛОЙ", "SSH настройки неполные, пропускаю пост-деплойные действия")
                return $false
            }

            $sshOptions = $this.GetSSHOptions()

            # Загружаем конфигурацию nginx для Next.js
            $this.Logger.Info("⚙️ Загружаю конфигурацию nginx для Next.js...")
            $nginxConfigUploaded = $this.UploadNginxConfig()

            if ($nginxConfigUploaded) {
                $this.Logger.LogSuccess("ПОСТ-ДЕПЛОЙ", "Конфигурация nginx загружена успешно")
            } else {
                $this.Logger.LogWarning("ПОСТ-ДЕПЛОЙ", "Не удалось загрузить конфигурацию nginx")
            }

            # Применяем конфигурацию nginx
            $nginxConfigApplied = $this.ApplyNginxConfig()

            if ($nginxConfigApplied) {
                $this.Logger.LogSuccess("ПОСТ-ДЕПЛОЙ", "Конфигурация nginx применена успешно")
            } else {
                $this.Logger.LogWarning("ПОСТ-ДЕПЛОЙ", "Не удалось применить конфигурацию nginx")
            }

            # Перезапуск веб-сервера
            $this.Logger.Info("🔄 Перезапускаю веб-сервер...")
            $restartCommand = "ssh $($sshOptions) $($this.Config.SSHUser)@$($this.Config.SSHHost) 'sudo systemctl restart nginx || sudo systemctl restart apache2 || sudo systemctl restart httpd || echo 'Веб-сервер не обнаружен или уже работает''"

            $restartProcess = Start-Process "bash" -ArgumentList "-c `"$restartCommand`"" -NoNewWindow -Wait -PassThru

            if ($restartProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("ПОСТ-ДЕПЛОЙ", "Веб-сервер успешно перезапущен")
            } else {
                $this.Logger.LogWarning("ПОСТ-ДЕПЛОЙ", "Не удалось перезапустить веб-сервер автоматически")
            }

            # Проверяем статус сервиса
            $this.Logger.Info("📊 Проверяю статус сервиса...")
            $statusCommand = "ssh $($sshOptions) $($this.Config.SSHUser)@$($this.Config.SSHHost) 'sudo systemctl status nginx || sudo systemctl status apache2 || sudo systemctl status httpd || echo 'Сервисы веб-сервера:' && ps aux | grep -E '(nginx|apache|httpd)' | grep -v grep'"

            $statusProcess = Start-Process "bash" -ArgumentList "-c `"$statusCommand`"" -NoNewWindow -Wait -PassThru

            if ($statusProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("ПОСТ-ДЕПЛОЙ", "Статус сервиса проверен")
            }

            return $true
        }
        catch {
            $this.Logger.LogError("ПОСТ-ДЕПЛОЙ", $_.Exception.Message)
            return $false
        }
    }

    [bool] UploadNginxConfig() {
        try {
            if (!(Test-Path "nginx-config.conf")) {
                $this.Logger.LogWarning("NGINX КОНФИГ", "Файл конфигурации nginx-config.conf не найден")
                return $false
            }

            $sshOptions = $this.GetSSHOptions()
            $remoteConfigPath = "/etc/nginx/sites-available/svyatobor"

            $this.Logger.Info("📤 Загружаю конфигурацию nginx на сервер...")
            $scpCommand = "scp $($sshOptions) nginx-config.conf $($this.Config.SSHUser)@$($this.Config.SSHHost):$remoteConfigPath"

            $scpProcess = Start-Process "bash" -ArgumentList "-c `"$scpCommand`"" -NoNewWindow -Wait -PassThru

            if ($scpProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("NGINX КОНФИГ", "Конфигурация загружена успешно")
                return $true
            } else {
                $this.Logger.LogWarning("NGINX КОНФИГ", "Не удалось загрузить конфигурацию")
                return $false
            }
        }
        catch {
            $this.Logger.LogError("NGINX КОНФИГ", $_.Exception.Message)
            return $false
        }
    }

    [bool] ApplyNginxConfig() {
        try {
            $sshOptions = $this.GetSSHOptions()
            $remoteConfigPath = "/etc/nginx/sites-available/svyatobor"
            $enabledConfigPath = "/etc/nginx/sites-enabled/svyatobor"

            $this.Logger.Info("🔧 Применяю конфигурацию nginx...")

            # Создаем символическую ссылку
            $lnCommand = "ssh $($sshOptions) $($this.Config.SSHUser)@$($this.Config.SSHHost) 'sudo ln -sf $remoteConfigPath $enabledConfigPath'"

            $lnProcess = Start-Process "bash" -ArgumentList "-c `"$lnCommand`"" -NoNewWindow -Wait -PassThru

            if ($lnProcess.ExitCode -eq 0) {
                $this.Logger.LogSuccess("NGINX КОНФИГ", "Конфигурация применена успешно")
                return $true
            } else {
                $this.Logger.LogWarning("NGINX КОНФИГ", "Не удалось применить конфигурацию")
                return $false
            }
        }
        catch {
            $this.Logger.LogError("NGINX КОНФИГ", $_.Exception.Message)
            return $false
        }
    }

    [bool] HealthCheck([string]$environment) {
        try {
            $this.Logger.Info("🔍 Выполняю проверку здоровья приложения...")

            if ([string]::IsNullOrEmpty($this.Config.ProductionDomain)) {
                $this.Logger.LogWarning("ПРОВЕРКА ЗДОРОВЬЯ", "PRODUCTION_DOMAIN не настроен, пропускаю проверку")
                return $false
            }

            # Проверяем доступность сайта
            $healthUrl = "https://$($this.Config.ProductionDomain)"
            $this.Logger.Info("🌐 Проверяю доступность сайта: $healthUrl")

            try {
                $webRequest = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 30 -ErrorAction SilentlyContinue
                if ($webRequest.StatusCode -eq 200) {
                    $this.Logger.LogSuccess("ПРОВЕРКА ЗДОРОВЬЯ", "Сайт доступен (HTTP $($webRequest.StatusCode))")
                    return $true
                } else {
                    $this.Logger.LogWarning("ПРОВЕРКА ЗДОРОВЬЯ", "Сайт отвечает с кодом $($webRequest.StatusCode)")
                    return $false
                }
            }
            catch {
                $this.Logger.LogWarning("ПРОВЕРКА ЗДОРОВЬЯ", "Сайт недоступен: $($_.Exception.Message)")
                return $false
            }
        }
        catch {
            $this.Logger.LogError("ПРОВЕРКА ЗДОРОВЬЯ", $_.Exception.Message)
            return $false
        }
    }

    [string] GetSSHOptions() {
        $options = @()

        if (![string]::IsNullOrEmpty($this.Config.SSHKeyPath) -and (Test-Path $this.Config.SSHKeyPath)) {
            $options += "-i '$($this.Config.SSHKeyPath)'"
        }

        $options += "-o StrictHostKeyChecking=no"
        $options += "-o UserKnownHostsFile=/dev/null"
        $options += "-o LogLevel=ERROR"

        return $options -join " "
    }

    [long] GetDirectorySize([string]$path) {
        if (!(Test-Path $path)) {
            return 0
        }

        $items = Get-ChildItem $path -Recurse
        $totalSize = ($items | Measure-Object -Property Length -Sum).Sum
        return $totalSize
    }

    [string] FormatDuration([TimeSpan]$duration) {
        return "{0:mm\:ss}" -f $duration
    }
}

# Функции экспорта модуля
function Start-Deploy {
    param([string]$Environment = "production")

    $config = Get-DeployConfig
    $logger = Get-DeployLogger
    $deployer = [Deployer]::new($config, $logger)

    return $deployer.Deploy($Environment)
}

function Test-DeployConnection {
    $logger = Get-DeployLogger
    $logger.Info("🔍 Тестирую подключение к серверу...")

    $config = Get-DeployConfig

    if ([string]::IsNullOrEmpty($config.SSHHost) -or [string]::IsNullOrEmpty($config.SSHUser)) {
        Write-DeployError "ДЕПЛОЙ" "SSH настройки неполные"
        return $false
    }

    try {
        $sshOptions = $config.GetSSHOptions()
        $testCommand = "ssh $($sshOptions) $($config.SSHUser)@$($config.SSHHost) 'echo 'Подключение успешно' && ls -la $($config.RemotePath)'"

        $testProcess = Start-Process "bash" -ArgumentList "-c `"$testCommand`"" -NoNewWindow -Wait -PassThru

        if ($testProcess.ExitCode -eq 0) {
            Write-DeploySuccess "ДЕПЛОЙ" "Подключение к серверу работает корректно"
            return $true
        } else {
            Write-DeployError "ДЕПЛОЙ" "Не удалось подключиться к серверу"
            return $false
        }
    }
    catch {
        Write-DeployError "ДЕПЛОЙ" $_.Exception.Message
        return $false
    }
}

Export-ModuleMember -Function Start-Deploy, Test-DeployConnection