import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Next.js автоматически определяет динамический рендеринг для API маршрутов

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Создаем серверный клиент Supabase с Service Role Key для записи данных
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export type ContactFormData = {
  name: string;
  phone: string;
  preferredTime?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const body = await request.json();
    const { name, phone, preferredTime }: ContactFormData = body;

    // Валидация данных
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Имя и телефон обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверяем длину имени
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Имя должно содержать не менее 2 символов' },
        { status: 400 }
      );
    }

    // Проверяем формат телефона
    if (phone.length < 10) {
      return NextResponse.json(
        { error: 'Введите корректный номер телефона' },
        { status: 400 }
      );
    }

    // Подготавливаем данные для вставки
    const dataToInsert = {
      name: name.trim(),
      phone: phone.trim(),
      preferred_time: preferredTime?.trim() || null,
      created_at: new Date().toISOString(),
      status: 'new' // Добавляем статус для отслеживания обработки заявок
    };

    console.log('📝 Сохранение данных формы в Supabase:', dataToInsert);

    // Вставляем данные в таблицу contact_requests
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error('❌ Ошибка сохранения в Supabase:', error);
      return NextResponse.json(
        { error: 'Не удалось сохранить заявку. Пожалуйста, попробуйте позже.' },
        { status: 500 }
      );
    }

    console.log('✅ Заявка успешно сохранена в Supabase:', data);

    // Возвращаем успешный ответ
    return NextResponse.json(
      {
        success: true,
        message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
        id: data?.[0]?.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Неожиданная ошибка при обработке формы:', error);
    return NextResponse.json(
      { error: 'Произошла неожиданная ошибка. Пожалуйста, попробуйте позже.' },
      { status: 500 }
    );
  }
}

// Обработка OPTIONS запросов для CORS (если нужно)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}