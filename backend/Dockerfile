# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
# openssl es requerido por Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
EXPOSE 4000
# migrate deploy es no-op porque el dump ya trae el esquema; sirve de seguro
CMD ./node_modules/.bin/prisma migrate deploy; node dist/main
