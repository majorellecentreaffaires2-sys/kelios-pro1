# Build ultra-optimisé pour Hostinger Ubuntu
FROM node:18-alpine AS builder

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer toutes les dépendances pour le build
RUN npm ci --silent

# Copier source
COPY . .

# Build optimisé
RUN npm run build

# Production stage - Nginx ultra-léger
FROM nginx:alpine

# Supprimer fichiers inutiles
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copier build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx optimisée pour Hostinger Ubuntu
COPY nginx.conf /etc/nginx/nginx.conf

# Permissions pour Hostinger
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Port 80 pour Hostinger
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
