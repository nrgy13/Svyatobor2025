#!/usr/bin/env node

/**
 * Скрипт для загрузки изображений из папки images/ в Supabase Storage
 *
 * Использование: node upload-to-supabase.js
 *
 * Требуемые переменные окружения:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (для загрузки файлов)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация изображений для загрузки
const IMAGES_TO_UPLOAD = [
  // Логотипы
  { name: 'logo.png', folder: 'logos' },
  { name: 'logo-circle.png', folder: 'logos' },

  // Фоновые изображения
  { name: 'hero-bg.jpg', folder: 'backgrounds' },
  { name: 'result-bg.jpg', folder: 'backgrounds' },

  // Изображения секций
  { name: 'advantages-image.jpg', folder: 'sections' },
  { name: 'problem-image.jpg', folder: 'sections' },

  // Сервисы
  { name: 'service-trees.jpg', folder: 'services' },
  { name: 'service-grass.jpg', folder: 'services' },
  { name: 'service-spraying.jpg', folder: 'services' },
  { name: 'service-removal.jpg', folder: 'services' },
  { name: 'service-construction.jpg', folder: 'services' },

  // Клиенты
  { name: 'client-1.jpg', folder: 'clients' },
  { name: 'client-2.jpg', folder: 'clients' },
  { name: 'client-3.jpg', folder: 'clients' },

  // Дополнительные изображения
  { name: 'element.png', folder: 'elements' },
  { name: 'red-floral-ornament-white-background-embroidery.png', folder: 'elements' }
];

// Цвета для плейсхолдеров
const PLACEHOLDER_COLORS = {
  'logo-circle.png': '#4A90E2',
  'service-trees.jpg': '#228B22',
  'service-grass.jpg': '#32CD32',
  'service-spraying.jpg': '#4169E1',
  'service-removal.jpg': '#8B4513',
  'service-construction.jpg': '#FFD700',
  'client-1.jpg': '#FF69B4',
  'client-2.jpg': '#00CED1',
  'client-3.jpg': '#FF6347',
  'element.png': '#9370DB',
  'red-floral-ornament-white-background-embroidery.png': '#DC143C'
};

class ImageUploader {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images'; // Используем бакет 'images' как указано в lib/supabase.ts
    this.imagesPath = path.join(__dirname, 'images'); // Загружаем из папки images/ в корне проекта
  }

  /**
   * Инициализация Supabase клиента
   */
  initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Необходимы переменные окружения: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Подключение к Supabase установлено');
    console.log(`📦 Бакет: ${this.bucketName}`);
    console.log(`📁 Папка с изображениями: ${this.imagesPath}`);
  }

  /**
   * Создание структуры папок в бакете
   */
  async createFolderStructure() {
    console.log('📁 Создание структуры папок...');

    // Получаем уникальные названия папок
    const folders = [...new Set(IMAGES_TO_UPLOAD.map(img => img.folder))];

    for (const folderName of folders) {
      try {
        // Создаем папку через загрузку пустого файла с префиксом папки
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(`${folderName}/.keep`, new Uint8Array(0), {
            cacheControl: '3600',
            upsert: false
          });

        if (error && error.message !== 'The resource already exists') {
          console.warn(`⚠️  Не удалось создать папку ${folderName}:`, error.message);
        } else {
          console.log(`✅ Папка ${folderName}/ создана`);
        }
      } catch (error) {
        console.warn(`⚠️  Ошибка при создании папки ${folderName}:`, error.message);
      }
    }
  }

  /**
   * Загрузка локальных изображений
   */
  async uploadLocalImages() {
    console.log('📤 Загрузка локальных изображений...');

    const uploadedFiles = [];
    const skippedFiles = [];

    for (const imageInfo of IMAGES_TO_UPLOAD) {
      const localPath = path.join(this.imagesPath, imageInfo.name);

      // Проверяем существует ли файл локально
      if (fs.existsSync(localPath)) {
        try {
          const fileBuffer = fs.readFileSync(localPath);
          const fileExt = path.extname(imageInfo.name);
          const contentType = this.getContentType(fileExt);

          // Получаем метаданные файла
          const stats = fs.statSync(localPath);
          const metadata = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };

          const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(`${imageInfo.folder}/${imageInfo.name}`, fileBuffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: contentType,
              metadata: metadata
            });

          if (error) {
            console.error(`❌ Ошибка загрузки ${imageInfo.name}:`, error.message);
          } else {
            console.log(`✅ Загружено: ${imageInfo.folder}/${imageInfo.name}`);
            uploadedFiles.push({
              folder: imageInfo.folder,
              file: imageInfo.name,
              path: data.path,
              size: metadata.size,
              contentType: contentType
            });
          }
        } catch (error) {
          console.error(`❌ Ошибка чтения файла ${imageInfo.name}:`, error.message);
        }
      } else {
        console.log(`⚠️  Файл не найден локально: ${imageInfo.name}`);
        skippedFiles.push(imageInfo.name);
      }
    }

    return { uploadedFiles, skippedFiles };
  }

  /**
   * Создание плейсхолдеров для недостающих изображений
   */
  async createPlaceholders(skippedFiles) {
    console.log('🎨 Создание плейсхолдеров для отсутствующих изображений...');

    const placeholders = [];

    for (const fileName of skippedFiles) {
      // Находим информацию о файле в конфигурации
      const imageInfo = IMAGES_TO_UPLOAD.find(img => img.name === fileName);

      if (imageInfo) {
        try {
          const placeholderBuffer = await this.createPlaceholderImage(fileName, 800, 600);
          const contentType = this.getContentType(path.extname(fileName));

          const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(`${imageInfo.folder}/${fileName}`, placeholderBuffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: contentType,
              metadata: { isPlaceholder: true }
            });

          if (error) {
            console.error(`❌ Ошибка создания плейсхолдера ${fileName}:`, error.message);
          } else {
            console.log(`✅ Создан плейсхолдер: ${imageInfo.folder}/${fileName}`);
            placeholders.push({
              folder: imageInfo.folder,
              file: fileName,
              path: data.path,
              isPlaceholder: true
            });
          }
        } catch (error) {
          console.error(`❌ Ошибка создания плейсхолдера ${fileName}:`, error.message);
        }
      }
    }

    return placeholders;
  }

  /**
   * Создание изображения плейсхолдера с помощью SVG
   */
  async createPlaceholderImage(fileName, width, height) {
    const color = PLACEHOLDER_COLORS[fileName] || '#CCCCCC';
    const text = fileName.replace(/\.[^/.]+$/, '').replace(/-/g, ' ').toUpperCase();

    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white"
              text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>
    `;

    return Buffer.from(svgContent, 'utf-8');
  }

  /**
   * Получение Content-Type по расширению файла
   */
  getContentType(extension) {
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Генерация констант для TypeScript
   */
  generateConstants(uploadedFiles, placeholders) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const allFiles = [...uploadedFiles, ...placeholders];

    let constants = `export const IMAGES = {\n`;

    for (const file of allFiles) {
      const constantName = this.getConstantName(file.file);
      const url = `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${file.path}`;
      const comment = file.isPlaceholder ? ' // ПЛЕЙСХОЛДЕР - замените на реальное изображение' : '';

      constants += `  ${constantName}: "${url}",${comment}\n`;
    }

    constants += `} as const;\n`;

    return constants;
  }

  /**
   * Получение имени константы по имени файла
   */
  getConstantName(fileName) {
    const name = fileName.replace(/\.[^/.]+$/, '').toUpperCase();
    return name.replace(/-/g, '_');
  }

  /**
   * Проверка доступности изображений через API
   */
  async verifyImages(uploadedFiles, placeholders) {
    console.log('🔍 Проверка доступности изображений...');

    const allFiles = [...uploadedFiles, ...placeholders];
    const results = [];

    for (const file of allFiles) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(file.path);

        // Проверяем доступность URL
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        const isAccessible = response.ok;

        results.push({
          file: file.file,
          folder: file.folder,
          url: data.publicUrl,
          accessible: isAccessible,
          status: response.status
        });

        if (isAccessible) {
          console.log(`✅ Доступно: ${file.folder}/${file.file}`);
        } else {
          console.warn(`⚠️  Не доступно: ${file.folder}/${file.file} (HTTP ${response.status})`);
        }
      } catch (error) {
        console.error(`❌ Ошибка проверки ${file.file}:`, error.message);
        results.push({
          file: file.file,
          folder: file.folder,
          error: error.message,
          accessible: false
        });
      }
    }

    return results;
  }

  /**
   * Основной метод выполнения
   */
  async run() {
    try {
      console.log('🚀 Начало загрузки изображений в Supabase Storage...\n');

      // Инициализация
      this.initializeSupabase();

      // Создание структуры папок
      await this.createFolderStructure();
      console.log('');

      // Загрузка локальных изображений
      const { uploadedFiles, skippedFiles } = await this.uploadLocalImages();
      console.log('');

      // Создание плейсхолдеров для пропущенных файлов
      let placeholders = [];
      if (skippedFiles.length > 0) {
        placeholders = await this.createPlaceholders(skippedFiles);
        console.log('');
      }

      // Проверка доступности изображений
      const verificationResults = await this.verifyImages(uploadedFiles, placeholders);
      console.log('');

      // Генерация констант
      if (uploadedFiles.length > 0 || placeholders.length > 0) {
        const constants = this.generateConstants(uploadedFiles, placeholders);

        console.log('📝 Сгенерированные константы для lib/constants.ts:');
        console.log('=' .repeat(60));
        console.log(constants);
        console.log('=' .repeat(60));

        // Запись в файл
        const constantsPath = path.join(__dirname, 'lib', 'constants.ts');
        try {
          fs.writeFileSync(constantsPath, constants);
          console.log(`✅ Константы обновлены в файле: ${constantsPath}`);
        } catch (error) {
          console.error('❌ Ошибка записи файла констант:', error.message);
        }
      }

      // Подробный отчет
      console.log('\n📊 Подробный отчет:');
      console.log(`✅ Загружено изображений: ${uploadedFiles.length}`);
      console.log(`🎨 Создано плейсхолдеров: ${placeholders.length}`);
      console.log(`⚠️  Пропущено файлов: ${skippedFiles.length}`);

      if (uploadedFiles.length > 0) {
        console.log('\n📁 Структура загруженных файлов:');
        const folderStats = {};
        uploadedFiles.forEach(file => {
          folderStats[file.folder] = (folderStats[file.folder] || 0) + 1;
        });

        Object.entries(folderStats).forEach(([folder, count]) => {
          console.log(`   ${folder}/: ${count} файлов`);
        });
      }

      if (placeholders.length > 0) {
        console.log('\n⚠️  Следующие файлы созданы как плейсхолдеры и требуют замены:');
        placeholders.forEach(p => {
          console.log(`   - ${p.folder}/${p.file}`);
        });
      }

      // Отчет о доступности
      const accessibleCount = verificationResults.filter(r => r.accessible).length;
      const totalCount = verificationResults.length;

      console.log(`\n🌐 Доступность через API: ${accessibleCount}/${totalCount} файлов`);

      if (accessibleCount < totalCount) {
        console.log('\n❌ Проблемы с доступностью:');
        verificationResults.filter(r => !r.accessible).forEach(r => {
          console.log(`   - ${r.folder}/${r.file}: ${r.error || `HTTP ${r.status}`}`);
        });
      }

      console.log('\n✅ Загрузка завершена успешно!');

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск скрипта
const uploader = new ImageUploader();
uploader.run().catch(console.error);