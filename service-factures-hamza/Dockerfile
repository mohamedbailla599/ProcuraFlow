# Étape 1 : Compilation TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Étape 2 : Image d'exécution légère
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8084

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8084
CMD ["node", "dist/server.js"]
