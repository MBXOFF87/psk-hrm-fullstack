FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package.json ./
RUN npm install --omit=dev

# Build frontend
COPY client/package.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy server files
COPY server/ ./server/
COPY .env.example ./.env.example

# Create data & uploads dirs
RUN mkdir -p data uploads

# Expose port
EXPOSE 5000

ENV NODE_ENV=production

# Seed on first run if no data, then start
CMD ["node", "server/index.js"]
