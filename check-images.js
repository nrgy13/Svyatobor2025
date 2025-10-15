#!/usr/bin/env node

/**
 * Скрипт для диагностики проблем с загрузкой изображений из Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageDiagnostics {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images'; // Правильное название бакета
  }

  initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Необходимы переменные окружения: NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Подключение к Supabase установлено');
  }

  async checkBucketExists() {
    console.log(`🔍 Проверка существования бакетов в Supabase Storage`);

    try {
      const { data, error } = await this.supabase.storage.listBuckets();

      if (error) {
        console.error('❌ Ошибка при получении списка бакетов:', error.message);
        return { exists: false, buckets: [] };
      }

      console.log(`📋 Найдено бакетов: ${data.length}`);
      data.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'публичный' : 'приватный'})`);
      });

      const bucketExists = data.some(bucket => bucket.name === this.bucketName);

      if (bucketExists) {
        console.log(`✅ Бакет '${this.bucketName}' существует`);
        return { exists: true, buckets: data };
      } else {
        console.log(`⚠️  Бакет '${this.bucketName}' не найден`);

        // Ищем бакеты, которые могут содержать изображения
        const imageBuckets = data.filter(bucket =>
          bucket.name.includes('image') ||
          bucket.name.includes('img') ||
          bucket.name.includes('media') ||
          bucket.name.includes('files')
        );

        if (imageBuckets.length > 0) {
          console.log(`💡 Возможные бакеты с изображениями:`);
          imageBuckets.forEach(bucket => {
            console.log(`   - ${bucket.name}`);
          });
        }

        return { exists: false, buckets: data };
      }
    } catch (error) {
      console.error('❌ Ошибка при проверке бакета:', error.message);
      return { exists: false, buckets: [] };
    }
  }

  async checkImageFiles() {
    console.log(`📁 Проверка файлов в бакете '${this.bucketName}'`);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('❌ Ошибка при получении списка файлов:', error.message);
        return [];
      }

      console.log(`✅ Найдено файлов: ${data.length}`);

      if (data.length > 0) {
        console.log('📋 Файлы в бакете:');
        data.forEach(file => {
          console.log(`   - ${file.name}`);
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Ошибка при проверке файлов:', error.message);
      return [];
    }
  }

  async testImageUrls() {
    console.log('🔗 Тестирование URL изображений...');

    const testImages = [
      'logos/logo.png',
      'backgrounds/hero-bg.jpg',
      'sections/problem-image.jpg',
      'logos/logo-circle.png'
    ];

    const results = [];

    for (const imagePath of testImages) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(imagePath);

        console.log(`\n🖼️  Тестирование: ${imagePath}`);
        console.log(`   URL: ${data.publicUrl}`);

        // Тестируем доступность
        const response = await fetch(data.publicUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 секунд таймаут
        });

        const isAccessible = response.ok;
        console.log(`   Доступность: ${isAccessible ? '✅ Доступен' : '❌ Не доступен'}`);
        console.log(`   HTTP статус: ${response.status}`);

        if (!isAccessible) {
          console.log(`   Заголовки ответа:`, Object.fromEntries(response.headers.entries()));
        }

        results.push({
          path: imagePath,
          url: data.publicUrl,
          accessible: isAccessible,
          status: response.status
        });

      } catch (error) {
        console.error(`❌ Ошибка тестирования ${imagePath}:`, error.message);
        results.push({
          path: imagePath,
          error: error.message,
          accessible: false
        });
      }
    }

    return results;
  }

  async runDiagnostics() {
    console.log('🚀 Диагностика проблем с изображениями в Supabase Storage\n');

    try {
      // Инициализация
      this.initializeSupabase();

      // Проверка бакетов
      const bucketCheck = await this.checkBucketExists();

      if (!bucketCheck.exists && bucketCheck.buckets.length === 0) {
        console.log('\n❌ Диагностика прервана: нет доступных бакетов');
        return;
      }

      console.log('');

      // Если бакет 'images' не найден, но есть другие бакеты
      let targetBucket = this.bucketName;
      if (!bucketCheck.exists) {
        console.log(`🔄 Используем первый доступный бакет для проверки...`);
        targetBucket = bucketCheck.buckets[0].name;
        console.log(`📦 Переключаемся на бакет: ${targetBucket}`);
      }

      // Временно меняем название бакета для проверки
      const originalBucket = this.bucketName;
      this.bucketName = targetBucket;

      // Проверка файлов
      const files = await this.checkImageFiles();
      console.log('');

      // Тестирование URL
      const urlTests = await this.testImageUrls();
      console.log('');

      // Отчет
      console.log('\n📊 Отчет диагностики:');
      console.log(`Бакет '${targetBucket}' существует: ✅`);
      console.log(`Файлов в бакете: ${files.length}`);

      const accessibleImages = urlTests.filter(test => test.accessible).length;
      const totalImages = urlTests.length;
      console.log(`Доступных изображений: ${accessibleImages}/${totalImages}`);

      if (files.length > 0) {
        console.log('\n📁 Структура файлов в бакете:');
        const folderStats = {};
        files.forEach(file => {
          const folder = file.name.includes('/') ? file.name.split('/')[0] : 'корень';
          folderStats[folder] = (folderStats[folder] || 0) + 1;
        });

        Object.entries(folderStats).forEach(([folder, count]) => {
          console.log(`   ${folder}/: ${count} файлов`);
        });
      }

      if (accessibleImages < totalImages) {
        console.log('\n❌ Проблемы с доступностью изображений:');
        urlTests.filter(test => !test.accessible).forEach(test => {
          console.log(`   - ${test.path}: ${test.error || `HTTP ${test.status}`}`);
        });

        console.log('\n🔧 Возможные решения:');
        console.log('   1. Проверьте политики доступа (RLS) в Supabase Dashboard');
        console.log('   2. Убедитесь, что файлы действительно загружены в бакет');
        console.log('   3. Проверьте настройки CORS в бакете Supabase');
        console.log('   4. Убедитесь, что изображения публичны');
      } else {
        console.log('\n✅ Все изображения доступны!');

        if (targetBucket !== originalBucket) {
          console.log(`\n🔄 Рекомендация: обновите bucketName в коде`);
          console.log(`   Текущее значение: '${originalBucket}'`);
          console.log(`   Рекомендуемое значение: '${targetBucket}'`);
        }
      }

    } catch (error) {
      console.error('❌ Критическая ошибка диагностики:', error.message);
    }
  }
}

// Запуск диагностики
const diagnostics = new ImageDiagnostics();
diagnostics.runDiagnostics().catch(console.error);