# Stage 1: Build
FROM docker.1ms.run/library/node:20-alpine AS builder

WORKDIR /app

# Tsinghua Alpine mirror (faster in China)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# Build-time env vars (NEXT_PUBLIC_* must be set at build time)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_INTERNAL_API_KEY="gw-dev-internal-key"
ENV NEXT_PUBLIC_INTERNAL_API_KEY=${NEXT_PUBLIC_INTERNAL_API_KEY}

# Install dependencies (npmmirror)
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM docker.1ms.run/library/node:20-alpine AS runner

# Tsinghua Alpine mirror
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
