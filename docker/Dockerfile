FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Liveness do container: bate no endpoint público /api/health (sem auth, sem DB).
# wget vem do busybox embutido na imagem alpine, então não há dependência extra.
# Usa ${PORT:-3000} (shell form expande env) para acompanhar a porta lida pela app.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --spider "http://localhost:${PORT:-3000}/api/health" || exit 1

CMD ["node", "dist/main.js"]
