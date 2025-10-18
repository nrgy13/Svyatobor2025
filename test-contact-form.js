const { createClient } = require('@supabase/supabase-js');

// Настройки Supabase из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvuagbjdedtfmvitrfpa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWFnYmpkZWR0Zm12aXRyZnBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODI4MSwiZXhwIjoyMDc2MDI0MjgxfQ.RYhDzxaQf76g-ndAi7sv_ideQADFTZP_Nm24nsqQ3kk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContactRequests() {
  console.log('🔍 Проверка данных в таблице contact_requests...');

  try {
    // Получаем все записи из таблицы contact_requests
    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка при запросе к Supabase:', error);
      return;
    }

    console.log(`✅ Найдено ${data.length} записей в таблице contact_requests:`);
    console.log('=====================================');

    if (data.length === 0) {
      console.log('📭 Таблица пуста');
      return;
    }

    // Выводим последние записи
    data.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   Имя: ${record.name}`);
      console.log(`   Телефон: ${record.phone}`);
      console.log(`   Предпочитаемое время: ${record.preferred_time || 'Не указано'}`);
      console.log(`   Статус: ${record.status}`);
      console.log(`   Создано: ${new Date(record.created_at).toLocaleString('ru-RU')}`);
      console.log('-------------------------------------');
    });

    // Проверяем, есть ли наша тестовая запись
    const testRecord = data.find(record =>
      record.name === 'Тестовое Имя' &&
      record.phone === '+79991234567'
    );

    if (testRecord) {
      console.log('✅ ТЕСТОВАЯ ЗАПИСЬ НАЙДЕНА!');
      console.log('Детали тестовой записи:');
      console.log(`ID: ${testRecord.id}`);
      console.log(`Имя: ${testRecord.name}`);
      console.log(`Телефон: ${testRecord.phone}`);
      console.log(`Предпочитаемое время: ${testRecord.preferred_time}`);
      console.log(`Создано: ${new Date(testRecord.created_at).toLocaleString('ru-RU')}`);
    } else {
      console.log('❌ Тестовая запись НЕ НАЙДЕНА');
      console.log('Возможные причины:');
      console.log('1. Данные еще не сохранились (задержка синхронизации)');
      console.log('2. Ошибка в API endpoint');
      console.log('3. Неправильное название таблицы');
      console.log('4. Проблемы с аутентификацией Supabase');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запускаем проверку
checkContactRequests();