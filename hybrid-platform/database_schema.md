# Database Schema: Hybrid AI/Vibe Coding/News Platform

## Overview
This document defines the database schema for the hybrid platform combining AI news, vibe coding, and interactive live streaming features. The schema is designed to support all the functionality outlined in the PRD while ensuring scalability and performance.

## Entity Relationship Diagram (Text Representation)

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│     Users     │       │     Posts     │       │    Comments   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ username      │       │ user_id       │───┐   │ user_id       │
│ email         │       │ content       │   │   │ post_id       │
│ password_hash │       │ media_urls    │   │   │ video_id      │
│ full_name     │       │ created_at    │   │   │ stream_id     │
│ bio           │       │ updated_at    │   │   │ content       │
│ avatar_url    │       │ likes_count   │   │   │ created_at    │
│ skills        │       │ comments_count│   │   │ updated_at    │
│ points        │       │ is_pinned     │   │   │ likes_count   │
│ created_at    │       └───────────────┘   │   └───────────────┘
│ updated_at    │                           │           ▲
└───────────────┘                           │           │
        ▲                                   │           │
        │                                   │           │
        │         ┌───────────────┐         │           │
        │         │   Followers   │         │           │
        │         ├───────────────┤         │           │
        └─────────│ follower_id   │         │           │
                  │ following_id  │         │           │
                  │ created_at    │         │           │
                  └───────────────┘         │           │
                                            │           │
┌───────────────┐       ┌───────────────┐   │           │
│     Tags      │       │   PostTags    │   │           │
├───────────────┤       ├───────────────┤   │           │
│ id            │       │ post_id       │◄──┘           │
│ name          │◄──────│ tag_id        │               │
│ created_at    │       │ created_at    │               │
└───────────────┘       └───────────────┘               │
                                                        │
┌───────────────┐       ┌───────────────┐               │
│    Videos     │       │    Likes      │               │
├───────────────┤       ├───────────────┤               │
│ id            │       │ user_id       │               │
│ user_id       │       │ post_id       │───────────────┘
│ title         │       │ video_id      │
│ description   │       │ comment_id    │
│ video_url     │       │ created_at    │
│ thumbnail_url │       └───────────────┘
│ duration      │               ▲
│ views_count   │               │
│ likes_count   │               │
│ created_at    │               │
│ updated_at    │               │
└───────────────┘               │
        ▲                       │
        │                       │
        │                       │
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Streams    │       │ StreamPolls   │       │   PollOptions │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ user_id       │       │ stream_id     │◄──────│ poll_id       │
│ title         │       │ question      │       │ option_text   │
│ description   │       │ created_at    │       │ votes_count   │
│ status        │       │ ends_at       │       │ created_at    │
│ started_at    │       │ is_closed     │       └───────────────┘
│ ended_at      │       └───────────────┘
│ recording_url │
│ viewers_count │
│ created_at    │
└───────────────┘

┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Badges     │       │  UserBadges   │       │  Challenges   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ user_id       │       │ id            │
│ name          │◄──────│ badge_id      │       │ title         │
│ description   │       │ awarded_at    │       │ description   │
│ image_url     │       │ created_at    │       │ start_date    │
│ points        │       └───────────────┘       │ end_date      │
│ created_at    │                               │ reward_points │
└───────────────┘                               │ status        │
                                                │ created_at    │
                                                │ updated_at    │
                                                └───────────────┘
                                                        ▲
                                                        │
┌───────────────┐       ┌───────────────┐               │
│ CodeSessions  │       │ UserChallenges│               │
├───────────────┤       ├───────────────┤               │
│ id            │       │ user_id       │               │
│ stream_id     │       │ challenge_id  │───────────────┘
│ title         │       │ joined_at     │
│ language      │       │ completed_at  │
│ code_content  │       │ submission_url│
│ created_at    │       │ points_earned │
│ updated_at    │       │ created_at    │
└───────────────┘       │ updated_at    │
        ▲               └───────────────┘
        │
        │
┌───────────────┐
│ CodeSuggestions│
├───────────────┤
│ id            │
│ session_id    │
│ user_id       │
│ content       │
│ line_start    │
│ line_end      │
│ upvotes       │
│ downvotes     │
│ status        │
│ created_at    │
│ updated_at    │
└───────────────┘
```

## Table Definitions

### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    skills JSONB,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Followers
```sql
CREATE TABLE followers (
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);
```

### Posts
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE
);
```

### Tags
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### PostTags
```sql
CREATE TABLE post_tags (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
);
```

### Videos
```sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    video_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INTEGER, -- in seconds
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Comments
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NULL,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE NULL,
    stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0,
    CHECK (
        (post_id IS NOT NULL AND video_id IS NULL AND stream_id IS NULL) OR
        (post_id IS NULL AND video_id IS NOT NULL AND stream_id IS NULL) OR
        (post_id IS NULL AND video_id IS NULL AND stream_id IS NOT NULL)
    )
);
```

### Likes
```sql
CREATE TABLE likes (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NULL,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE NULL,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, COALESCE(post_id, 0), COALESCE(video_id, 0), COALESCE(comment_id, 0)),
    CHECK (
        (post_id IS NOT NULL AND video_id IS NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND video_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND video_id IS NULL AND comment_id IS NOT NULL)
    )
);
```

### Streams
```sql
CREATE TABLE streams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url VARCHAR(255),
    viewers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### StreamPolls
```sql
CREATE TABLE stream_polls (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_closed BOOLEAN DEFAULT FALSE
);
```

### PollOptions
```sql
CREATE TABLE poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES stream_polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Badges
```sql
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### UserBadges
```sql
CREATE TABLE user_badges (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);
```

### Challenges
```sql
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reward_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### UserChallenges
```sql
CREATE TABLE user_challenges (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    submission_url VARCHAR(255),
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id)
);
```

### CodeSessions
```sql
CREATE TABLE code_sessions (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### CodeSuggestions
```sql
CREATE TABLE code_suggestions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES code_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- follow, like, comment, mention, etc.
    content TEXT NOT NULL,
    related_id INTEGER, -- ID of the related entity (post, comment, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

```sql
-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Posts table indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Videos table indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- Comments table indexes
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_stream_id ON comments(stream_id);

-- Likes table indexes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_video_id ON likes(video_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);

-- Streams table indexes
CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_created_at ON streams(created_at);

-- Code sessions and suggestions indexes
CREATE INDEX idx_code_sessions_stream_id ON code_sessions(stream_id);
CREATE INDEX idx_code_suggestions_session_id ON code_suggestions(session_id);
CREATE INDEX idx_code_suggestions_user_id ON code_suggestions(user_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

## Data Storage Considerations

### Media Storage Strategy
- Video files will be stored in cloud object storage (AWS S3 or similar)
- The database will only store URLs/references to these files
- Thumbnails and small images can be stored directly in the database or in object storage
- Consider using a CDN for faster global delivery of media content

### Caching Strategy
- Implement Redis caching for:
  - User profiles and authentication data
  - Active streams information
  - Popular posts and videos
  - Leaderboard data
  - Real-time counters (views, likes)

### Scaling Considerations
- Implement database sharding for users and content data as the platform grows
- Consider read replicas for high-read operations
- Implement database partitioning for historical data (older posts, ended streams)

### Data Retention Policy
- Keep all user-generated content indefinitely
- Consider archiving older stream recordings to cold storage
- Implement data backup strategies with point-in-time recovery

This database schema provides a solid foundation for the hybrid platform while allowing for future scalability and feature expansion as outlined in the roadmap.
