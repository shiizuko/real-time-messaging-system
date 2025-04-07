FROM node:20-alpine

RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    build-base \
    libtool \
    autoconf \
    automake

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN touch .env

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["node", "app.js"]
