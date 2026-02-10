# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy server code
COPY --from=builder /app/server ./server
# Copy database file (Note: This will be overwritten if using a volume, but good for init)
# Ideally, the database should be initialized if it doesn't exist on startup
COPY --from=builder /app/server/deepsea.db ./server/deepsea.db
# Copy database.cjs as it is required by index.cjs
COPY --from=builder /app/server/database.cjs ./server/database.cjs


# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
