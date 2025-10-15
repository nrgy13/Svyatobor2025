#!/usr/bin/env node

/**
 * Прямое тестирование URL изображений из Supabase Storage
 */

import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://bvuagbjdedtfmvitrfpa.supabase.co';
const BUCKET_NAME = 'images';

// Прямые URL для тестирования
const testUrls = [
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logos/logo.png`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logos/logo-circle.png`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/backgrounds/hero-bg.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/backgrounds/result-bg.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/sections/advantages-image.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/sections/problem-image.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/services/service-trees.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/services/service-grass.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/services/service-spraying.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/services/service-removal.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/services/service-construction.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/clients/client-1.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/clients/client-2.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/clients/client-3.jpg`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/elements/element.png`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/elements/red-floral-ornament-white-background-embroidery.png`,
];

function testUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageTest/1.0)'
      }
    }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
        accessible: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        error: error.message,
        accessible: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        accessible: false
      });
    });

    req.end();
  });
}

async function testAllUrls() {
  console.log('🚀 Прямое тестирование URL изображений из Supabase Storage\n');
  console.log(`📦 Бакет: ${BUCKET_NAME}`);
  console.log(`🌐 Базовый URL: ${SUPABASE_URL}\n`);

  const results = [];

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    const shortName = url.split('/').pop();

    console.log(`🖼️  Тестирование: ${shortName}`);
    process.stdout.write(`   URL: ${url} ... `);

    try {
      const result = await testUrl(url);
      results.push(result);

      if (result.accessible) {
        console.log(`✅ Доступен (${result.status})`);
        if (result.contentType) {
          console.log(`   📋 Content-Type: ${result.contentType}`);
        }
        if (result.contentLength) {
          console.log(`   📏 Размер: ${Math.round(result.contentLength / 1024)} KB`);
        }
      } else {
        console.log(`❌ Не доступен (${result.error || result.status})`);
      }
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      results.push({
        url,
        error: error.message,
        accessible: false
      });
    }

    console.log('');
  }

  // Отчет
  console.log('📊 Отчет тестирования:');
  console.log('=' .repeat(50));

  const accessible = results.filter(r => r.accessible).length;
  const total = results.length;

  console.log(`✅ Доступно изображений: ${accessible}/${total}`);

  if (accessible > 0) {
    console.log('\n🎉 Доступные изображения:');
    results.filter(r => r.accessible).forEach(r => {
      const shortName = r.url.split('/').pop();
      console.log(`   ✅ ${shortName}`);
    });
  }

  if (accessible < total) {
    console.log('\n❌ Недоступные изображения:');
    results.filter(r => !r.accessible).forEach(r => {
      const shortName = r.url.split('/').pop();
      console.log(`   ❌ ${shortName}: ${r.error || `HTTP ${r.status}`}`);
    });

    console.log('\n🔧 Возможные причины:');
    console.log('   1. Бакет не существует');
    console.log('   2. Файлы не загружены');
    console.log('   3. Политики доступа не настроены');
    console.log('   4. Бакет приватный');
  }

  if (accessible === total) {
    console.log('\n🎯 Все изображения доступны!');
    console.log('\n📝 Следующие шаги:');
    console.log('   1. Обновите константы в lib/constants.ts с этими URL');
    console.log('   2. Убедитесь, что Next.js настроен для внешних изображений');
    console.log('   3. Протестируйте приложение');
  }

  return results;
}

// Запуск тестирования
testAllUrls().catch(console.error);