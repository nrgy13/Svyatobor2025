# Простая диагностика деплоя на Timeweb

Write-Host "ДИАГНОСТИКА ДЕПЛОЯ НА TIMEWEB" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Проверка файла настроек
$envFile = ".env.deploy"
Write-Host ""
Write-Host "1. Проверка файла настроек:" -ForegroundColor Yellow

if (Test-Path $envFile) {
    Write-Host "   Файл найден: $envFile" -ForegroundColor Green

    # Читаем содержимое
    $content = Get-Content $envFile

    # Проверяем SSH настройки
    $sshHostFound = $false
    $sshUserFound = $false

    foreach ($line in $content) {
        if ($line -like "SSH_HOST=*") {
            if ($line -like "*ВАШ_СЕРВЕР*") {
                Write-Host "   ❌ SSH_HOST не настроен" -ForegroundColor Red
            } else {
                Write-Host "   ✅ SSH_HOST настроен" -ForegroundColor Green
                $sshHostFound = $true
            }
        }

        if ($line -like "SSH_USER=*") {
            if ($line -like "*ВАШ_ЛОГИН*") {
                Write-Host "   ❌ SSH_USER не настроен" -ForegroundColor Red
            } else {
                Write-Host "   ✅ SSH_USER настроен" -ForegroundColor Green
                $sshUserFound = $true
            }
        }
    }

    if (-not $sshHostFound) {
        Write-Host "   ⚠️ SSH_HOST не найден в файле" -ForegroundColor Yellow
    }

    if (-not $sshUserFound) {
        Write-Host "   ⚠️ SSH_USER не найден в файле" -ForegroundColor Yellow
    }

} else {
    Write-Host "   ❌ Файл не найден: $envFile" -ForegroundColor Red
}

# Проверка сборки
Write-Host ""
Write-Host "2. Проверка сборки:" -ForegroundColor Yellow

if (Test-Path "out") {
    Write-Host "   ✅ Папка сборки найдена" -ForegroundColor Green

    if (Test-Path "out\index.html") {
        Write-Host "   ✅ index.html найден" -ForegroundColor Green
    } else {
        Write-Host "   ❌ index.html отсутствует" -ForegroundColor Red
    }

    if (Test-Path "out\.htaccess") {
        Write-Host "   ✅ .htaccess найден" -ForegroundColor Green
    } else {
        Write-Host "   ❌ .htaccess отсутствует" -ForegroundColor Red
    }

} else {
    Write-Host "   ❌ Папка сборки не найдена" -ForegroundColor Red
    Write-Host "   💡 Нужно выполнить: npm run build" -ForegroundColor Gray
}

# Проверка изображений
Write-Host ""
Write-Host "3. Проверка изображений:" -ForegroundColor Yellow

$imagesFound = $false
if (Test-Path "images") {
    $imgCount = (Get-ChildItem "images" -Recurse -Include "*.jpg","*.png","*.jpeg","*.gif","*.webp" | Measure-Object).Count
    Write-Host "   ✅ Папка images найдена ($imgCount файлов)" -ForegroundColor Green
    $imagesFound = $true
}

if (Test-Path "public\images") {
    $imgCount = (Get-ChildItem "public\images" -Recurse -Include "*.jpg","*.png","*.jpeg","*.gif","*.webp" | Measure-Object).Count
    Write-Host "   ✅ Папка public\images найдена ($imgCount файлов)" -ForegroundColor Green
    $imagesFound = $true
}

if (-not $imagesFound) {
    Write-Host "   ⚠️ Папки изображений не найдены" -ForegroundColor Yellow
}

# ИТОГИ
Write-Host ""
Write-Host "ИТОГИ ДИАГНОСТИКИ:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Для деплоя нужно настроить:" -ForegroundColor White
Write-Host "1. SSH_HOST - адрес сервера Timeweb" -ForegroundColor Gray
Write-Host "2. SSH_USER - логин пользователя Timeweb" -ForegroundColor Gray
Write-Host "3. SSH_KEY_PATH - путь к приватному ключу" -ForegroundColor Gray

Write-Host ""
Write-Host "Где получить данные:" -ForegroundColor White
Write-Host "1. Войти в Timeweb Cloud (cloud.timeweb.com)" -ForegroundColor Gray
Write-Host "2. Облачные серверы -> SSH-ключ" -ForegroundColor Gray
Write-Host "3. Создать ключ или использовать существующий" -ForegroundColor Gray
Write-Host "4. Внести данные в .env.deploy" -ForegroundColor Gray

Write-Host ""
Write-Host "Диагностика завершена!" -ForegroundColor Green