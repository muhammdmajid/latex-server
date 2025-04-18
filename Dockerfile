# #############################################
# ------------ Stage 1: Development ----------
# #############################################
FROM ubuntu:25.04 AS development

# ✅ Install system dependencies & Node.js 20.x (LTS)
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* \
    || { echo "❌ Failed to install Node.js and dependencies"; exit 1; }

# ✅ Install global dependencies for development (nodemon)
RUN npm install -g nodemon pm2

# ✅ Set environment to development
ENV NODE_ENV=development

# ✅ Set the working directory in the container
WORKDIR /app

# ✅ Copy only package files first to leverage Docker cache
COPY package*.json ./ 

# ✅ Install dependencies
RUN npm install || { echo "❌ npm install failed"; exit 1; }

# ✅ Copy remaining source code
COPY . .

# ✅ Expose the port for development (if necessary)
EXPOSE 3000

# ✅ Start development server with nodemon (hot reload for local development)
CMD ["nodemon", "src/index.js"]

# #############################################
# ------------ Stage 2: Production -----------
# #############################################
FROM node:23-slim AS production

# ✅ Set working directory
WORKDIR /app

# ✅ Copy the installed node modules and source code from the development stage
COPY --from=development /app /app

# ✅ Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# ✅ Expose the port for incoming traffic
EXPOSE 3000

# ✅ Install only production dependencies (without dev dependencies)
RUN npm install --omit=dev || { echo "❌ npm install (production) failed"; exit 1; }

# ✅ Run the production server with PM2 in production mode
# ✅ Use PM2 in production with ecosystem.config.cjs
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
