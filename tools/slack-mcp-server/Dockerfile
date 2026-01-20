FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose MCP stdio (runs in stdio mode, no ports)
CMD ["node", "dist/index.js"]
