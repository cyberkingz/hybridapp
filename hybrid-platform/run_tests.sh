#!/bin/bash

# Script to run all tests for the Hybrid Platform

echo "Starting Hybrid Platform Test Suite"
echo "=================================="

# Navigate to project root
cd /home/ubuntu/hybrid-platform

# Install test dependencies if needed
echo "Installing test dependencies..."
cd backend
npm install --save-dev jest supertest
cd ../frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom selenium-webdriver
cd ..

# Run backend tests
echo ""
echo "Running Backend API Tests..."
echo "=================================="
cd backend
npm test

# Run frontend component tests
echo ""
echo "Running Frontend Component Tests..."
echo "=================================="
cd ../frontend
npm test

# Start servers for E2E tests
echo ""
echo "Starting servers for E2E tests..."
echo "=================================="
cd ../backend
npm start &
BACKEND_PID=$!
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 10

# Run E2E tests
echo ""
echo "Running End-to-End Tests..."
echo "=================================="
cd tests/e2e
node e2e.test.js

# Shutdown servers
echo ""
echo "Shutting down servers..."
kill $BACKEND_PID
kill $FRONTEND_PID

echo ""
echo "Test Suite Completed"
echo "=================================="
