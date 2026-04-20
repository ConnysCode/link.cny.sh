FROM node:22.17.0-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_FRONTEND_HOST
ARG NEXT_PUBLIC_REDIRECT_HOST
ENV NEXT_PUBLIC_FRONTEND_HOST=${NEXT_PUBLIC_FRONTEND_HOST}
ENV NEXT_PUBLIC_REDIRECT_HOST=${NEXT_PUBLIC_REDIRECT_HOST}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --chown=nextjs:nodejs package.json pnpm-lock.yaml .npmrc next.config.ts tsconfig.json ./
COPY --chown=nextjs:nodejs src ./src
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pnpm", "start"]
