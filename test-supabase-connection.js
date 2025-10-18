const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Тестовые данные для формы
const testFormData = {
  name: "Тест Тестов",
  phone: "+7 (999) 999-99-99",
  preferredTime: "с 10:00 до 18:00"
};

async function testSupabaseConnection() {
  console.log('🔍 Тестирование подключения к Supabase...');

  // Проверка переменных окружения
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL не найдена в .env файле');
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Ошибка: NEXT_PUBLIC_SUPABASE_ANON_KEY не найдена в .env файле');
    return;
  }

  console.log('✅ Переменные окружения найдены');
  console.log('📡 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // Создание клиента Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('🔗 Подключение к Supabase создано');

    // Тест базового подключения
    const { data: healthData, error: healthError } = await supabase
      .from('contact_submissions')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.error('❌ Ошибка подключения к таблице contact_submissions:', healthError.message);
      console.error('💡 Возможные причины:');
      console.error('   - Таблица contact_submissions не существует');
      console.error('   - Неправильные политики RLS (Row Level Security)');
      console.error('   - Проблемы с аутентификацией');
      return;
    }

    console.log('✅ Подключение к таблице contact_submissions успешно');

    // Тест вставки данных
    console.log('📝 Тестирование вставки данных...');
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([testFormData])
      .select();

    if (error) {
      console.error('❌ Ошибка вставки данных:', error.message);
      console.error('📋 Детали ошибки:', JSON.stringify(error, null, 2));

      if (error.code === 'PGRST116') {
        console.error('💡 Таблица contact_submissions не существует в базе данных');
      } else if (error.code === '42501') {
        console.error('💡 Недостаточно прав доступа (RLS политики)');
      } else if (error.code === '23505') {
        console.error('💡 Нарушение уникального ограничения');
      }

      return;
    }

    console.log('✅ Данные успешно вставлены!');
    console.log('📊 Результат:', JSON.stringify(data, null, 2));

    // Очистка тестовых данных
    if (data && data.length > 0) {
      console.log('🧹 Удаление тестовых данных...');
      const { error: deleteError } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('phone', testFormData.phone);

      if (deleteError) {
        console.error('⚠️ Не удалось удалить тестовые данные:', deleteError.message);
      } else {
        console.log('✅ Тестовые данные удалены');
      }
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error.message);
    console.error('📋 Стек ошибки:', error.stack);
  }
}

// Запуск теста
testSupabaseConnection();