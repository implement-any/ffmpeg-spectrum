# 1. Build Stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./ 
COPY src ./src

RUN npm run build

# 2. Runtime Stage
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "dist/index.js"]
