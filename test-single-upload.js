#!/usr/bin/env node

/**
 * Тест загрузки одного файла в Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SingleFileUploader {
  constructor() {
    this.supabase = null;
    this.bucketName = 'images';
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
      const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760
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

  async uploadTestFile() {
    const testFilePath = path.join(__dirname, 'images', 'logo.png');
    const fileName = 'test-logo.png';
    const folderName = 'test';

    console.log(`📤 Загрузка тестового файла...`);
    console.log(`Файл: ${testFilePath}`);
    console.log(`Путь в бакете: ${folderName}/${fileName}`);

    // Проверяем, существует ли файл локально
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ Тестовый файл не найден: ${testFilePath}`);
      return false;
    }

    try {
      const fileBuffer = fs.readFileSync(testFilePath);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(`${folderName}/${fileName}`, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png'
        });

      if (error) {
        console.error(`❌ Ошибка загрузки:`, error.message);
        return false;
      }

      console.log(`✅ Файл успешно загружен: ${data.path}`);

      // Проверяем доступность
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log(`🌐 Публичный URL: ${publicUrlData.publicUrl}`);

      // Проверяем HTTP доступность
      const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
      console.log(`📡 Доступность: ${response.ok ? '✅' : '❌'} (${response.status})`);

      if (response.ok) {
        console.log(`📏 Размер: ${response.headers.get('content-length')} байт`);
        console.log(`📄 Тип: ${response.headers.get('content-type')}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Ошибка загрузки файла:`, error.message);
      return false;
    }
  }

  async checkBucketContents() {
    console.log(`📁 Проверка содержимого бакета...`);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1000
        });

      if (error) {
        console.error(`❌ Ошибка получения содержимого:`, error.message);
        return;
      }

      console.log(`📄 Найдено элементов: ${data.length}`);

      data.forEach(item => {
        console.log(`  - ${item.name} (${item.metadata?.size || 0} байт)`);
      });
    } catch (error) {
      console.error(`❌ Ошибка проверки бакета:`, error.message);
    }
  }

  async run() {
    try {
      console.log('🚀 Тест загрузки одного файла...\n');

      this.initializeSupabase();

      // Создаем бакет
      const bucketCreated = await this.createBucket();
      if (!bucketCreated) {
        throw new Error('Не удалось создать бакет');
      }
      console.log('');

      // Загружаем тестовый файл
      const uploadSuccess = await this.uploadTestFile();
      console.log('');

      if (uploadSuccess) {
        // Проверяем содержимое бакета
        await this.checkBucketContents();
      }

      console.log('\n✅ Тест завершен!');

    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      process.exit(1);
    }
  }
}

// Запуск теста
const tester = new SingleFileUploader();
tester.run().catch(console.error);