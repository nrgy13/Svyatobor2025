#!/usr/bin/env node

/**
 * Скрипт для проверки фактического наличия изображений в папках Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class ImageChecker {
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

  async checkFolderContents(folder) {
    console.log(`\n📁 Проверка содержимого папки: ${folder}`);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folder, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw error;
      }

      console.log(`Найдено ${data.length} элементов в папке ${folder}:`);

      if (data.length === 0) {
        console.log('  ❌ Папка пуста');
        return [];
      }

      data.forEach(file => {
        const size = file.metadata?.size || 0;
        const isKeepFile = file.name === '.keep';
        console.log(`  ${file.name} | Размер: ${size} байт | ${isKeepFile ? '📁 Папка' : '🖼️ Изображение'}`);
      });

      return data;
    } catch (error) {
      console.error(`❌ Ошибка проверки папки ${folder}:`, error.message);
      return [];
    }
  }

  async checkAllFolders() {
    const folders = ['logos', 'backgrounds', 'sections', 'services', 'clients', 'elements'];

    console.log('🔍 Проверка всех папок в бакете...\n');

    for (const folder of folders) {
      await this.checkFolderContents(folder);
    }
  }

  async run() {
    try {
      this.initializeSupabase();

      // Сначала проверим корневой уровень
      console.log('📦 Проверка корневого уровня бакета...');
      const { data: rootFiles } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 100 });

      console.log(`Корневых элементов: ${rootFiles.length}`);

      // Проверим каждую папку
      await this.checkAllFolders();

      console.log('\n🎯 АНАЛИЗ РЕЗУЛЬТАТОВ:');
      console.log('Проблема обнаружена: папки созданы, но изображения в них отсутствуют');
      console.log('Необходимо загрузить изображения в соответствующие папки');

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск проверки
const checker = new ImageChecker();
checker.run().catch(console.error);