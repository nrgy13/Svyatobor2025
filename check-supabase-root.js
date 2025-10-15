#!/usr/bin/env node

/**
 * Проверка корневого уровня бакета Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseRootChecker {
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

  async checkRootBucket() {
    console.log(`\n🔍 Проверка корневого уровня бакета: ${this.bucketName}`);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw error;
      }

      console.log(`\n📊 Найдено ${data.length} элементов в корне бакета:`);

      if (data.length === 0) {
        console.log('❌ Бакет пуст');
        return [];
      }

      // Группируем файлы по типам
      const files = data.filter(item => item.metadata && item.metadata.mimetype);
      const folders = data.filter(item => !item.metadata || !item.metadata.mimetype);

      console.log(`\n📁 Папки (${folders.length}):`);
      folders.forEach(folder => {
        console.log(`   📂 ${folder.name}`);
      });

      console.log(`\n🖼️ Файлы изображений (${files.length}):`);
      files.forEach(file => {
        const size = file.metadata?.size || 0;
        const sizeMB = (size / (1024 * 1024)).toFixed(2);
        console.log(`   🖼️ ${file.name} | Размер: ${sizeMB} MB | Тип: ${file.metadata.mimetype}`);
      });

      return data;
    } catch (error) {
      console.error(`❌ Ошибка проверки бакета:`, error.message);
      return [];
    }
  }

  async run() {
    try {
      this.initializeSupabase();
      await this.checkRootBucket();

      console.log('\n🎯 АНАЛИЗ РЕЗУЛЬТАТОВ:');
      console.log('Если файлы найдены в корне бакета, их нужно переместить в соответствующие папки');
      console.log('или обновить URL в константах для соответствия структуре файлов');

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск проверки
const checker = new SupabaseRootChecker();
checker.run().catch(console.error);