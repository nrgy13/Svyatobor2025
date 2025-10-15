#!/usr/bin/env node

/**
 * Скрипт для создания бакета и загрузки изображений в Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

class BucketCreator {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
    this.imagesPath = path.join(__dirname, 'images');
  }

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
  }

  async createBucket() {
    console.log(`📦 Создание бакета: ${this.bucketName}...`);

    try {
      // Создаем публичный бакет
      const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Бакет '${this.bucketName}' уже существует`);
          return true;
        } else {
          throw error;
        }
      }

      console.log(`✅ Бакет '${this.bucketName}' успешно создан`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка создания бакета:`, error.message);
      return false;
    }
  }

  async uploadImages() {
    console.log('📤 Загрузка изображений...');

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

          console.log(`   Загружаем: ${imageInfo.folder}/${imageInfo.name}`);

          const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(`${imageInfo.folder}/${imageInfo.name}`, fileBuffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: contentType
            });

          if (error) {
            console.error(`❌ Ошибка загрузки ${imageInfo.name}:`, error.message);
          } else {
            console.log(`✅ Загружено: ${imageInfo.folder}/${imageInfo.name}`);
            uploadedFiles.push({
              folder: imageInfo.folder,
              file: imageInfo.name,
              path: data.path
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

  getContentType(extension) {
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  async verifyImages(uploadedFiles) {
    console.log('🔍 Проверка доступности изображений...');

    const results = [];

    for (const file of uploadedFiles) {
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

  async run() {
    try {
      console.log('🚀 Начало создания бакета и загрузки изображений...\n');

      // Инициализация
      this.initializeSupabase();

      // Создание бакета
      const bucketCreated = await this.createBucket();
      if (!bucketCreated) {
        throw new Error('Не удалось создать бакет');
      }
      console.log('');

      // Загрузка изображений
      const { uploadedFiles, skippedFiles } = await this.uploadImages();
      console.log('');

      // Проверка доступности изображений
      if (uploadedFiles.length > 0) {
        const verificationResults = await this.verifyImages(uploadedFiles);
        console.log('');

        // Подробный отчет
        console.log('\n📊 Подробный отчет:');
        console.log(`✅ Загружено изображений: ${uploadedFiles.length}`);
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
      }

      console.log('\n✅ Процесс завершен!');

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск скрипта
const creator = new BucketCreator();
creator.run().catch(console.error);