#!/usr/bin/env node

/**
 * Скрипт для загрузки изображений в Supabase Storage
 *
 * Использование: node upload-images-fixed.js
 *
 * Требуемые переменные окружения:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
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

// Конфигурация структуры папок
const FOLDER_STRUCTURE = {
  'logos': [
    { name: 'logo.png', required: true },
    { name: 'logo-circle.png', required: true }
  ],
  'backgrounds': [
    { name: 'hero-bg.jpg', required: true },
    { name: 'result-bg.jpg', required: true }
  ],
  'sections': [
    { name: 'advantages-image.jpg', required: true },
    { name: 'problem-image.jpg', required: true }
  ],
  'services': [
    { name: 'service-trees.jpg', required: true },
    { name: 'service-grass.jpg', required: true },
    { name: 'service-spraying.jpg', required: true },
    { name: 'service-removal.jpg', required: true },
    { name: 'service-construction.jpg', required: true }
  ],
  'clients': [
    { name: 'client-1.jpg', required: false },
    { name: 'client-2.jpg', required: false },
    { name: 'client-3.jpg', required: false }
  ]
};

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
  'client-3.jpg': '#FF6347'
};

class ImageUploader {
  constructor() {
    this.supabase = null;
    this.bucketName = 'Svyatobor2025';
    this.imagesPath = path.join(__dirname, 'public', 'images');
  }

  /**
   * Инициализация Supabase клиента
   */
  initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  }

  /**
   * Создание структуры папок в бакете
   */
  async createFolderStructure() {
    console.log('📁 Создание структуры папок...');

    for (const [folderName] of Object.entries(FOLDER_STRUCTURE)) {
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

    for (const [folderName, files] of Object.entries(FOLDER_STRUCTURE)) {
      for (const file of files) {
        const localPath = path.join(this.imagesPath, file.name);

        // Проверяем существует ли файл локально
        if (fs.existsSync(localPath)) {
          try {
            const fileBuffer = fs.readFileSync(localPath);
            const fileExt = path.extname(file.name);
            const contentType = this.getContentType(fileExt);

            const { data, error } = await this.supabase.storage
              .from(this.bucketName)
              .upload(`${folderName}/${file.name}`, fileBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: contentType
              });

            if (error) {
              console.error(`❌ Ошибка загрузки ${file.name}:`, error.message);
            } else {
              console.log(`✅ Загружено: ${folderName}/${file.name}`);
              uploadedFiles.push({
                folder: folderName,
                file: file.name,
                path: data.path
              });
            }
          } catch (error) {
            console.error(`❌ Ошибка чтения файла ${file.name}:`, error.message);
          }
        } else {
          console.log(`⚠️  Файл не найден локально: ${file.name}`);
        }
      }
    }

    return uploadedFiles;
  }

  /**
   * Создание плейсхолдеров для недостающих изображений
   */
  async createPlaceholders() {
    console.log('🎨 Создание плейсхолдеров...');

    const placeholders = [];

    for (const [folderName, files] of Object.entries(FOLDER_STRUCTURE)) {
      for (const file of files) {
        const localPath = path.join(this.imagesPath, file.name);

        // Если файл не существует локально, создаем плейсхолдер
        if (!fs.existsSync(localPath)) {
          try {
            const placeholderBuffer = await this.createPlaceholderImage(file.name, 800, 600);
            const contentType = this.getContentType(path.extname(file.name));

            const { data, error } = await this.supabase.storage
              .from(this.bucketName)
              .upload(`${folderName}/${file.name}`, placeholderBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: contentType
              });

            if (error) {
              console.error(`❌ Ошибка создания плейсхолдера ${file.name}:`, error.message);
            } else {
              console.log(`✅ Создан плейсхолдер: ${folderName}/${file.name}`);
              placeholders.push({
                folder: folderName,
                file: file.name,
                path: data.path,
                isPlaceholder: true
              });
            }
          } catch (error) {
            console.error(`❌ Ошибка создания плейсхолдера ${file.name}:`, error.message);
          }
        }
      }
    }

    return placeholders;
  }

  /**
   * Создание изображения плейсхолдера с помощью Canvas API (в Node.js)
   */
  async createPlaceholderImage(fileName, width, height) {
    // Простая реализация плейсхолдера - создаем SVG
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
      const uploadedFiles = await this.uploadLocalImages();
      console.log('');

      // Создание плейсхолдеров
      const placeholders = await this.createPlaceholders();
      console.log('');

      // Генерация констант
      if (uploadedFiles.length > 0 || placeholders.length > 0) {
        const constants = this.generateConstants(uploadedFiles, placeholders);

        console.log('📝 Сгенерированные константы для lib/constants.ts:');
        console.log('=' .repeat(50));
        console.log(constants);
        console.log('=' .repeat(50));

        // Запись в файл
        const constantsPath = path.join(__dirname, 'lib', 'constants.ts');
        try {
          fs.writeFileSync(constantsPath, constants);
          console.log(`✅ Константы обновлены в файле: ${constantsPath}`);
        } catch (error) {
          console.error('❌ Ошибка записи файла констант:', error.message);
        }
      }

      // Отчет
      console.log('\n📊 Отчет:');
      console.log(`✅ Загружено локальных изображений: ${uploadedFiles.length}`);
      console.log(`🎨 Создано плейсхолдеров: ${placeholders.length}`);

      if (placeholders.length > 0) {
        console.log('\n⚠️  Следующие файлы созданы как плейсхолдеры и требуют замены:');
        placeholders.forEach(p => {
          console.log(`   - ${p.folder}/${p.file}`);
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