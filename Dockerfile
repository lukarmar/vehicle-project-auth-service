FROM node:18-alpine

WORKDIR /app

# Install dependencies without prepare scripts
ENV HUSKY=0

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Command will be overridden by docker-compose
CMD ["npm", "run", "start:dev"]