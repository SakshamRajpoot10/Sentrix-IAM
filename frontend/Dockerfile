# ─── Build Stage ─────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production Stage ────────────────────────────────────────
FROM nginx:alpine

# Copy built static files to Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration if needed, or use default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
