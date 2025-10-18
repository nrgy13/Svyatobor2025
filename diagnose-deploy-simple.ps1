#!/usr/bin/env pwsh

# Простой диагностический скрипт для деплоя на Timeweb
# Проверяет настройки и показывает, что нужно заполнить

Write-Host "🔍 Диагностика деплоя на Timeweb" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Проверяем наличие файла настроек
$envFile = ".env.deploy"
if (Test-Path $envFile) {
    Write-Host "✅ Файл настроек найден: $envFile" -ForegroundColor Green

    # Читаем содержимое файла
    $content = Get-Content $envFile -Raw

    # Проверяем SSH настройки
    Write-Host "`n🔐 Проверка SSH настроек:" -ForegroundColor Yellow

    if ($content -match "SSH_HOST=ВАШ_СЕРВЕР\.timeweb\.ru") {
        Write-Host "❌ SSH_HOST не настроен (содержит плейсхолдер)" -ForegroundColor Red
        Write-Host "   Нужно указать реальный адрес сервера Timeweb" -ForegroundColor Gray
    } else {
        Write-Host "✅ SSH_HOST настроен" -ForegroundColor Green
    }

    if ($content -match "SSH_USER=ВАШ_ЛОГИН_ОТ_TIMEWEB") {
        Write-Host "❌ SSH_USER не настроен (содержит плейсхолдер)" -ForegroundColor Red
        Write-Host "   Нужно указать реальный логин пользователя" -ForegroundColor Gray
    } else {
        Write-Host "✅ SSH_USER настроен" -ForegroundColor Green
    }

    # Проверяем домен
    Write-Host "`n🌐 Проверка домена:" -ForegroundColor Yellow

    if ($content -match "PRODUCTION_DOMAIN=svyatobor\.ru") {
        Write-Host "✅ PRODUCTION_DOMAIN настроен: svyatobor.ru" -ForegroundColor Green
    } else {
        Write-Host "❌ PRODUCTION_DOMAIN не настроен или изменен" -ForegroundColor Red
    }

    # Проверяем путь на сервере
    Write-Host "`n📁 Проверка пути на сервере:" -ForegroundColor Yellow

    if ($content -match "REMOTE_PATH=/var/www/html") {
        Write-Host "✅ REMOTE_PATH настроен: /var/www/html" -ForegroundColor Green
    } else {
        Write-Host "❌ REMOTE_PATH не настроен или изменен" -ForegroundColor Red
    }

} else {
    Write-Host "❌ Файл настроек не найден: $envFile" -ForegroundColor Red
}

# Проверяем наличие сборки
Write-Host "`n📦 Проверка сборки проекта:" -ForegroundColor Yellow

if (Test-Path "out") {
    Write-Host "✅ Папка сборки найдена: out" -ForegroundColor Green

    # Проверяем критические файлы
    $criticalFiles = @("out\index.html", "out\.htaccess")
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Host "✅ Критический файл найден: $file" -ForegroundColor Green
        } else {
            Write-Host "❌ Критический файл отсутствует: $file" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Папка сборки не найдена: out" -ForegroundColor Red
    Write-Host "💡 Нужно выполнить сборку: npm run build" -ForegroundColor Gray
}

# Проверяем наличие изображений
Write-Host "`n🖼️ Проверка изображений:" -ForegroundColor Yellow

$imageDirs = @("images", "public\images")
foreach ($dir in $imageDirs) {
    if (Test-Path $dir) {
        $images = Get-ChildItem $dir -Recurse -Include *.jpg,*.png,*.jpeg,*.gif,*.webp
        Write-Host "✅ Папка найдена: $dir ($($images.Count) изображений)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Папка не найдена: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 РЕЗЮМЕ:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "Для деплоя на Timeweb нужно настроить:" -ForegroundColor White
Write-Host "1. SSH_HOST - адрес сервера Timeweb" -ForegroundColor Gray
Write-Host "2. SSH_USER - логин пользователя" -ForegroundColor Gray
Write-Host "3. SSH_KEY_PATH - путь к приватному ключу" -ForegroundColor Gray
Write-Host "4. Выполнить сборку проекта: npm run build" -ForegroundColor Gray

Write-Host "`n📞 Для получения данных подключения:" -ForegroundColor White
Write-Host "1. Войдите в Timeweb Cloud (cloud.timeweb.com)" -ForegroundColor Gray
Write-Host "2. Перейдите в 'Облачные серверы' → 'SSH-ключ'" -ForegroundColor Gray
Write-Host "3. Создайте SSH ключ или используйте существующий" -ForegroundColor Gray
Write-Host "4. Скопируйте данные в файл .env.deploy" -ForegroundColor Gray

Write-Host "`n✅ Диагностика завершена" -ForegroundColor Green