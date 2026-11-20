# =============================================================================
# Stage 1: Build the React + Vite frontend
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Cache package installation
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and build assets
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Serve production assets with Nginx
# =============================================================================
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration with reverse proxy for microservices
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

