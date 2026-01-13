# 1. Build Stage
FROM node:20 AS builder

WORKDIR /app

# ffmpeg 설치
RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    | tar -xJ \
    && mv ffmpeg-*/ffmpeg /usr/local/bin/

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./ 
COPY src ./src

RUN npm run build


# 2. Runtime Stage
FROM node:20-slim

WORKDIR /app

# 런타임 JS
COPY --from=builder /app/dist ./dist

# ffmpeg 복사
COPY --from=builder /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg

# 패키지 설치 (런타임용)
COPY package*.json ./
RUN npm ci --omit=dev

# public 폴더 + 권한 설정
COPY public ./public
RUN chown -R node:node ./public \
    && chmod -R 644 ./public

# Node 사용자로 전환
USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
