#!/bin/bash

# Deployment script for Hybrid AI/Vibe Coding/News Platform

# Exit on error
set -e

echo "Starting deployment of Hybrid Platform..."
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  echo "Please create a .env file based on .env.example"
  exit 1
fi

# Load environment variables
source .env

# Create directories if they don't exist
mkdir -p nginx/ssl

# Check if SSL certificates exist
if [ ! -f nginx/ssl/hybrid-platform.crt ] || [ ! -f nginx/ssl/hybrid-platform.key ]; then
  echo "Warning: SSL certificates not found in nginx/ssl/"
  echo "For production, please add your SSL certificates."
  echo "For development, self-signed certificates will be generated."
  
  # Generate self-signed certificates for development
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/hybrid-platform.key \
    -out nginx/ssl/hybrid-platform.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=hybrid-platform.example.com"
fi

# Build and start containers
echo "Building and starting containers..."
docker-compose build
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose ps

# Initialize database (if needed)
echo "Initializing database..."
docker-compose exec backend node src/scripts/init-db.js

# Display access information
echo ""
echo "Deployment completed successfully!"
echo "=========================================="
echo "Access the application at: ${CLIENT_URL}"
echo "API available at: ${API_URL}"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo "=========================================="
