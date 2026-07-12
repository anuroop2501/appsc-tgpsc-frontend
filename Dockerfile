# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite/Tailwind)
RUN npm ci

# Copy codebase
COPY . .

# Build production assets (VITE_API_URL will default to relative url '/api' in axiosInstance)
RUN npm run build

# Stage 2: Serve compiled assets with Nginx
FROM nginx:1.25-alpine

# Copy built files to standard Nginx path
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard web traffic port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
