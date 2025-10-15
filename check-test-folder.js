#!/usr/bin/env node

/**
 * Проверка содержимого папки test в Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class TestFolderChecker {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
  }

  initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Необходимы переменные окружения: NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    this.supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Подключение к Supabase установлено');
  }

  async checkTestFolder() {
    console.log(`📁 Проверка содержимого папки 'test'...`);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('test', {
          limit: 1000
        });

      if (error) {
        console.error(`❌ Ошибка получения содержимого:`, error.message);
        return;
      }

      console.log(`📄 Найдено файлов: ${data.length}`);

      if (data.length === 0) {
        console.log(`📭 Папка пуста`);
      } else {
        data.forEach(file => {
          console.log(`  📄 ${file.name}`);
          console.log(`     Размер: ${file.metadata?.size || 0} байт`);
          console.log(`     Тип: ${file.metadata?.mimetype || 'неизвестен'}`);
          console.log(`     Создан: ${file.created_at}`);

          // Проверяем публичный URL
          const { data: publicUrlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(`test/${file.name}`);

          console.log(`     Публичный URL: ${publicUrlData.publicUrl}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error(`❌ Ошибка проверки папки:`, error.message);
    }
  }

  async run() {
    try {
      this.initializeSupabase();
      await this.checkTestFolder();
    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск проверки
const checker = new TestFolderChecker();
checker.run().catch(console.error);