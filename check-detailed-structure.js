#!/usr/bin/env node

/**
 * Детальная проверка структуры Supabase бакета
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class DetailedStructureChecker {
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

  async checkAllFolders() {
    const folders = ['logos', 'backgrounds', 'sections', 'services', 'clients', 'elements'];

    console.log(`📁 Проверка содержимого всех папок в бакете '${this.bucketName}'...\n`);

    for (const folder of folders) {
      console.log(`📂 Папка: ${folder}/`);
      console.log('─'.repeat(50));

      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .list(folder, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) {
          console.log(`❌ Ошибка получения содержимого: ${error.message}`);
        } else {
          if (data.length === 0) {
            console.log(`📭 Папка пуста`);
          } else {
            data.forEach(file => {
              console.log(`  📄 ${file.name}`);
              console.log(`     Размер: ${file.metadata?.size || 0} байт`);
              console.log(`     Тип: ${file.metadata?.mimetype || 'неизвестен'}`);
              console.log(`     Создан: ${file.created_at}`);
              console.log('');
            });
          }
        }
      } catch (error) {
        console.log(`❌ Исключение: ${error.message}`);
      }

      console.log('');
    }
  }

  async checkSpecificFiles() {
    const filesToCheck = [
      'logos/logo.png',
      'logos/logo-circle.png',
      'backgrounds/hero-bg.jpg',
      'backgrounds/result-bg.jpg',
      'sections/advantages-image.jpg',
      'sections/problem-image.jpg',
      'services/service-trees.jpg',
      'services/service-grass.jpg',
      'services/service-spraying.jpg',
      'services/service-removal.jpg',
      'services/service-construction.jpg',
      'clients/client-1.jpg',
      'clients/client-2.jpg',
      'clients/client-3.jpg',
      'elements/element.png',
      'elements/red-floral-ornament-white-background-embroidery.png'
    ];

    console.log('🔍 Проверка конкретных файлов...\n');

    for (const filePath of filesToCheck) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

        console.log(`Файл: ${filePath}`);
        console.log(`URL: ${data.publicUrl}`);

        // Проверяем доступность
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        console.log(`Доступность: ${response.ok ? '✅' : '❌'} (${response.status})`);

        if (response.ok) {
          console.log(`Размер: ${response.headers.get('content-length') || 'неизвестен'} байт`);
          console.log(`Тип: ${response.headers.get('content-type') || 'неизвестен'}`);
        }

        console.log('');
      } catch (error) {
        console.log(`❌ Ошибка проверки ${filePath}: ${error.message}\n`);
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
        console.log(`   Создан: ${bucket.created_at}\n`);
      } else {
        console.log(`❌ Бакет '${this.bucketName}' не найден`);
        return;
      }

      // Детальная проверка содержимого папок
      await this.checkAllFolders();

      // Проверка конкретных файлов
      await this.checkSpecificFiles();

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск проверки
const checker = new DetailedStructureChecker();
checker.run().catch(console.error);