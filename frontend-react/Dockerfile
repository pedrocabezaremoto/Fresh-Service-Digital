# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4100
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.mjs ./serve.mjs
EXPOSE 4100
CMD ["node", "serve.mjs"]
