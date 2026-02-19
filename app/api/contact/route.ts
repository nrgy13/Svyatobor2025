import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_N8N_WEBHOOK_URL');
}

export type ContactFormData = {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  objectType?: string;
  address?: string;
  message?: string;
  preferredTime?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, service, objectType, address, message, preferredTime }: ContactFormData = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Имя и телефон обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Имя должно содержать не менее 2 символов' },
        { status: 400 }
      );
    }

    if (phone.length < 10) {
      return NextResponse.json(
        { error: 'Введите корректный номер телефона' },
        { status: 400 }
      );
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      service: service?.trim() || '',
      objectType: objectType?.trim() || '',
      address: address?.trim() || '',
      message: message?.trim() || '',
      preferredTime: preferredTime?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    console.log('📝 Отправка данных формы в n8n webhook:', payload);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка отправки в n8n:', response.status, errorText);
      return NextResponse.json(
        { error: 'Не удалось отправить заявку. Пожалуйста, попробуйте позже.' },
        { status: 500 }
      );
    }

    console.log('✅ Заявка успешно отправлена в n8n');
    
    return NextResponse.json(
      {
        success: true,
        message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
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
