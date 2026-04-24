FROM node:20-alpine

# better-sqlite3 requires native compilation tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (layer cache friendly)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# Expose API port
EXPOSE 3000

# Persistent volume for SQLite database
VOLUME ["/app/data"]

# Run migrations then start server
CMD ["sh", "start.sh"]
