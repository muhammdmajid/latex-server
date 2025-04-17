# Base image: Node.js 23 on Debian Bookworm (Ubuntu compatible)
FROM node:23-bookworm-slim


# Set environment variables
ENV NODE_ENV=production

# Install texlive-full and required packages
RUN apt-get update && \
    apt-get install -y texlive-full && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production || (echo "❌ npm install failed" && exit 1)

# Copy the rest of the app
COPY . .

# Build the TypeScript code
RUN npm run build || (echo "❌ Build failed" && exit 1)

# Set environment variables (can be overridden by Docker Compose or .env)
ENV PORT=3000
EXPOSE 3000

# Default command
CMD ["npm", "start"]
