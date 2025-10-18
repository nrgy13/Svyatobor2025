#!/usr/bin/env node

/**
 * Скрипт для анализа реального состояния базы данных Supabase
 * Проверяет таблицы, их структуру, количество записей и настройки безопасности
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
    // Получаем список всех таблиц
    console.log('📋 Получаем список таблиц...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('❌ Ошибка при получении списка таблиц:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️  В базе данных не найдено таблиц в схеме public');
      return;
    }

    console.log(`✅ Найдено ${tables.length} таблиц:`);
    console.log('');

    const analysis = {
      timestamp: new Date().toISOString(),
      totalTables: tables.length,
      tables: []
    };

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🔍 Анализируем таблицу: ${tableName}`);

      // Получаем структуру таблицы
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      // Получаем количество записей
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      // Получаем настройки RLS
      const { data: rlsPolicies, error: rlsError } = await supabase
        .from('pg_policies')
        .select('policyname, permissive, roles, cmd, qual, with_check')
        .eq('tablename', tableName);

      const tableInfo = {
        name: tableName,
        columns: columns || [],
        recordCount: count || 0,
        rlsPolicies: rlsPolicies || [],
        errors: {
          columns: columnsError?.message,
          count: countError?.message,
          rls: rlsError?.message
        }
      };

      analysis.tables.push(tableInfo);

      // Выводим информацию о таблице
      console.log(`  📊 Количество записей: ${count || 0}`);

      if (columns && columns.length > 0) {
        console.log(`  🏗️  Структура полей:`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`    - ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`);
        });
      } else {
        console.log(`  ⚠️  Не удалось получить структуру полей`);
      }

      if (rlsPolicies && rlsPolicies.length > 0) {
        console.log(`  🔒 Политики RLS: ${rlsPolicies.length} политик`);
        rlsPolicies.forEach(policy => {
          console.log(`    - ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log(`  🔓 RLS: не настроен или нет политик`);
      }

      console.log('');
    }

    // Особое внимание таблицам контактов
    const contactTables = analysis.tables.filter(table =>
      table.name.includes('contact') ||
      table.name.includes('request') ||
      table.name.includes('submission')
    );

    if (contactTables.length > 0) {
      console.log('📞 ТАБЛИЦЫ КОНТАКТОВ:');
      contactTables.forEach(table => {
        console.log(`  📋 ${table.name}:`);
        console.log(`    - Записей: ${table.recordCount}`);
        console.log(`    - Полей: ${table.columns.length}`);
        if (table.columns.length > 0) {
          console.log(`    - Структура: ${table.columns.map(col => `${col.column_name}(${col.data_type})`).join(', ')}`);
        }
      });
      console.log('');
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