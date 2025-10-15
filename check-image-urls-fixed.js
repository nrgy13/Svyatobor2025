#!/usr/bin/env node

/**
 * Комплексная проверка URL изображений из констант
 * Проверяет доступность URL и соответствие структуре файлов в Supabase
 * ИСПРАВЛЕННАЯ ВЕРСИЯ
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

class ImageURLChecker {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
    this.images = null;
    this.results = {
      total: 0,
      accessible: 0,
      notAccessible: 0,
      inSupabase: 0,
      notInSupabase: 0,
      errors: []
    };
  }

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

  // Загружаем константы изображений
  loadImageConstants() {
    // Имитируем структуру из constants.ts
    this.images = {
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

    this.results.total = Object.keys(this.images).length;
    console.log(`📋 Загружено ${this.results.total} изображений для проверки`);
  }

  // Проверка доступности URL
  async checkURLAccessibility(url, name) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.request(url, { method: 'HEAD' }, (res) => {
        const status = res.statusCode;
        const isAccessible = status >= 200 && status < 400;

        resolve({
          name,
          url,
          status,
          accessible: isAccessible,
          error: null
        });
      });

      req.on('error', (err) => {
        resolve({
          name,
          url,
          status: null,
          accessible: false,
          error: err.message
        });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          name,
          url,
          status: null,
          accessible: false,
          error: 'Timeout'
        });
      });

      req.end();
    });
  }

  // Извлечение пути файла из URL
  extractFilePath(url) {
    const baseUrl = 'https://bvuagbjdedtfmvitrfpa.supabase.co/storage/v1/object/public/';
    if (url.startsWith(baseUrl)) {
      return url.substring(baseUrl.length);
    }
    return null;
  }

  // Проверка существования файла в Supabase (ИСПРАВЛЕННАЯ ВЕРСИЯ)
  async checkFileInSupabase(filePath) {
    try {
      // Разбиваем путь на папку и имя файла
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');

      console.log(`   🔍 Поиск файла: ${fileName} в папке: ${folderPath || 'корень'}`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath || '', {
          limit: 1000
        });

      if (error) {
        console.log(`   ❌ Ошибка API: ${error.message}`);
        return { exists: false, error: error.message };
      }

      console.log(`   📁 Найдено файлов в папке: ${data.length}`);

      // Ищем точное совпадение имени файла
      const fileExists = data.some(file => file.name === fileName);

      if (fileExists) {
        const foundFile = data.find(file => file.name === fileName);
        console.log(`   ✅ Файл найден: ${fileName} (${foundFile.metadata?.size || 0} байт)`);
      } else {
        console.log(`   ❌ Файл не найден. Доступные файлы: ${data.map(f => f.name).join(', ')}`);
      }

      return { exists: fileExists, error: null };
    } catch (error) {
      console.log(`   ❌ Исключение: ${error.message}`);
      return { exists: false, error: error.message };
    }
  }

  // Проверка всех изображений
  async checkAllImages() {
    console.log('\n🔍 Начинаем комплексную проверку изображений...\n');

    for (const [name, url] of Object.entries(this.images)) {
      console.log(`\n📷 Проверка: ${name}`);
      console.log(`   URL: ${url}`);

      // 1. Проверка доступности URL
      const urlCheck = await this.checkURLAccessibility(url, name);

      if (urlCheck.accessible) {
        this.results.accessible++;
        console.log(`   ✅ Доступен (HTTP ${urlCheck.status})`);
      } else {
        this.results.notAccessible++;
        this.results.errors.push({
          name,
          url,
          type: 'URL_ACCESS',
          error: urlCheck.error || `HTTP ${urlCheck.status}`
        });
        console.log(`   ❌ Недоступен (${urlCheck.error || `HTTP ${urlCheck.status}`})`);
      }

      // 2. Проверка существования в Supabase
      const filePath = this.extractFilePath(url);
      if (filePath) {
        const supabaseCheck = await this.checkFileInSupabase(filePath);

        if (supabaseCheck.exists) {
          this.results.inSupabase++;
          console.log(`   ✅ Файл существует в Supabase`);
        } else {
          this.results.notInSupabase++;
          this.results.errors.push({
            name,
            url,
            type: 'SUPABASE_FILE',
            error: supabaseCheck.error || 'Файл не найден в бакете'
          });
          console.log(`   ❌ Файл отсутствует в Supabase (${supabaseCheck.error || 'не найден'})`);
        }
      } else {
        this.results.errors.push({
          name,
          url,
          type: 'INVALID_URL',
          error: 'Невозможно извлечь путь файла из URL'
        });
        console.log(`   ❌ Невозможно извлечь путь файла из URL`);
      }
    }
  }

  // Генерация отчета
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ОТЧЕТ О ПРОВЕРКЕ ИЗОБРАЖЕНИЙ');
    console.log('='.repeat(80));

    console.log(`\n📈 СТАТИСТИКА:`);
    console.log(`   Всего изображений: ${this.results.total}`);
    console.log(`   Доступных по URL: ${this.results.accessible}`);
    console.log(`   Недоступных по URL: ${this.results.notAccessible}`);
    console.log(`   Существующих в Supabase: ${this.results.inSupabase}`);
    console.log(`   Отсутствующих в Supabase: ${this.results.notInSupabase}`);

    if (this.results.errors.length > 0) {
      console.log(`\n❌ ПРОБЛЕМЫ (${this.results.errors.length}):`);

      const errorsByType = this.results.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(errorsByType).forEach(([type, count]) => {
        const typeNames = {
          'URL_ACCESS': 'Проблемы с доступностью URL',
          'SUPABASE_FILE': 'Файлы отсутствуют в Supabase',
          'INVALID_URL': 'Некорректные URL'
        };
        console.log(`   ${typeNames[type] || type}: ${count}`);
      });

      console.log(`\n📋 ПОДРОБНЫЙ СПИСОК ПРОБЛЕМ:`);
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.name}`);
        console.log(`      URL: ${error.url}`);
        console.log(`      Тип: ${error.type}`);
        console.log(`      Ошибка: ${error.error}`);
      });
    }

    console.log(`\n✅ РЕКОМЕНДАЦИИ:`);
    if (this.results.notAccessible > 0) {
      console.log(`   - Проверьте настройки сети и доступность Supabase Storage`);
    }
    if (this.results.notInSupabase > 0) {
      console.log(`   - Загрузите отсутствующие изображения в соответствующие папки Supabase`);
      console.log(`   - Убедитесь, что файлы загружены в правильные директории`);
    }
    if (this.results.accessible === this.results.total && this.results.inSupabase === this.results.total) {
      console.log(`   🎉 Все изображения корректны и доступны!`);
    }

    console.log('\n' + '='.repeat(80));
  }

  async run() {
    try {
      this.initializeSupabase();
      this.loadImageConstants();
      await this.checkAllImages();
      this.generateReport();

      // Возврат кода выхода для CI/CD
      const hasErrors = this.results.errors.length > 0;
      process.exit(hasErrors ? 1 : 0);

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск проверки
const checker = new ImageURLChecker();
checker.run().catch(console.error);