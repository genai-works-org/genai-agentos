FROM node:20-alpine

WORKDIR /app

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Keep container running for development
CMD ["npm", "run", "dev"]
