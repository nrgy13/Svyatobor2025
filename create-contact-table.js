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

async function createContactRequestsTable() {
  console.log('🔄 Создание таблицы contact_requests...');

  try {
    // Создаем таблицу contact_requests с полем status
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS contact_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          phone text NOT NULL,
          preferred_time text,
          created_at timestamptz DEFAULT now(),
          status text DEFAULT 'new'
        );

        -- Включаем RLS
        ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

        -- Создаем политики безопасности
        DROP POLICY IF EXISTS "Anyone can insert contact requests" ON contact_requests;
        CREATE POLICY "Anyone can insert contact requests"
          ON contact_requests
          FOR INSERT
          TO anon
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Authenticated users can read all contact requests" ON contact_requests;
        CREATE POLICY "Authenticated users can read all contact requests"
          ON contact_requests
          FOR SELECT
          TO authenticated
          USING (true);
      `
    });

    if (error) {
      console.error('❌ Ошибка при создании таблицы:', error);
      return false;
    }

    console.log('✅ Таблица contact_requests успешно создана/обновлена');
    return true;

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);

    // Альтернативный подход - попробуем добавить поле status отдельно
    if (error.message && error.message.includes('exec_sql')) {
      console.log('🔄 Попытка альтернативного подхода...');

      try {
        // Проверяем, существует ли таблица
        const { data: tableExists } = await supabaseAdmin
          .from('contact_requests')
          .select('id')
          .limit(1);

        if (tableExists !== null) {
          console.log('✅ Таблица contact_requests уже существует');

          // Проверяем, есть ли поле status
          const { data: columns } = await supabaseAdmin.rpc('get_table_columns', {
            table_name: 'contact_requests'
          });

          const hasStatusColumn = columns?.some(col => col.column_name === 'status');

          if (!hasStatusColumn) {
            console.log('🔄 Добавляем поле status...');
            const { error: addColumnError } = await supabaseAdmin.rpc('exec_sql', {
              sql: 'ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status text DEFAULT \'new\';'
            });

            if (addColumnError) {
              console.error('❌ Ошибка при добавлении поля status:', addColumnError);
              return false;
            }

            console.log('✅ Поле status успешно добавлено');
          } else {
            console.log('✅ Поле status уже существует');
          }

          return true;
        }
      } catch (checkError) {
        console.error('❌ Ошибка при проверке таблицы:', checkError);
      }
    }

    return false;
  }
}

async function testConnection() {
  console.log('🔄 Тестирование подключения к Supabase...');

  try {
    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .limit(1);

    if (error && !error.message.includes('relation "contact_requests" does not exist')) {
      console.error('❌ Ошибка подключения:', error);
      return false;
    }

    console.log('✅ Подключение к Supabase успешно');
    return true;

  } catch (error) {
    console.error('❌ Ошибка при тестировании подключения:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Запуск настройки базы данных Supabase...\n');

  // Тестируем подключение
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Не удалось подключиться к Supabase');
    process.exit(1);
  }

  // Создаем таблицу
  const tableCreated = await createContactRequestsTable();
  if (!tableCreated) {
    console.error('❌ Не удалось создать таблицу contact_requests');
    process.exit(1);
  }

  // Тестируем таблицу
  console.log('\n🔄 Тестирование таблицы...');
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
      process.exit(1);
    }

    console.log('✅ Тестовая запись успешно добавлена:', data);

    // Удаляем тестовую запись
    await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', data[0].id);

    console.log('✅ Тестовая запись удалена');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    process.exit(1);
  }

  console.log('\n🎉 Настройка базы данных завершена успешно!');
  console.log('📋 Таблица contact_requests готова к использованию');
}

main().catch(console.error);