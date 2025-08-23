# Production image
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY . .
EXPOSE 4000
CMD ["node", "src/server.js"]
