#!/usr/bin/env node

/**
 * Диагностический скрипт для проверки изображений в Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация из констант
const EXPECTED_IMAGES = {
  LOGO: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/logos/logo.png",
  LOGO_CIRCLE: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/logos/logo-circle.png",
  HERO_BG: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/backgrounds/hero-bg.jpg",
  RESULT_BG: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/backgrounds/result-bg.jpg",
  ADVANTAGES_IMAGE: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/sections/advantages-image.jpg",
  PROBLEM_IMAGE: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/sections/problem-image.jpg",
  SERVICE_TREES: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/services/service-trees.jpg",
  SERVICE_GRASS: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/services/service-grass.jpg",
  SERVICE_SPRAYING: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/services/service-spraying.jpg",
  SERVICE_REMOVAL: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/services/service-removal.jpg",
  SERVICE_CONSTRUCTION: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/services/service-construction.jpg",
  CLIENT_1: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/clients/client-1.jpg",
  CLIENT_2: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/clients/client-2.jpg",
  CLIENT_3: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/clients/client-3.jpg",
  ELEMENT: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/elements/element.png",
  RED_FLORAL_ORNAMENT_WHITE_BACKGROUND_EMBROIDERY: "https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/images/elements/red-floral-ornament-white-background-embroidery.png",
};

// Ожидаемая структура папок
const EXPECTED_FOLDERS = [
  'logos',
  'backgrounds',
  'sections',
  'services',
  'clients',
  'elements'
];

class SupabaseImageChecker {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
    this.results = {
      connection: false,
      bucketExists: false,
      folders: [],
      files: [],
      accessibility: {},
      errors: []
    };
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
    this.results.connection = true;
  }

  /**
   * Проверка существования бакета
   */
  async checkBucketExists() {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      const bucket = data.find(b => b.name === this.bucketName);
      this.results.bucketExists = !!bucket;

      if (bucket) {
        console.log(`✅ Бакет '${this.bucketName}' найден`);
        console.log(`   Создан: ${new Date(bucket.created_at).toLocaleString()}`);
        console.log(`   Публичный: ${bucket.public}`);
      } else {
        console.log(`❌ Бакет '${this.bucketName}' не найден`);
        this.results.errors.push(`Бакет '${this.bucketName}' не существует`);
      }

      return this.results.bucketExists;
    } catch (error) {
      console.error(`❌ Ошибка проверки бакета:`, error.message);
      this.results.errors.push(`Ошибка проверки бакета: ${error.message}`);
      return false;
    }
  }

  /**
   * Получение списка файлов в бакете
   */
  async listBucketContents() {
    if (!this.results.bucketExists) {
      return;
    }

    try {
      console.log(`📁 Получение содержимого бакета '${this.bucketName}'...`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw error;
      }

      this.results.files = data || [];
      console.log(`✅ Найдено ${this.results.files.length} файлов/папок`);

      // Группируем по папкам
      const folders = {};
      this.results.files.forEach(file => {
        if (file.metadata && file.metadata.size === 0) {
          // Это папка (пустой файл .keep)
          folders[file.name.replace('/.keep', '')] = {
            name: file.name.replace('/.keep', ''),
            created: file.created_at,
            isFolder: true
          };
        }
      });

      this.results.folders = Object.values(folders);

      // Показываем структуру
      if (this.results.folders.length > 0) {
        console.log('\n📂 Структура папок:');
        this.results.folders.forEach(folder => {
          console.log(`   ${folder.name}/`);
        });
      }

      return this.results.files;
    } catch (error) {
      console.error(`❌ Ошибка получения содержимого бакета:`, error.message);
      this.results.errors.push(`Ошибка получения содержимого бакета: ${error.message}`);
      return [];
    }
  }

  /**
   * Проверка доступности изображений по URL
   */
  async checkImageAccessibility() {
    console.log('\n🌐 Проверка доступности изображений по URL...');

    const results = {};

    for (const [imageName, imageUrl] of Object.entries(EXPECTED_IMAGES)) {
      try {
        console.log(`Проверяем: ${imageName}`);

        const response = await fetch(imageUrl, {
          method: 'HEAD',
          timeout: 10000
        });

        const isAccessible = response.ok;
        results[imageName] = {
          url: imageUrl,
          accessible: isAccessible,
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        };

        if (isAccessible) {
          console.log(`   ✅ ${imageName}: Доступно (${response.status})`);
        } else {
          console.log(`   ❌ ${imageName}: Не доступно (${response.status})`);
        }

      } catch (error) {
        console.log(`   ❌ ${imageName}: Ошибка - ${error.message}`);
        results[imageName] = {
          url: imageUrl,
          accessible: false,
          error: error.message
        };
      }
    }

    this.results.accessibility = results;
    return results;
  }

  /**
   * Сравнение ожидаемой и фактической структуры
   */
  compareStructures() {
    console.log('\n🔍 Сравнение структур...');

    const expectedFolders = [...EXPECTED_FOLDERS];
    const actualFolders = this.results.folders.map(f => f.name);

    const missingFolders = expectedFolders.filter(f => !actualFolders.includes(f));
    const extraFolders = actualFolders.filter(f => !expectedFolders.includes(f));

    console.log('📊 Анализ папок:');
    console.log(`   Ожидаемых папок: ${expectedFolders.length}`);
    console.log(`   Найдено папок: ${actualFolders.length}`);

    if (missingFolders.length > 0) {
      console.log(`   ❌ Отсутствующие папки: ${missingFolders.join(', ')}`);
    }

    if (extraFolders.length > 0) {
      console.log(`   ℹ️ Дополнительные папки: ${extraFolders.join(', ')}`);
    }

    if (missingFolders.length === 0 && extraFolders.length === 0) {
      console.log('   ✅ Структура папок совпадает с ожидаемой');
    }

    return {
      expectedFolders,
      actualFolders,
      missingFolders,
      extraFolders
    };
  }

  /**
   * Генерация отчета
   */
  generateReport() {
    console.log('\n📋 ГЕНЕРАЦИЯ ДИАГНОСТИЧЕСКОГО ОТЧЕТА');
    console.log('=' .repeat(60));

    // Общая информация
    console.log(`\n🔗 Подключение: ${this.results.connection ? '✅ Успешно' : '❌ Ошибка'}`);
    console.log(`📦 Бакет '${this.bucketName}': ${this.results.bucketExists ? '✅ Существует' : '❌ Не найден'}`);
    console.log(`📁 Папок в бакете: ${this.results.folders.length}`);
    console.log(`📄 Файлов в бакете: ${this.results.files.filter(f => !f.name.includes('.keep')).length}`);

    // Структура папок
    const structureComparison = this.compareStructures();

    // Доступность изображений
    const accessibleImages = Object.values(this.results.accessibility).filter(img => img.accessible).length;
    const totalImages = Object.keys(this.results.accessibility).length;

    console.log(`\n🌐 Доступность изображений: ${accessibleImages}/${totalImages}`);

    if (accessibleImages < totalImages) {
      console.log('\n❌ Проблемные изображения:');
      Object.entries(this.results.accessibility).forEach(([name, result]) => {
        if (!result.accessible) {
          console.log(`   ${name}: ${result.error || `HTTP ${result.status}`} (${result.url})`);
        }
      });
    }

    // Рекомендации
    console.log('\n💡 РЕКОМЕНДАЦИИ:');

    if (!this.results.connection) {
      console.log('   ❌ Исправьте настройки подключения к Supabase');
    }

    if (!this.results.bucketExists) {
      console.log(`   ❌ Создайте бакет '${this.bucketName}' в Supabase Dashboard`);
    }

    if (structureComparison.missingFolders.length > 0) {
      console.log(`   ❌ Создайте отсутствующие папки: ${structureComparison.missingFolders.join(', ')}`);
    }

    if (accessibleImages < totalImages) {
      console.log(`   ❌ Загрузите недоступные изображения в соответствующие папки`);
      console.log(`   💡 Используйте скрипт: node upload-to-supabase.js`);
    }

    if (this.results.errors.length > 0) {
      console.log(`   ⚠️ Исправьте следующие ошибки:`);
      this.results.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }

    if (this.results.connection && this.results.bucketExists &&
        structureComparison.missingFolders.length === 0 && accessibleImages === totalImages) {
      console.log('   ✅ Все изображения корректно настроены и доступны!');
    }

    console.log('\n' + '=' .repeat(60));

    return {
      connection: this.results.connection,
      bucketExists: this.results.bucketExists,
      foldersCount: this.results.folders.length,
      filesCount: this.results.files.filter(f => !f.name.includes('.keep')).length,
      accessibleImages,
      totalImages,
      structureComparison,
      errors: this.results.errors,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Генерация рекомендаций
   */
  generateRecommendations() {
    const recommendations = [];

    if (!this.results.connection) {
      recommendations.push('Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!this.results.bucketExists) {
      recommendations.push(`Создайте бакет '${this.bucketName}' в Supabase Dashboard с публичным доступом`);
    }

    const structureComparison = this.compareStructures();
    if (structureComparison.missingFolders.length > 0) {
      recommendations.push(`Создайте папки в бакете: ${structureComparison.missingFolders.join(', ')}`);
    }

    const inAccessibleImages = Object.values(this.results.accessibility).filter(img => !img.accessible);
    if (inAccessibleImages.length > 0) {
      recommendations.push('Загрузите отсутствующие изображения с помощью скрипта upload-to-supabase.js');
    }

    if (recommendations.length === 0) {
      recommendations.push('Все настройки корректны');
    }

    return recommendations;
  }

  /**
   * Основной метод выполнения
   */
  async run() {
    try {
      console.log('🚀 Диагностика изображений в Supabase Storage...\n');

      // Инициализация
      this.initializeSupabase();

      // Проверка бакета
      const bucketExists = await this.checkBucketExists();
      if (!bucketExists) {
        this.generateReport();
        return;
      }

      // Получение содержимого
      await this.listBucketContents();

      // Проверка доступности
      await this.checkImageAccessibility();

      // Генерация отчета
      const report = this.generateReport();

      return report;

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      this.results.errors.push(`Критическая ошибка: ${error.message}`);
      this.generateReport();
      process.exit(1);
    }
  }
}

// Запуск диагностики
const checker = new SupabaseImageChecker();
checker.run().catch(console.error);