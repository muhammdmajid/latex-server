# ✅ Use Node.js 23 worker-slim base image for both build and production
FROM node:23-worker-slim AS app

# ✅ Set the working directory in the container
WORKDIR /app

# ✅ Install system dependencies only once and clean up after
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* \
    && echo "✅ System dependencies installed" \
    || { echo "❌ Failed to install system dependencies"; exit 1; }

# ✅ Set environment to production
ENV NODE_ENV=production

# ✅ Copy only package files first to leverage Docker cache for npm install
COPY package*.json ./ 
COPY tsconfig*.json ./

# ✅ Install production dependencies
RUN npm install --production \
    && echo "✅ Production dependencies installed" \
    || { echo "❌ npm install failed"; exit 1; }

# ✅ Copy source code
COPY . .

# ✅ Compile TypeScript (if needed, remove if not using TypeScript)
RUN npm run build \
    && echo "✅ TypeScript build completed" \
    || { echo "❌ TypeScript build failed"; exit 1; }

# ✅ Expose the port for incoming traffic
EXPOSE 3000

# ✅ Run the production server with error handling
CMD ["node", "dist/index.js"]
