# Multi-stage Dockerfile for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

RUN npm install

COPY apps/api/ .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
RUN apk add --no-cache curl

COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/main"]
