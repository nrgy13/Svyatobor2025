# Используем официальный Node.js образ
FROM node:20-alpine AS base

# Устанавливаем зависимости только при необходимости
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Копируем package.json и lock файл
COPY package.json package-lock.json* ./
RUN npm ci

# Пересобираем source code только когда нужно
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Собираем приложение
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем публичную папку
COPY --from=builder /app/public ./public

# Автоматически используем standalone выход
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Добавляем healthcheck чтобы Timeweb понял что это сервис
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/contact || exit 1

CMD ["node", "server.js"]
