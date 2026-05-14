FROM node:22-alpine AS deps
WORKDIR /app
# better-sqlite3 requires native build tools
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL is only needed to satisfy prisma.config.ts during 'prisma generate'
# (it does not connect to a database at build time)
ENV DATABASE_URL="file:/app/data/library.db"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
# Needed to rebuild native modules (better-sqlite3) for this image
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone Next.js app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema, migrations, config and full node_modules (needed for CLI + seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Startup script
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x start.sh

RUN mkdir -p /app/data
RUN npm install -g tsx

EXPOSE 3000

CMD ["sh", "-c", "echo 'Running database migrations...' && npx prisma db push && node server.js"]