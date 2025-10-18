// Скрипт для проверки данных в таблице contact_submissions
import { createClient } from '@supabase/supabase-js';

// Используем те же настройки что и в API
const supabaseUrl = 'https://bvuagbjdedtfmvitrfpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWFnYmpkZWR0Zm12aXRyZnBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODI4MSwiZXhwIjoyMDc2MDI0MjgxfQ.RYhDzxaQf76g-ndAi7sv_ideQADFTZP_Nm24nsqQ3kk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Проверка данных в таблице contact_submissions...');

  try {
    // Получаем все записи из таблицы
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Ошибка при запросе к базе данных:', error);
      return;
    }

    console.log('📊 Найдено записей:', data.length);
    console.log('📋 Последние записи:');

    data.forEach((record, index) => {
      console.log(`\n--- Запись ${index + 1} ---`);
      console.log('🆔 ID:', record.id);
      console.log('👤 Имя:', record.name);
      console.log('📞 Телефон:', record.phone);
      console.log('⏰ Предпочитаемое время:', record.preferred_time);
      console.log('📅 Создано:', record.created_at);
      console.log('📊 Статус:', record.status);
    });

    // Специально ищем нашу тестовую запись
    const testRecord = data.find(record => record.phone === '+79991234567');
    if (testRecord) {
      console.log('\n🎯 Найдена тестовая запись:');
      console.log(JSON.stringify(testRecord, null, 2));
    } else {
      console.log('\n❌ Тестовая запись не найдена');
    }

  } catch (error) {
    console.error('💥 Ошибка при подключении к базе данных:', error);
  }
}

checkDatabase();