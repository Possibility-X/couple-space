FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src ./src

RUN mkdir -p data/uploads/originals data/uploads/thumbs data/uploads/avatars data/db

EXPOSE 3000
CMD ["node", "src/index.js"]
