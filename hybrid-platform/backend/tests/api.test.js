const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/user.model');
const Post = require('../src/models/post.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

// Mock user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User'
};

let token;
let userId;

// Connect to test database before running tests
beforeAll(async () => {
  // Use a separate test database
  const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/hybrid-platform-test';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
});

// Clean up database after tests
afterAll(async () => {
  // Clean up test data
  await User.deleteMany({});
  await Post.deleteMany({});
  
  // Close database connection
  await mongoose.connection.close();
});

describe('Auth API', () => {
  // Test user registration
  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', testUser.username);
    
    // Save user ID and token for later tests
    userId = res.body.user._id;
    token = res.body.token;
  });
  
  // Test user login
  test('should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', testUser.username);
  });
  
  // Test login with wrong password
  test('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
  
  // Test get current user
  test('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).toHaveProperty('email', testUser.email);
  });
  
  // Test protected route without token
  test('should not access protected route without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'No token, authorization denied');
  });
  
  // Test protected route with invalid token
  test('should not access protected route with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-auth-token', 'invalidtoken');
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Token is not valid');
  });
});

describe('Post API', () => {
  let postId;
  
  // Test create post
  test('should create a new post', async () => {
    const postData = {
      content: 'This is a test post',
      tags: ['test', 'api']
    };
    
    const res = await request(app)
      .post('/api/posts')
      .set('x-auth-token', token)
      .send(postData);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('content', postData.content);
    expect(res.body).toHaveProperty('user', userId);
    expect(res.body.tags).toEqual(expect.arrayContaining(postData.tags));
    
    // Save post ID for later tests
    postId = res.body._id;
  });
  
  // Test get all posts
  test('should get all posts', async () => {
    const res = await request(app)
      .get('/api/posts');
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.posts)).toBeTruthy();
    expect(res.body.posts.length).toBeGreaterThan(0);
  });
  
  // Test get post by ID
  test('should get post by ID', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id', postId);
    expect(res.body).toHaveProperty('content', 'This is a test post');
  });
  
  // Test update post
  test('should update post', async () => {
    const updateData = {
      content: 'This is an updated test post'
    };
    
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('x-auth-token', token)
      .send(updateData);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('content', updateData.content);
  });
  
  // Test like post
  test('should like a post', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}/like`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toContain(userId);
  });
  
  // Test unlike post
  test('should unlike a post', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}/unlike`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).not.toContain(userId);
  });
  
  // Test delete post
  test('should delete post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Post removed');
    
    // Verify post is deleted
    const checkRes = await request(app)
      .get(`/api/posts/${postId}`);
    
    expect(checkRes.statusCode).toEqual(404);
  });
});

describe('User API', () => {
  let otherUserId;
  let otherUserToken;
  
  // Create another test user
  test('should create another test user', async () => {
    const otherUser = {
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
      fullName: 'Other User'
    };
    
    const res = await request(app)
      .post('/api/auth/register')
      .send(otherUser);
    
    expect(res.statusCode).toEqual(201);
    
    otherUserId = res.body.user._id;
    otherUserToken = res.body.token;
  });
  
  // Test follow user
  test('should follow a user', async () => {
    const res = await request(app)
      .put(`/api/users/${otherUserId}/follow`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.following).toContain(otherUserId);
  });
  
  // Test get followers
  test('should get user followers', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUserId}/followers`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]._id).toEqual(userId);
  });
  
  // Test get following
  test('should get users being followed', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/following`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]._id).toEqual(otherUserId);
  });
  
  // Test unfollow user
  test('should unfollow a user', async () => {
    const res = await request(app)
      .put(`/api/users/${otherUserId}/unfollow`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.following).not.toContain(otherUserId);
  });
  
  // Test update profile
  test('should update user profile', async () => {
    const updateData = {
      bio: 'This is a test bio',
      skills: ['JavaScript', 'React', 'Node.js']
    };
    
    const res = await request(app)
      .put('/api/users/profile')
      .set('x-auth-token', token)
      .send(updateData);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('bio', updateData.bio);
    expect(res.body.skills).toEqual(expect.arrayContaining(updateData.skills));
  });
  
  // Test search users
  test('should search users', async () => {
    const res = await request(app)
      .get('/api/users/search?query=test');
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('username', testUser.username);
  });
});

describe('Comment API', () => {
  let postId;
  let commentId;
  
  // Create a test post for comments
  test('should create a test post for comments', async () => {
    const postData = {
      content: 'This is a post for testing comments',
      tags: ['test', 'comments']
    };
    
    const res = await request(app)
      .post('/api/posts')
      .set('x-auth-token', token)
      .send(postData);
    
    expect(res.statusCode).toEqual(201);
    postId = res.body._id;
  });
  
  // Test create comment
  test('should create a comment on a post', async () => {
    const commentData = {
      content: 'This is a test comment',
      contentType: 'post',
      contentId: postId
    };
    
    const res = await request(app)
      .post('/api/comments')
      .set('x-auth-token', token)
      .send(commentData);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('content', commentData.content);
    expect(res.body).toHaveProperty('contentType', commentData.contentType);
    expect(res.body).toHaveProperty('contentId', commentData.contentId);
    
    commentId = res.body._id;
  });
  
  // Test get comments for a post
  test('should get comments for a post', async () => {
    const res = await request(app)
      .get(`/api/comments/post/${postId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('comments');
    expect(Array.isArray(res.body.comments)).toBeTruthy();
    expect(res.body.comments.length).toBeGreaterThan(0);
  });
  
  // Test update comment
  test('should update a comment', async () => {
    const updateData = {
      content: 'This is an updated test comment'
    };
    
    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('x-auth-token', token)
      .send(updateData);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('content', updateData.content);
  });
  
  // Test like comment
  test('should like a comment', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}/like`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toContain(userId);
  });
  
  // Test unlike comment
  test('should unlike a comment', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}/unlike`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).not.toContain(userId);
  });
  
  // Test delete comment
  test('should delete a comment', async () => {
    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Comment removed');
  });
});

describe('Badge API', () => {
  let badgeId;
  
  // Test create badge (admin only)
  test('should create a badge as admin', async () => {
    // Create admin token
    const adminPayload = {
      user: {
        id: userId,
        isAdmin: true
      }
    };
    
    const adminToken = jwt.sign(
      adminPayload,
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    const badgeData = {
      name: 'Test Badge',
      description: 'A badge for testing',
      icon: '🏆',
      category: 'general',
      pointsAwarded: 50,
      requirements: { points: 100 },
      level: 1
    };
    
    const res = await request(app)
      .post('/api/badges')
      .set('x-auth-token', adminToken)
      .send(badgeData);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', badgeData.name);
    expect(res.body).toHaveProperty('pointsAwarded', badgeData.pointsAwarded);
    
    badgeId = res.body._id;
  });
  
  // Test get all badges
  test('should get all badges', async () => {
    const res = await request(app)
      .get('/api/badges');
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  // Test get badge by ID
  test('should get badge by ID', async () => {
    const res = await request(app)
      .get(`/api/badges/${badgeId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id', badgeId);
    expect(res.body).toHaveProperty('name', 'Test Badge');
  });
  
  // Test check badge qualification
  test('should check badge qualification', async () => {
    const res = await request(app)
      .get(`/api/badges/${badgeId}/check`)
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('qualified');
    expect(res.body).toHaveProperty('stats');
  });
});

describe('Leaderboard API', () => {
  // Test get leaderboard
  test('should get points leaderboard', async () => {
    const res = await request(app)
      .get('/api/leaderboards/points/weekly');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('type', 'points');
    expect(res.body).toHaveProperty('timeframe', 'weekly');
    expect(res.body).toHaveProperty('entries');
    expect(Array.isArray(res.body.entries)).toBeTruthy();
  });
  
  // Test get user ranks
  test('should get user ranks', async () => {
    const res = await request(app)
      .get(`/api/leaderboards/user/${userId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('userId', userId);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).toHaveProperty('ranks');
  });
});
