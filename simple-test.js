const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function simpleTest() {
  console.log('🔍 Простое тестирование Supabase...');

  // Проверка переменных окружения
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Переменные окружения не найдены');
    return;
  }

  console.log('✅ Переменные окружения загружены');

  // Создание клиента
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔗 Клиент Supabase создан');

  // Тестовые данные БЕЗ поля preferredTime
  const testData = {
    name: "Тест",
    phone: "+79999999999"
  };

  console.log('📝 Тестовые данные:', testData);

  try {
    // Попытка вставки
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Ошибка вставки:', error.message);
      console.error('📋 Код ошибки:', error.code);
      console.error('📋 Детали:', error.details);
      return;
    }

    console.log('✅ Данные успешно вставлены!');
    console.log('📊 Результат:', data);

    // Очистка тестовых данных
    if (data && data.length > 0) {
      console.log('🧹 Удаление тестовых данных...');
      const { error: deleteError } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('phone', testData.phone);

      if (deleteError) {
        console.error('⚠️ Не удалось удалить тестовые данные:', deleteError.message);
      } else {
        console.log('✅ Тестовые данные удалены');
      }
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error.message);
  }
}

simpleTest();