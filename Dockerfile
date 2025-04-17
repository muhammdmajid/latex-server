###########################################
# ------------ Stage 1: Build ------------
###########################################

# ✅ Use secure, latest Ubuntu base (as of Apr 2025)
FROM ubuntu:25.04 AS build

# ✅ Install system dependencies & Node.js 20.x (LTS)
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* \
    || { echo "❌ Failed to install Node.js and dependencies"; exit 1; }

# ✅ (Optional) Check installed versions
RUN node -v && npm -v \
    || { echo "❌ Node.js or npm installation failed"; exit 1; }

    # Install global dependencies for TypeScript, tsx, and nodemon
RUN npm install -g tsx nodemon

# # ✅ Set environment to production
# ENV NODE_ENV=production

# # 🚫 Optional: Install LaTeX (commented out to reduce image size)
# # RUN apt-get update && \
# #     apt-get install -y texlive-full && \
# #     apt-get clean && \
# #     rm -rf /var/lib/apt/lists/* \
# #     || { echo "❌ Failed to install LaTeX"; exit 1; }

# # ✅ Set the working directory in the container
# WORKDIR /app

# # ✅ Copy only package files first to leverage Docker cache
# COPY package*.json ./
# COPY tsconfig*.json ./

# # ✅ Install dependencies (including missing types)
# RUN npm install || { echo "❌ npm install failed"; exit 1; }

# # ✅ Install type definitions for Node.js and Express
# RUN npm install --save-dev @types/node @types/express || { echo "❌ Failed to install type definitions"; exit 1; }

# # ✅ Copy remaining source code
# COPY . .

# # ✅ Compile TypeScript and handle aliasing
# RUN npm run build || { echo "❌ TypeScript build failed"; exit 1; }

# #############################################
# # ------------ Stage 2: Production ----------
# #############################################

# # ✅ Use lightweight Node.js base image for final app
# FROM node:20-slim AS production

# # ✅ Set working directory
# WORKDIR /app

# # ✅ Copy built code and minimal package info from build stage
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/package*.json ./

# # ✅ Install only production dependencies
# RUN npm install --omit=dev || { echo "❌ npm install (production) failed"; exit 1; }

# # ✅ Set environment variables
# ENV NODE_ENV=production
# ENV PORT=3000

# # ✅ Expose the port for incoming traffic
# EXPOSE 3000

# # ✅ Run the production server with error handling
# CMD node dist/index.js || { echo "❌ App failed to start"; exit 1; }
