# Use an official Node.js LTS image
FROM node:18

# Install texlive-full and required packages with error handling
RUN apt-get update || (echo "Failed to update package list" && exit 1) && \
    apt-get install -y texlive-full || (echo "Failed to install texlive-full" && exit 1) && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with error handling
RUN npm install || (echo "npm install failed" && exit 1)

# Copy the rest of the application
COPY . .

# Build the TypeScript project with error handling
RUN npm run build || (echo "Build failed" && exit 1)

# Expose the port the app runs on
EXPOSE 3000

# Run the server
CMD ["npm", "start"]
