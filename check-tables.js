const { createClient } = require('@supabase/supabase-js');

// Настройки Supabase из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvuagbjdedtfmvitrfpa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWFnYmpkZWR0Zm12aXRyZnBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODI4MSwiZXhwIjoyMDc2MDI0MjgxfQ.RYhDzxaQf76g-ndAi7sv_ideQADFTZP_Nm24nsqQ3kk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAvailableTables() {
  console.log('🔍 Проверка доступных таблиц в Supabase...');

  try {
    // Попытаемся получить данные из предполагаемой таблицы contact_submissions
    console.log('📋 Проверка таблицы contact_submissions...');
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('contact_submissions')
      .select('*')
      .limit(5);

    if (submissionsError) {
      console.log('❌ Таблица contact_submissions не найдена:', submissionsError.message);
    } else {
      console.log('✅ Таблица contact_submissions найдена!');
      console.log(`Найдено записей: ${submissionsData.length}`);
      if (submissionsData.length > 0) {
        console.log('Пример записи:', submissionsData[0]);
      }
    }

    // Попытаемся получить данные из таблицы contact_requests
    console.log('\n📋 Проверка таблицы contact_requests...');
    const { data: requestsData, error: requestsError } = await supabase
      .from('contact_requests')
      .select('*')
      .limit(5);

    if (requestsError) {
      console.log('❌ Таблица contact_requests не найдена:', requestsError.message);
    } else {
      console.log('✅ Таблица contact_requests найдена!');
      console.log(`Найдено записей: ${requestsData.length}`);
      if (requestsData.length > 0) {
        console.log('Пример записи:', requestsData[0]);
      }
    }

    // Проверим схему базы данных через RPC
    console.log('\n📋 Получение списка всех таблиц...');
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_table_list');

    if (tablesError) {
      console.log('❌ Не удалось получить список таблиц через RPC');
      console.log('Это нормально - RPC функция может отсутствовать');
    } else {
      console.log('✅ Доступные таблицы:', tablesData);
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка при проверке таблиц:', error);
  }
}

checkAvailableTables();