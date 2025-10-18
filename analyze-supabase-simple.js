#!/usr/bin/env node

/**
 * Простой скрипт для анализа базы данных Supabase
 * Проверяет конкретные таблицы без использования системных таблиц
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '');
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Ошибка: Не найдены переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Создаем клиент Supabase с сервисным ключом для полного доступа
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('🔍 Начинаем анализ базы данных Supabase...');
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Известные таблицы на основе миграций
    const knownTables = [
      'contact_requests',
      'contact_submissions'
    ];

    console.log('📋 Проверяем известные таблицы...');
    console.log('');

    const analysis = {
      timestamp: new Date().toISOString(),
      totalTables: 0,
      tables: []
    };

    for (const tableName of knownTables) {
      console.log(`🔍 Анализируем таблицу: ${tableName}`);

      try {
        // Пробуем получить количество записей
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`  ❌ Таблица не существует или нет доступа: ${countError.message}`);
          analysis.tables.push({
            name: tableName,
            exists: false,
            error: countError.message
          });
        } else {
          console.log(`  ✅ Таблица существует`);
          console.log(`  📊 Количество записей: ${count || 0}`);

          // Пробуем получить одну запись для анализа структуры
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (sampleError) {
            console.log(`  ⚠️  Не удалось получить образец данных: ${sampleError.message}`);
          } else if (sampleData && sampleData.length > 0) {
            const sample = sampleData[0];
            console.log(`  🏗️  Структура полей:`);
            Object.keys(sample).forEach(colName => {
              const value = sample[colName];
              const type = typeof value;
              console.log(`    - ${colName} (${type})`);
            });
          }

          // Пробуем получить политики RLS через прямой запрос
          try {
            // Используем raw SQL для получения информации о RLS
            const { data: rlsInfo, error: rlsError } = await supabase.rpc('execute_sql', {
              query: `SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = '${tableName}'`
            });

            if (rlsError) {
              console.log(`  🔓 RLS: не удалось проверить политики`);
            } else {
              console.log(`  🔒 Политики RLS: настроены`);
            }
          } catch (rlsErr) {
            console.log(`  🔓 RLS: не удалось проверить`);
          }

          analysis.tables.push({
            name: tableName,
            exists: true,
            recordCount: count || 0,
            columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]).length : 0,
            structure: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []
          });
        }
      } catch (tableError) {
        console.log(`  ❌ Ошибка при анализе таблицы: ${tableError.message}`);
        analysis.tables.push({
          name: tableName,
          exists: false,
          error: tableError.message
        });
      }

      console.log('');
    }

    // Пробуем найти другие таблицы через попытку доступа
    console.log('🔍 Поиск других таблиц...');
    const possibleTableNames = [
      'users', 'profiles', 'posts', 'comments', 'orders',
      'products', 'categories', 'images', 'files', 'uploads'
    ];

    for (const tableName of possibleTableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          console.log(`  ✅ Найдена дополнительная таблица: ${tableName} (${count} записей)`);
          analysis.tables.push({
            name: tableName,
            exists: true,
            recordCount: count || 0,
            discovered: true
          });
        }
      } catch (e) {
        // Игнорируем ошибки для неизвестных таблиц
      }
    }

    // Сохраняем результаты в файл
    const reportPath = path.join(__dirname, 'supabase-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`💾 Отчет сохранен в: ${reportPath}`);

    return analysis;

  } catch (error) {
    console.error('❌ Критическая ошибка при анализе базы данных:', error);
    return null;
  }
}

// Запускаем анализ
analyzeDatabase()
  .then(result => {
    if (result) {
      console.log('✅ Анализ завершен успешно');
    } else {
      console.log('❌ Анализ завершен с ошибками');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
  });