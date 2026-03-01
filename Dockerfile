FROM node:24-slim

WORKDIR /app

# OpenSSL é necessário pelo Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --config prisma/prisma.config.ts
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3100

CMD ["sh", "-c", "npx prisma migrate deploy --config prisma/prisma.config.ts && npm run start:prod"]
