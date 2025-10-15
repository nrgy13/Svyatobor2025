#!/usr/bin/env node

/**
 * Исправленная загрузка всех изображений в Supabase
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
  { name: 'logo.png', folder: 'logos' },
  { name: 'logo-circle.png', folder: 'logos' },
  { name: 'hero-bg.jpg', folder: 'backgrounds' },
  { name: 'result-bg.jpg', folder: 'backgrounds' },
  { name: 'advantages-image.jpg', folder: 'sections' },
  { name: 'problem-image.jpg', folder: 'sections' },
  { name: 'service-trees.jpg', folder: 'services' },
  { name: 'service-grass.jpg', folder: 'services' },
  { name: 'service-spraying.jpg', folder: 'services' },
  { name: 'service-removal.jpg', folder: 'services' },
  { name: 'service-construction.jpg', folder: 'services' },
  { name: 'client-1.jpg', folder: 'clients' },
  { name: 'client-2.jpg', folder: 'clients' },
  { name: 'client-3.jpg', folder: 'clients' },
  { name: 'element.png', folder: 'elements' },
  { name: 'red-floral-ornament-white-background-embroidery.png', folder: 'elements' }
];

class FixedImageUploader {
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

  async ensureBucketExists() {
    console.log(`📦 Проверка бакета: ${this.bucketName}...`);

    try {
      // Пытаемся создать бакет
      const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error(`❌ Ошибка создания бакета:`, createError.message);
        return false;
      }

      console.log(`✅ Бакет '${this.bucketName}' готов`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка работы с бакетом:`, error.message);
      return false;
    }
  }

  async uploadAllImages() {
    console.log('📤 Загрузка всех изображений...');

    const results = {
      uploaded: [],
      failed: [],
      skipped: []
    };

    for (const imageInfo of IMAGES_TO_UPLOAD) {
      const localPath = path.join(this.imagesPath, imageInfo.name);

      console.log(`\n📷 Загрузка: ${imageInfo.folder}/${imageInfo.name}`);

      // Проверяем существует ли файл локально
      if (!fs.existsSync(localPath)) {
        console.log(`   ⚠️  Файл не найден локально`);
        results.skipped.push(imageInfo.name);
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(localPath);
        const fileExt = path.extname(imageInfo.name);
        const contentType = this.getContentType(fileExt);

        console.log(`   📏 Размер: ${fileBuffer.length} байт`);
        console.log(`   📄 Тип: ${contentType}`);

        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(`${imageInfo.folder}/${imageInfo.name}`, fileBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType
          });

        if (error) {
          console.log(`   ❌ Ошибка загрузки: ${error.message}`);
          results.failed.push({
            name: imageInfo.name,
            folder: imageInfo.folder,
            error: error.message
          });
        } else {
          console.log(`   ✅ Загружено успешно`);
          results.uploaded.push({
            name: imageInfo.name,
            folder: imageInfo.folder,
            path: data.path
          });
        }
      } catch (error) {
        console.log(`   ❌ Исключение: ${error.message}`);
        results.failed.push({
          name: imageInfo.name,
          folder: imageInfo.folder,
          error: error.message
        });
      }
    }

    return results;
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

  async verifyUploads(results) {
    console.log('\n🔍 Проверка загруженных изображений...');

    const verificationResults = [];

    for (const uploaded of results.uploaded) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(uploaded.path);

        console.log(`\n📷 Проверка: ${uploaded.folder}/${uploaded.name}`);
        console.log(`   URL: ${data.publicUrl}`);

        // Проверяем доступность URL
        const response = await fetch(data.publicUrl, { method: 'HEAD' });

        if (response.ok) {
          console.log(`   ✅ Доступен (HTTP ${response.status})`);
          console.log(`   📏 Размер: ${response.headers.get('content-length')} байт`);
          console.log(`   📄 Тип: ${response.headers.get('content-type')}`);

          verificationResults.push({
            name: uploaded.name,
            folder: uploaded.folder,
            url: data.publicUrl,
            accessible: true,
            status: response.status
          });
        } else {
          console.log(`   ❌ Не доступен (HTTP ${response.status})`);

          verificationResults.push({
            name: uploaded.name,
            folder: uploaded.folder,
            url: data.publicUrl,
            accessible: false,
            status: response.status
          });
        }
      } catch (error) {
        console.log(`   ❌ Ошибка проверки: ${error.message}`);

        verificationResults.push({
          name: uploaded.name,
          folder: uploaded.folder,
          error: error.message,
          accessible: false
        });
      }
    }

    return verificationResults;
  }

  async run() {
    try {
      console.log('🚀 Начало исправленной загрузки изображений...\n');

      // Инициализация
      this.initializeSupabase();

      // Проверка бакета
      const bucketReady = await this.ensureBucketExists();
      if (!bucketReady) {
        throw new Error('Бакет не готов');
      }
      console.log('');

      // Загрузка всех изображений
      const uploadResults = await this.uploadAllImages();

      // Проверка результатов загрузки
      const verificationResults = await this.verifyUploads(uploadResults);

      // Отчет
      console.log('\n' + '='.repeat(80));
      console.log('📊 ОТЧЕТ О ЗАГРУЗКЕ ИЗОБРАЖЕНИЙ');
      console.log('='.repeat(80));

      console.log(`\n📈 СТАТИСТИКА:`);
      console.log(`   ✅ Загружено успешно: ${uploadResults.uploaded.length}`);
      console.log(`   ❌ Не удалось загрузить: ${uploadResults.failed.length}`);
      console.log(`   ⚠️  Пропущено: ${uploadResults.skipped.length}`);

      if (uploadResults.failed.length > 0) {
        console.log(`\n❌ ОШИБКИ ЗАГРУЗКИ:`);
        uploadResults.failed.forEach((failed, index) => {
          console.log(`   ${index + 1}. ${failed.folder}/${failed.name}`);
          console.log(`      Ошибка: ${failed.error}`);
        });
      }

      if (uploadResults.uploaded.length > 0) {
        console.log(`\n📁 СТРУКТУРА ЗАГРУЖЕННЫХ ФАЙЛОВ:`);
        const folderStats = {};
        uploadResults.uploaded.forEach(file => {
          folderStats[file.folder] = (folderStats[file.folder] || 0) + 1;
        });

        Object.entries(folderStats).forEach(([folder, count]) => {
          console.log(`   ${folder}/: ${count} файлов`);
        });

        // Проверка доступности
        const accessibleCount = verificationResults.filter(r => r.accessible).length;
        const totalCount = verificationResults.length;

        console.log(`\n🌐 ДОСТУПНОСТЬ ЧЕРЕЗ API: ${accessibleCount}/${totalCount} файлов`);

        if (accessibleCount < totalCount) {
          console.log('\n❌ ПРОБЛЕМЫ С ДОСТУПНОСТЬЮ:');
          verificationResults.filter(r => !r.accessible).forEach(r => {
            console.log(`   - ${r.folder}/${r.name}: HTTP ${r.status}`);
          });
        }
      }

      console.log('\n' + '='.repeat(80));

      if (uploadResults.uploaded.length === IMAGES_TO_UPLOAD.length) {
        console.log('🎉 Все изображения успешно загружены и доступны!');
      } else {
        console.log('⚠️  Некоторые изображения не удалось загрузить.');
      }

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск скрипта
const uploader = new FixedImageUploader();
uploader.run().catch(console.error);