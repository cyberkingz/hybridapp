# Hybrid AI/Vibe Coding/News Platform

## Technical Documentation

### Overview
The Hybrid AI/Vibe Coding/News Platform is a comprehensive social platform that combines elements of Twitter-like news feeds with YouTube-style video interactions, specifically targeting AI enthusiasts and indie hackers. The platform enables users to share content, stream live coding sessions, collaborate on code, and engage with a community of like-minded individuals through a gamified experience.

### System Architecture

#### Frontend
- **Framework**: React.js with Material UI
- **State Management**: Context API
- **Routing**: React Router
- **Real-time Communication**: Socket.IO client
- **Code Editing**: Monaco Editor
- **Media Playback**: Video.js with HLS support

#### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **Real-time Communication**: Socket.IO
- **Media Processing**: AWS S3 and CloudFront
- **WebRTC**: For peer-to-peer streaming

#### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Web Server**: Nginx for SSL termination and load balancing
- **Caching**: Redis
- **Deployment**: Automated deployment script

### Database Schema

#### User Model
- Username, email, password (hashed)
- Profile information (full name, bio, avatar)
- Social connections (followers, following)
- Points and badges for gamification
- Activity metrics

#### Content Models
- Posts: Text-based content with tags and media attachments
- Videos: Uploaded video content with metadata
- Streams: Live streaming sessions with chat and viewer metrics
- Code Sessions: Collaborative coding environments with version history

#### Interaction Models
- Comments: Nested comments on all content types
- Likes: User reactions to content
- Notifications: System and user-generated notifications
- Leaderboards: Rankings based on various metrics

### API Endpoints

#### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user
- `GET /api/auth/me`: Get current user profile

#### Posts
- `GET /api/posts`: Get all posts
- `GET /api/posts/:id`: Get a specific post
- `POST /api/posts`: Create a new post
- `PUT /api/posts/:id`: Update a post
- `DELETE /api/posts/:id`: Delete a post
- `PUT /api/posts/:id/like`: Like a post
- `PUT /api/posts/:id/unlike`: Unlike a post

#### Videos
- `GET /api/videos`: Get all videos
- `GET /api/videos/:id`: Get a specific video
- `POST /api/videos`: Upload a new video
- `PUT /api/videos/:id`: Update video metadata
- `DELETE /api/videos/:id`: Delete a video

#### Streams
- `GET /api/streams`: Get all streams
- `GET /api/streams/:id`: Get a specific stream
- `POST /api/streams`: Create a new stream
- `PUT /api/streams/:id`: Update stream metadata
- `DELETE /api/streams/:id`: Delete a stream
- `POST /api/streams/:id/join`: Join a stream
- `POST /api/streams/:id/leave`: Leave a stream

#### Code Sessions
- `GET /api/code`: Get all code sessions
- `GET /api/code/:id`: Get a specific code session
- `POST /api/code`: Create a new code session
- `PUT /api/code/:id`: Update code session
- `DELETE /api/code/:id`: Delete a code session
- `POST /api/code/:id/collaborate`: Join a collaborative session

#### Users
- `GET /api/users/:id`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `PUT /api/users/:id/follow`: Follow a user
- `PUT /api/users/:id/unfollow`: Unfollow a user
- `GET /api/users/:id/followers`: Get user's followers
- `GET /api/users/:id/following`: Get users being followed
- `GET /api/users/search`: Search for users

#### Comments
- `POST /api/comments`: Create a new comment
- `GET /api/comments/:contentType/:contentId`: Get comments for content
- `GET /api/comments/:commentId/replies`: Get replies to a comment
- `PUT /api/comments/:id`: Update a comment
- `DELETE /api/comments/:id`: Delete a comment
- `PUT /api/comments/:id/like`: Like a comment
- `PUT /api/comments/:id/unlike`: Unlike a comment

#### Badges
- `GET /api/badges`: Get all badges
- `GET /api/badges/:id`: Get a specific badge
- `GET /api/badges/:id/check`: Check badge qualification
- `GET /api/badges/check-all`: Check all badges for a user

#### Leaderboards
- `GET /api/leaderboards/:type/:timeframe`: Get leaderboard
- `GET /api/leaderboards/user/:userId`: Get user's ranks

#### Notifications
- `GET /api/notifications`: Get user notifications
- `PUT /api/notifications/:id/read`: Mark notification as read
- `PUT /api/notifications/read-all`: Mark all notifications as read
- `GET /api/notifications/unread-count`: Get unread count

#### Sharing
- `GET /api/share/:contentType/:contentId`: Get sharing links
- `POST /api/share/:contentType/:contentId/:platform`: Record share

### Real-time Features

#### WebSocket Events
- `user:online`: User comes online
- `user:offline`: User goes offline
- `stream:start`: Stream starts
- `stream:end`: Stream ends
- `stream:join`: User joins stream
- `stream:leave`: User leaves stream
- `chat:message`: New chat message
- `code:change`: Code changes in collaborative session
- `notification:new`: New notification

#### WebRTC Signaling
- `offer`: WebRTC offer
- `answer`: WebRTC answer
- `ice-candidate`: ICE candidate
- `negotiation-needed`: Renegotiation needed

### Security Measures

#### Authentication
- JWT-based authentication with expiration
- Password hashing using bcrypt
- HTTPS for all communications

#### Authorization
- Role-based access control
- Resource ownership validation
- Admin privileges for moderation

#### Data Protection
- Input validation and sanitization
- Protection against common web vulnerabilities
- Rate limiting for API endpoints

### Deployment

#### Prerequisites
- Docker and Docker Compose
- SSL certificates
- AWS account for media storage

#### Environment Configuration
- `.env` file with all required environment variables
- Separate configurations for development and production

#### Deployment Steps
1. Clone the repository
2. Configure environment variables
3. Run the deployment script: `./deploy.sh`
4. Access the application at the configured URL

#### Monitoring
- Docker logs for container monitoring
- Application-level logging
- Performance metrics collection

### Testing

#### Backend Tests
- API endpoint tests using Jest and Supertest
- Model validation tests
- Authentication and authorization tests

#### Frontend Tests
- Component tests using React Testing Library
- Integration tests for user flows
- End-to-end tests using Selenium WebDriver

### Future Enhancements
- Advanced recommendation engine
- AI-powered content moderation
- Mobile applications for iOS and Android
- Enhanced analytics dashboard
- Integration with external platforms and APIs
