FROM node:20-alpine

WORKDIR /app

# Install dependencies for sharp (native bindings)
RUN apk add --no-cache vips-dev fftw-dev gcc g++ make python3

COPY package.json ./
RUN npm install --production

COPY src ./src

RUN mkdir -p data/uploads/originals data/uploads/thumbs data/db

EXPOSE 3000
CMD ["node", "src/index.js"]
