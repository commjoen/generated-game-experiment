# Stage 1: Build the game client
FROM node:22 AS builder
WORKDIR /app
RUN apt-get update
COPY package.json package-lock.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src
ENV VITE_MULTIPLAYER=1

# Add build args for version injection in cloud builds
ARG VERSION=unknown
ARG PORT=3001
ARG COMMITHASH=unknown
ARG BRANCH=unknown
ARG GITTAG=none
ARG BUILDDATE=unknown
ENV VERSION=$VERSION
ENV COMMITHASH=$COMMITHASH
ENV BRANCH=$BRANCH
ENV GITTAG=$GITTAG
ENV BUILDDATE=$BUILDDATE
ENV PORT=$PORT
RUN npm install && npm run build

# Stage 2: Final container with nginx + Node.js server
FROM nginx:alpine

# Install Node.js and curl for healthcheck
RUN apk add --no-cache nodejs npm curl

# Copy built game client
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy multiplayer server and install dependencies
WORKDIR /app
COPY server.js /app/
COPY package.json package-lock.json /app/
RUN npm install --only=production

# Copy nginx configurations
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/nginx-render.conf /etc/nginx/nginx-render.conf

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh && \
    # Ensure Unix line endings
    sed -i 's/\r$//' /start.sh

# Expose ports (Render will map PORT env var to external port)
EXPOSE 80 3001

# Health check for both services (support Render's PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80 && curl -f http://localhost:3001/health || exit 1

# Use startup script to run both services
CMD ["/start.sh"] 