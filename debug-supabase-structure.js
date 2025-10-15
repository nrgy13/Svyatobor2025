#!/usr/bin/env node

/**
 * Отладочный скрипт для детального анализа структуры Supabase бакета
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseStructureDebugger {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
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

  async listAllFiles() {
    console.log(`📁 Получение ВСЕХ файлов из бакета '${this.bucketName}'...`);

    try {
      // Получаем все файлы без ограничений
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 10000, // Максимальный лимит
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw error;
      }

      console.log(`\n📄 Найдено ${data.length} элементов:`);
      console.log('=' .repeat(80));

      // Группируем файлы по путям
      const filesByPath = {};
      const folders = new Set();

      data.forEach(file => {
        console.log(`${file.name} | Размер: ${file.metadata?.size || 0} | Создан: ${file.created_at}`);

        if (file.name.includes('/')) {
          const folder = file.name.split('/')[0];
          folders.add(folder);

          if (!filesByPath[folder]) {
            filesByPath[folder] = [];
          }
          filesByPath[folder].push(file.name);
        } else {
          // Файлы в корне
          if (!filesByPath['root']) {
            filesByPath['root'] = [];
          }
          filesByPath['root'].push(file.name);
        }
      });

      console.log('\n📂 Структура папок:');
      console.log('=' .repeat(80));

      Object.entries(filesByPath).forEach(([path, files]) => {
        if (path === 'root') {
          console.log(`Корень (${files.length} файлов):`);
          files.forEach(file => console.log(`  ${file}`));
        } else {
          console.log(`${path}/ (${files.length} файлов):`);
          files.forEach(file => console.log(`  ${file}`));
        }
      });

      console.log(`\n📊 Итого папок: ${folders.size}`);
      console.log(`📄 Итого файлов: ${data.length}`);

      return { data, folders: Array.from(folders), filesByPath };

    } catch (error) {
      console.error(`❌ Ошибка получения содержимого бакета:`, error.message);
      return { data: [], folders: [], filesByPath: {} };
    }
  }

  async checkSpecificPaths() {
    console.log('\n🔍 Проверка конкретных путей...');

    const testPaths = [
      'logos/logo.png',
      'backgrounds/hero-bg.jpg',
      'services/service-trees.jpg',
      'logos/.keep',
      'backgrounds/.keep'
    ];

    for (const path of testPaths) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(path);

        console.log(`\nПуть: ${path}`);
        console.log(`Public URL: ${data.publicUrl}`);

        // Проверяем доступность
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        console.log(`Доступность: ${response.ok ? '✅' : '❌'} (${response.status})`);

      } catch (error) {
        console.log(`❌ Ошибка проверки ${path}: ${error.message}`);
      }
    }
  }

  async run() {
    try {
      this.initializeSupabase();

      // Проверяем бакет
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucket = buckets.find(b => b.name === this.bucketName);

      if (bucket) {
        console.log(`✅ Бакет найден: ${bucket.name}`);
        console.log(`   Публичный: ${bucket.public}`);
        console.log(`   Создан: ${bucket.created_at}`);
      } else {
        console.log(`❌ Бакет '${this.bucketName}' не найден`);
        return;
      }

      // Детальный анализ содержимого
      const { data, folders, filesByPath } = await this.listAllFiles();

      // Проверка конкретных путей
      await this.checkSpecificPaths();

      console.log('\n🎯 РЕЗЮМЕ:');
      console.log(`Папок обнаружено: ${folders.length}`);
      console.log(`Всего элементов: ${data.length}`);

      if (folders.length > 0) {
        console.log('Обнаруженные папки:');
        folders.forEach(folder => console.log(`  - ${folder}`));
      }

      return { data, folders, filesByPath };

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск отладки
const debuggerTool = new SupabaseStructureDebugger();
debuggerTool.run().catch(console.error);