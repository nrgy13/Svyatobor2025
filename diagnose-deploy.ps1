#!/usr/bin/env pwsh

# Диагностический скрипт для проверки готовности к деплою
# Адаптирован для Windows PowerShell

Write-Host "=== Диагностика деплоя ===" -ForegroundColor Magenta
Write-Host ""

# 1. Проверка системных требований
Write-Host "1. Проверка системных требований:" -ForegroundColor Blue

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден" -ForegroundColor Red
}

# Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git не найден" -ForegroundColor Red
}

# 2. Проверка проекта
Write-Host ""
Write-Host "2. Проверка проекта:" -ForegroundColor Blue

# Проверка package.json
if (Test-Path "package.json") {
    Write-Host "✅ package.json найден" -ForegroundColor Green
} else {
    Write-Host "❌ package.json отсутствует" -ForegroundColor Red
}

# Проверка сборки
if (Test-Path "out") {
    $buildSize = (Get-ChildItem "out" -Recurse | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Host "✅ Сборка существует (размер: $($buildSizeMB) МБ)" -ForegroundColor Green
} else {
    Write-Host "❌ Сборка отсутствует" -ForegroundColor Red
}

# Проверка критических файлов
$criticalFiles = @("out/index.html", "out/404.html")
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $fileSize = (Get-Item $file).Length
        Write-Host "✅ $($file): $([math]::Round($fileSize / 1KB, 2)) КБ" -ForegroundColor Green
    } else {
        Write-Host "❌ $($file) отсутствует" -ForegroundColor Red
    }
}

# 3. Проверка изображений
Write-Host ""
Write-Host "3. Проверка изображений:" -ForegroundColor Blue

$imagesPath = "out/images"
if (Test-Path $imagesPath) {
    $images = Get-ChildItem $imagesPath -File
    $imagesCount = $images.Count
    $imagesSize = ($images | Measure-Object -Property Length -Sum).Sum
    $imagesSizeMB = [math]::Round($imagesSize / 1MB, 2)

    Write-Host "✅ Найдено $($imagesCount) изображений ($($imagesSizeMB) МБ)" -ForegroundColor Green

    # Проверка типов файлов
    $imageTypes = $images | Group-Object Extension | Select-Object Name, Count
    foreach ($type in $imageTypes) {
        Write-Host "   $($type.Name): $($type.Count) файлов" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Папка изображений не найдена" -ForegroundColor Red
}

# 4. Проверка переменных окружения
Write-Host ""
Write-Host "4. Проверка переменных окружения:" -ForegroundColor Blue

$envFiles = @(".env.deploy", ".env")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $($file) найден" -ForegroundColor Green
        $envContent = Get-Content $file -Raw
        if ($envContent -match "SSH_HOST=ВАШ_СЕРВЕР\.timeweb\.ru") {
            Write-Host "⚠️  В $($file) используются шаблонные значения" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ $($file) отсутствует" -ForegroundColor Red
    }
}

# 5. Проверка скриптов деплоя
Write-Host ""
Write-Host "5. Проверка скриптов деплоя:" -ForegroundColor Blue

$deployScripts = @("deploy.sh", "init-deploy.sh")
foreach ($script in $deployScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $($script) найден" -ForegroundColor Green
    } else {
        Write-Host "❌ $($script) отсутствует" -ForegroundColor Red
    }
}

# 6. Рекомендации
Write-Host ""
Write-Host "6. Рекомендации:" -ForegroundColor Blue

Write-Host "📋 Для деплоя на Timeweb Cloud необходимо:" -ForegroundColor Yellow
Write-Host "   1. Настроить реальные данные в .env.deploy" -ForegroundColor White
Write-Host "   2. Создать SSH ключ для доступа к серверу" -ForegroundColor White
Write-Host "   3. Убедиться в наличии доступа к серверу" -ForegroundColor White
Write-Host "   4. Проверить квоты дискового пространства" -ForegroundColor White

Write-Host ""
Write-Host "📊 Сводка сборки:" -ForegroundColor Cyan
Write-Host "   - Основные файлы: ~113 КБ" -ForegroundColor White
Write-Host "   - Изображения: ~12.5 МБ" -ForegroundColor White
Write-Host "   - Общий размер: ~12.6 МБ" -ForegroundColor White

Write-Host ""
Write-Host "=== Диагностика завершена ===" -ForegroundColor Magenta