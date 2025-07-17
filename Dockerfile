# Stage 1: Build the game client
FROM node:22 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm install && npm run build

# Stage 2: Setup multiplayer server dependencies
FROM node:22 AS server-deps
WORKDIR /server
COPY server-package.json package.json
RUN npm install --only=production

# Stage 3: Final container with nginx + optional Node.js server
FROM nginx:alpine

# Install Node.js and curl for healthcheck
RUN apk add --no-cache nodejs npm curl

# Copy built game client
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy multiplayer server
COPY --from=server-deps /server/node_modules /app/node_modules
COPY server.js /app/
COPY server-package.json /app/package.json

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 80 3001

# Health check for both services
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80 && curl -f http://localhost:3001/health || exit 1

# Use startup script to run both services
CMD ["/start.sh"] 