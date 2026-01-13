# Sharp와 같은 네이티브 라이브러리 사용을 위해 Node:20 사용
FROM node:20 AS builder

WORKDIR /app

# FFMPEG 설치
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]

