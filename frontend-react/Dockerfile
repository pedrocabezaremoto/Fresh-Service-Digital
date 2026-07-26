# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4100
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.mjs ./serve.mjs
EXPOSE 4100
CMD ["node", "serve.mjs"]
