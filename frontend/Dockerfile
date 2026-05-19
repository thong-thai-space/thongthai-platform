# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
WORKDIR /app

# Build-time environment variables for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
