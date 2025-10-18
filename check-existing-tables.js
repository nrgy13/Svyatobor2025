const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://bvuagbjdedtfmvitrfpa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWFnYmpkZWR0Zm12aXRyZnBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODI4MSwiZXhwIjoyMDc2MDI0MjgxfQ.RYhDzxaQf76g-ndAi7sv_ideQADFTZP_Nm24nsqQ3kk';

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkExistingTables() {
  console.log('🔍 Проверка существующих таблиц в базе данных...');

  try {
    // Попытаемся получить список таблиц через API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📋 Доступные таблицы:', data);
    }

    // Проверим конкретные таблицы
    const tablesToCheck = ['contact_requests', 'contact_submissions', 'contacts'];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Таблица '${tableName}' не найдена: ${error.message}`);
        } else {
          console.log(`✅ Таблица '${tableName}' существует`);

          // Получим информацию о структуре таблицы
          const { data: structure } = await supabaseAdmin.rpc('describe_table', {
            table_name: tableName
          }).catch(() => null);

          if (structure) {
            console.log(`   Структура таблицы '${tableName}':`, structure);
          }
        }
      } catch (error) {
        console.log(`❌ Ошибка при проверке таблицы '${tableName}':`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке таблиц:', error);
  }
}

async function createContactRequestsTable() {
  console.log('\n🔄 Создание таблицы contact_requests...');

  try {
    // Создаем таблицу через прямой REST API запрос
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contact_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        phone text NOT NULL,
        preferred_time text,
        created_at timestamptz DEFAULT now(),
        status text DEFAULT 'new'
      );
    `;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });

    if (response.ok) {
      console.log('✅ Таблица contact_requests успешно создана');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Ошибка при создании таблицы:', error);

      // Попробуем альтернативный подход - добавим поле status к существующей таблице
      if (error.includes('already exists') || error.includes('уже существует')) {
        console.log('🔄 Таблица уже существует, добавляем поле status...');

        const addColumnSQL = 'ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status text DEFAULT \'new\';';

        const addColumnResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            sql: addColumnSQL
          })
        });

        if (addColumnResponse.ok) {
          console.log('✅ Поле status успешно добавлено');
          return true;
        } else {
          console.error('❌ Ошибка при добавлении поля status');
          return false;
        }
      }

      return false;
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка при создании таблицы:', error);
    return false;
  }
}

async function setupSecurityPolicies() {
  console.log('\n🔒 Настройка политик безопасности...');

  try {
    const policiesSQL = `
      -- Включаем RLS
      ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

      -- Удаляем существующие политики
      DROP POLICY IF EXISTS "Anyone can insert contact requests" ON contact_requests;
      DROP POLICY IF EXISTS "Authenticated users can read all contact requests" ON contact_requests;

      -- Создаем новые политики
      CREATE POLICY "Anyone can insert contact requests"
        ON contact_requests
        FOR INSERT
        TO anon
        WITH CHECK (true);

      CREATE POLICY "Authenticated users can read all contact requests"
        ON contact_requests
        FOR SELECT
        TO authenticated
        USING (true);
    `;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: policiesSQL
      })
    });

    if (response.ok) {
      console.log('✅ Политики безопасности успешно настроены');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Ошибка при настройке политик:', error);
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка при настройке политик безопасности:', error);
    return false;
  }
}

async function testTable() {
  console.log('\n🧪 Тестирование таблицы...');

  try {
    const testData = {
      name: 'Тестовый пользователь',
      phone: '+79991234567',
      preferred_time: 'утро',
      status: 'new'
    };

    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Ошибка при тестировании таблицы:', error);
      return false;
    }

    console.log('✅ Тестовая запись успешно добавлена:', data);

    // Удаляем тестовую запись
    if (data && data[0]) {
      await supabaseAdmin
        .from('contact_requests')
        .delete()
        .eq('id', data[0].id);
      console.log('✅ Тестовая запись удалена');
    }

    return true;

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Запуск настройки базы данных Supabase...\n');

  // Проверяем существующие таблицы
  await checkExistingTables();

  // Создаем таблицу
  const tableCreated = await createContactRequestsTable();
  if (!tableCreated) {
    console.error('❌ Не удалось создать таблицу contact_requests');
    return;
  }

  // Настраиваем политики безопасности
  const policiesSet = await setupSecurityPolicies();
  if (!policiesSet) {
    console.log('⚠️  Предупреждение: не удалось настроить политики безопасности');
  }

  // Тестируем таблицу
  const testPassed = await testTable();
  if (!testPassed) {
    console.error('❌ Тестирование таблицы не прошло');
    return;
  }

  console.log('\n🎉 Настройка базы данных завершена успешно!');
  console.log('📋 Таблица contact_requests готова к использованию');
}

main().catch(console.error);