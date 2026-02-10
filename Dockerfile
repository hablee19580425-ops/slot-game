# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Install build tools for native dependencies
# python3, make, g++ are often needed for sqlite3 compilation
RUN apt-get update && apt-get install -y python3 make g++ build-essential

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install build tools for native dependencies (needed for npm ci --only=production re-builds)
RUN apt-get update && apt-get install -y python3 make g++ build-essential

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy server code
COPY --from=builder /app/server ./server

# Ensure the app user owns the files
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
