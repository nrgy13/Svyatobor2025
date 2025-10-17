# Модуль валидации для деплоя
# Проверяет готовность системы к развертыванию

param(
    [switch]$FullCheck,
    [switch]$SystemOnly,
    [switch]$ProjectOnly,
    [switch]$ServerOnly
)

# Импорт зависимых модулей
Import-Module ".\config.psm1" -Force
Import-Module ".\logger.psm1" -Force

function Test-DeployReadiness {
    Write-DeployStep "ВАЛИДАЦИЯ СИСТЕМЫ" "Проверка готовности к деплою"

    $result = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
        Info = @()
    }

    # Проверяем системные требования
    Test-SystemRequirementsInternal -Result $result

    # Проверяем конфигурацию
    Test-ConfigurationInternal -Result $result

    # Проверяем проект
    Test-ProjectInternal -Result $result

    # Проверяем сборку
    Test-BuildInternal -Result $result

    # Проверяем сервер
    Test-ServerInternal -Result $result

    # Выводим результаты
    Show-ValidationResults -Result $result

    return $result
}

function Test-SystemRequirementsInternal {
    param([hashtable]$Result)

    Write-DeployLog "🔍 Проверка системных требований..." "INFO"

    # Проверка PowerShell версии
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        $Result.IsValid = $false
        $Result.Errors += "Требуется PowerShell версии 5.0 или выше. Текущая версия: $($psVersion.Major).$($psVersion.Minor)"
    } else {
        $Result.Info += "✅ PowerShell версия: $($psVersion.Major).$($psVersion.Minor)"
    }

    # Проверка наличия SSH клиента
    try {
        $sshTest = & ssh -V 2>$null
        if ($LASTEXITCODE -eq 0) {
            $Result.Info += "✅ SSH клиент доступен"
        } else {
            $Result.Warnings += "⚠️ SSH клиент не найден или не настроен"
        }
    }
    catch {
        $Result.Warnings += "⚠️ SSH клиент не найден или не настроен"
    }

    # Проверка наличия Git
    try {
        $gitTest = & git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $Result.Info += "✅ Git доступен"
        } else {
            $Result.Warnings += "⚠️ Git не найден"
        }
    }
    catch {
        $Result.Warnings += "⚠️ Git не найден"
    }
}

function Test-ConfigurationInternal {
    param([hashtable]$Result)

    Write-DeployLog "🔍 Проверка конфигурации..." "INFO"

    $config = Get-DeployConfig

    # Проверка наличия .env.deploy файла
    $envFile = ".env.deploy"
    if (Test-Path $envFile) {
        $Result.Info += "✅ Файл конфигурации найден: $envFile"
    } else {
        $Result.Warnings += "⚠️ Файл конфигурации не найден: $envFile"
    }

    # Проверка SSH настроек
    if ([string]::IsNullOrEmpty($config.SSHHost)) {
        $Result.IsValid = $false
        $Result.Errors += "SSH_HOST не настроен в конфигурации"
    } else {
        $Result.Info += "✅ SSH_HOST настроен: $($config.SSHHost)"
    }

    if ([string]::IsNullOrEmpty($config.SSHUser)) {
        $Result.IsValid = $false
        $Result.Errors += "SSH_USER не настроен в конфигурации"
    } else {
        $Result.Info += "✅ SSH_USER настроен: $($config.SSHUser)"
    }

    if ([string]::IsNullOrEmpty($config.RemotePath)) {
        $Result.IsValid = $false
        $Result.Errors += "REMOTE_PATH не настроен в конфигурации"
    } else {
        $Result.Info += "✅ REMOTE_PATH настроен: $($config.RemotePath)"
    }

    # Проверка домена
    if ([string]::IsNullOrEmpty($config.ProductionDomain)) {
        $Result.IsValid = $false
        $Result.Errors += "PRODUCTION_DOMAIN не настроен в конфигурации"
    } else {
        $Result.Info += "✅ PRODUCTION_DOMAIN настроен: $($config.ProductionDomain)"
    }
}

function Test-ProjectInternal {
    param([hashtable]$Result)

    Write-DeployLog "🔍 Проверка проекта..." "INFO"

    # Проверка наличия package.json
    if (Test-Path "package.json") {
        $Result.Info += "✅ package.json найден"
    } else {
        $Result.IsValid = $false
        $Result.Errors += "package.json не найден"
        return
    }

    # Проверка наличия node_modules
    if (Test-Path "node_modules") {
        $Result.Info += "✅ Зависимости установлены (node_modules)"
    } else {
        $Result.Warnings += "⚠️ Зависимости не установлены (node_modules не найдена)"
    }

    # Проверка наличия папки с изображениями
    if (Test-Path "images") {
        $imageCount = (Get-ChildItem "images" -File | Measure-Object).Count
        $Result.Info += "✅ Папка изображений найдена: $imageCount файлов"
    } else {
        $Result.Warnings += "⚠️ Папка изображений не найдена"
    }

    # Проверка наличия папки public/images
    if (Test-Path "public/images") {
        $publicImageCount = (Get-ChildItem "public/images" -File | Measure-Object).Count
        $Result.Info += "✅ Папка public/images найдена: $publicImageCount файлов"
    } else {
        $Result.Warnings += "⚠️ Папка public/images не найдена"
    }
}

function Test-BuildInternal {
    param([hashtable]$Result)

    Write-DeployLog "🔍 Проверка сборки..." "INFO"

    # Проверка наличия папки out
    if (Test-Path "out") {
        $buildItems = Get-ChildItem "out" -Recurse
        $fileCount = ($buildItems | Where-Object { !$_.PSIsContainer }).Count
        $totalSize = ($buildItems | Measure-Object -Property Length -Sum).Sum

        $Result.Info += "✅ Папка сборки найдена: $fileCount файлов, $(FormatBytes $totalSize)"
    } else {
        $Result.Warnings += "⚠️ Папка сборки не найдена (out). Запустите сборку командой: npm run build"
    }

    # Проверка критических файлов сборки
    $criticalFiles = @("out/index.html", "out/404.html", "out/favicon.ico")
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            $fileSize = (Get-Item $file).Length
            $Result.Info += "✅ Критический файл найден: $(Split-Path $file -Leaf) ($(FormatBytes $fileSize))"
        } else {
            $Result.Warnings += "⚠️ Критический файл не найден: $(Split-Path $file -Leaf)"
        }
    }
}

function Test-ServerInternal {
    param([hashtable]$Result)

    Write-DeployLog "🔍 Проверка доступности сервера..." "INFO"

    $config = Get-DeployConfig

    if ([string]::IsNullOrEmpty($config.SSHHost) -or [string]::IsNullOrEmpty($config.SSHUser)) {
        $Result.Warnings += "⚠️ SSH настройки неполные, пропускаю проверку сервера"
        return
    }

    # Проверка SSH подключения
    try {
        $sshTest = & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR "$($config.SSHUser)@$($config.SSHHost)" "echo 'SSH connection successful'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $Result.Info += "✅ SSH подключение к серверу работает"
        } else {
            $Result.Warnings += "⚠️ SSH подключение к серверу не работает"
        }
    }
    catch {
        $Result.Warnings += "⚠️ SSH подключение к серверу не работает: $($_.Exception.Message)"
    }

    # Проверка доступности веб-сервера (если домен настроен)
    if (![string]::IsNullOrEmpty($config.ProductionDomain)) {
        try {
            $webRequest = Invoke-WebRequest -Uri "https://$($config.ProductionDomain)" -TimeoutSec 10 -ErrorAction SilentlyContinue
            if ($webRequest.StatusCode -eq 200) {
                $Result.Info += "✅ Веб-сервер отвечает (HTTP $($webRequest.StatusCode))"
            } else {
                $Result.Warnings += "⚠️ Веб-сервер отвечает с кодом $($webRequest.StatusCode)"
            }
        }
        catch {
            $Result.Warnings += "⚠️ Веб-сервер недоступен: $($_.Exception.Message)"
        }
    }
}

function FormatBytes([long]$bytes) {
    $units = "Б", "КБ", "МБ", "ГБ", "ТБ"
    $i = 0

    while ($bytes -ge 1KB -and $i -lt 4) {
        $bytes = $bytes / 1KB
        $i++
    }

    return "{0:N1} {1}" -f $bytes, $units[$i]
}

function Show-ValidationResults {
    param([hashtable]$Result)

    Write-DeployLog "📋 РЕЗУЛЬТАТЫ ВАЛИДАЦИИ" "INFO"
    Write-DeployLog "===============================================" "INFO"

    if ($Result.Info.Count -gt 0) {
        Write-DeployLog "ℹ️ ИНФОРМАЦИЯ:" "INFO"
        foreach ($info in $Result.Info) {
            Write-DeployLog "  $info" "INFO"
        }
    }

    if ($Result.Warnings.Count -gt 0) {
        Write-DeployLog "⚠️ ПРЕДУПРЕЖДЕНИЯ:" "WARN"
        foreach ($warning in $Result.Warnings) {
            Write-DeployLog "  $warning" "WARN"
        }
    }

    if ($Result.Errors.Count -gt 0) {
        Write-DeployLog "❌ ОШИБКИ:" "ERROR"
        foreach ($errorMessage in $Result.Errors) {
            Write-DeployLog "  $errorMessage" "ERROR"
        }
    }

    Write-DeployLog "===============================================" "INFO"

    if ($Result.IsValid) {
        Write-DeployLog "ВАЛИДАЦИЯ ПРОЙДЕНА - Система готова к деплою" "INFO"
    } else {
        Write-DeployLog "ВАЛИДАЦИЯ НЕ ПРОЙДЕНА - Исправьте ошибки перед деплоем" "ERROR"
    }
}

# Дополнительные функции для отдельных проверок
function Test-SystemRequirements {
    $result = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
        Info = @()
    }

    Test-SystemRequirementsInternal -Result $result
    return $result
}

function Test-ProjectStructure {
    $result = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
        Info = @()
    }

    Test-ProjectInternal -Result $result
    return $result
}

function Test-ServerConnection {
    $result = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
        Info = @()
    }

    Test-ServerInternal -Result $result
    return $result
}

# Основная логика выполнения
if ($FullCheck) {
    return Test-DeployReadiness
}

if ($SystemOnly) {
    return Test-SystemRequirements
}

if ($ProjectOnly) {
    return Test-ProjectStructure
}

if ($ServerOnly) {
    return Test-ServerConnection
}

# По умолчанию выполняем полную проверку
return Test-DeployReadiness