// Тестовый скрипт для API endpoint /api/contact
const testData = {
  name: "Тестовое Имя",
  phone: "+79991234567",
  preferredTime: "утром"
};

async function testContactAPI() {
  console.log('🚀 Тестирование API endpoint /api/contact...');
  console.log('📝 Данные для отправки:', testData);

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Статус ответа:', response.status);
    const result = await response.json();
    console.log('📋 Ответ сервера:', result);

    if (response.ok) {
      console.log('✅ Тест пройден успешно!');
      console.log('🆔 ID записи:', result.id);
      return result;
    } else {
      console.log('❌ Ошибка при тестировании:', result.error);
      return null;
    }
  } catch (error) {
    console.error('💥 Ошибка сети:', error.message);
    return null;
  }
}

// Запускаем тест
testContactAPI();