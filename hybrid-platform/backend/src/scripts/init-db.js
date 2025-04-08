#!/bin/bash

# Script to initialize the database with seed data for the Hybrid Platform

# Exit on error
set -e

echo "Initializing database with seed data..."
echo "======================================="

# Connect to MongoDB and create initial data
mongo ${MONGO_URI} --eval '
// Create admin user
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$yCzJFkYZ5Qr.qOVpmLH9.uHzJlOTWqjbAQ5GqQdQyQ0jlJm1UzKXe", // hashed "admin123"
  fullName: "Admin User",
  isAdmin: true,
  points: 1000,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample badges
db.badges.insertMany([
  {
    name: "Welcome",
    description: "Joined the platform",
    icon: "👋",
    category: "general",
    pointsAwarded: 10,
    requirements: { joined: true },
    level: 1,
    isHidden: false
  },
  {
    name: "Content Creator",
    description: "Created 5 posts",
    icon: "✍️",
    category: "content",
    pointsAwarded: 50,
    requirements: { postCount: 5 },
    level: 1,
    isHidden: false
  },
  {
    name: "Video Star",
    description: "Uploaded 3 videos",
    icon: "🎬",
    category: "content",
    pointsAwarded: 100,
    requirements: { videoCount: 3 },
    level: 2,
    isHidden: false
  },
  {
    name: "Streamer",
    description: "Completed 5 live streams",
    icon: "📡",
    category: "streaming",
    pointsAwarded: 150,
    requirements: { streamCount: 5 },
    level: 2,
    isHidden: false
  },
  {
    name: "Code Wizard",
    description: "Created 10 code sessions",
    icon: "🧙",
    category: "coding",
    pointsAwarded: 200,
    requirements: { codeSessionCount: 10 },
    level: 3,
    isHidden: false
  },
  {
    name: "Social Butterfly",
    description: "Gained 10 followers",
    icon: "🦋",
    category: "social",
    pointsAwarded: 75,
    requirements: { followerCount: 10 },
    level: 2,
    isHidden: false
  }
]);

// Initialize leaderboards
const leaderboardTypes = ["points", "content", "streams", "coding"];
const timeframes = ["daily", "weekly", "monthly", "alltime"];

leaderboardTypes.forEach(type => {
  timeframes.forEach(timeframe => {
    db.leaderboards.insertOne({
      type: type,
      timeframe: timeframe,
      entries: [],
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
});

print("Database initialization completed successfully!");
'

echo "Database initialization completed!"
echo "======================================="
