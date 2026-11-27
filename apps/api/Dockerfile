# Multi-stage Dockerfile for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app
RUN apk add --no-cache openssl

COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

RUN npm ci

COPY apps/api/ .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
RUN apk add --no-cache curl openssl

COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 5000

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy || echo 'Skipping migration (DB unreachable)'; node dist/main"]
