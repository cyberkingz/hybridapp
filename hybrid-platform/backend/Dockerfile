# Backend Dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Expose port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
