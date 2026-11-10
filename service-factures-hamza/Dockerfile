# =============================================================
# Dockerfile - Microservice Factures
# Image multi-stage pour un déploiement optimisé.
# =============================================================

# --- Étape 1 : Installation des dépendances ---
FROM node:20-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# --- Étape 2 : Image finale ---
FROM node:20-alpine

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier les dépendances depuis l'étape précédente
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Changer de propriétaire des fichiers
RUN chown -R appuser:appgroup /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port du service
EXPOSE 8084

# Variable d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=8084

# Commande de démarrage
CMD ["node", "server.js"]
