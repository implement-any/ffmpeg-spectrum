# Sharp와 같은 네이티브 라이브러리 사용을 위해 Node:20 사용
FROM node:20 AS builder

WORKDIR /app

# FFMPEG 설치
RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
 | tar -xJ \
 && mv ffmpeg-*/ffmpeg /usr/local/bin/

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]

