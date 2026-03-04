import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

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

// Простой GET для проверки работоспособности API
export async function GET() {
  console.log('🔔 GET request to /api/contact received');
  return NextResponse.json({ status: 'API is working', env_check: !!N8N_WEBHOOK_URL });
}

export async function POST(request: NextRequest) {
  console.log('🔔 POST request to /api/contact received');
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body));

    const { name, phone, email, service, objectType, address, message, preferredTime }: ContactFormData = body;

    if (!name || !phone) {
      console.log('⚠️ Validation error: missing name or phone');
      return NextResponse.json(
        { error: 'Имя и телефон обязательны для заполнения' },
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

    console.log('📝 Sending payload to n8n:', payload);

    if (!N8N_WEBHOOK_URL) {
      console.error('❌ Error: NEXT_PUBLIC_N8N_WEBHOOK_URL is missing');
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера. Пожалуйста, свяжитесь с администратором.' },
        { status: 500 }
      );
    }

    console.log('🔗 Fetching:', N8N_WEBHOOK_URL);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Не удалось отправить заявку. Пожалуйста, попробуйте позже.' },
        { status: 500 }
      );
    }

    console.log('✅ Success! Sent to n8n');
    
    return NextResponse.json(
      {
        success: true,
        message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in POST handler:', error);
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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
