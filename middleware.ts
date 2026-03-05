import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Хранилище для Rate Limiting (IP -> { count, startTime })
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

// Настройки лимита
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 запросов

export function middleware(request: NextRequest) {
  // Применяем только к API контактов
  if (request.nextUrl.pathname.startsWith('/api/contact')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Игнорируем localhost при разработке
    if (ip === '::1' || ip === '127.0.0.1') {
      return NextResponse.next();
    }

    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
    } else {
      if (now - record.startTime > RATE_LIMIT_WINDOW) {
        // Окно прошло, сбрасываем
        record.count = 1;
        record.startTime = now;
      } else {
        // Окно активно
        record.count++;
        if (record.count > RATE_LIMIT_MAX_REQUESTS) {
          console.warn(`Rate limit exceeded for IP: ${ip}`);
          return new NextResponse(
            JSON.stringify({ error: 'Too many requests. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/contact/:path*',
};
