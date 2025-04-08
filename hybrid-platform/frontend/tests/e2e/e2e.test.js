const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Set up Chrome options
const options = new chrome.Options();
options.addArguments('--headless'); // Run in headless mode
options.addArguments('--no-sandbox');
options.addArguments('--disable-dev-shm-usage');

describe('Hybrid Platform E2E Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds
  let driver;
  
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    fullName: 'Test User'
  };
  
  before(async function() {
    // Initialize the WebDriver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });
  
  after(async function() {
    // Quit the WebDriver after all tests
    await driver.quit();
  });
  
  it('should load the homepage', async function() {
    await driver.get('http://localhost:3000');
    
    // Check if the title contains the platform name
    const title = await driver.getTitle();
    assert(title.includes('Hybrid Platform'), 'Title should contain "Hybrid Platform"');
    
    // Check if the main navigation elements are present
    const navElements = await driver.findElements(By.css('nav a'));
    assert(navElements.length > 0, 'Navigation elements should be present');
  });
  
  it('should register a new user', async function() {
    await driver.get('http://localhost:3000/register');
    
    // Fill in registration form
    await driver.findElement(By.name('username')).sendKeys(testUser.username);
    await driver.findElement(By.name('email')).sendKeys(testUser.email);
    await driver.findElement(By.name('fullName')).sendKeys(testUser.fullName);
    await driver.findElement(By.name('password')).sendKeys(testUser.password);
    await driver.findElement(By.name('confirmPassword')).sendKeys(testUser.password);
    
    // Submit form
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Wait for registration to complete and redirect to home
    await driver.wait(until.urlIs('http://localhost:3000/'), 5000);
    
    // Check if user is logged in
    const welcomeMessage = await driver.findElement(By.css('header')).getText();
    assert(welcomeMessage.includes(testUser.username), 'Welcome message should include username');
  });
  
  it('should log out and log back in', async function() {
    // Log out
    await driver.findElement(By.css('button[aria-label="account menu"]')).click();
    await driver.findElement(By.css('li[data-testid="logout"]')).click();
    
    // Wait for logout to complete
    await driver.wait(until.urlIs('http://localhost:3000/login'), 5000);
    
    // Log back in
    await driver.findElement(By.name('email')).sendKeys(testUser.email);
    await driver.findElement(By.name('password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Wait for login to complete
    await driver.wait(until.urlIs('http://localhost:3000/'), 5000);
    
    // Check if user is logged in
    const welcomeMessage = await driver.findElement(By.css('header')).getText();
    assert(welcomeMessage.includes(testUser.username), 'Welcome message should include username');
  });
  
  it('should create a new post', async function() {
    await driver.get('http://localhost:3000/');
    
    // Click on create post button
    await driver.findElement(By.css('button[aria-label="create post"]')).click();
    
    // Wait for post modal to appear
    await driver.wait(until.elementLocated(By.css('div[role="dialog"]')), 5000);
    
    // Fill in post content
    const postContent = 'This is a test post created by automated testing';
    await driver.findElement(By.css('textarea[name="content"]')).sendKeys(postContent);
    
    // Add tags
    await driver.findElement(By.css('input[name="tags"]')).sendKeys('test, automation');
    await driver.findElement(By.css('input[name="tags"]')).sendKeys(Key.ENTER);
    
    // Submit post
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Wait for post to be created and modal to close
    await driver.wait(until.stalenessOf(await driver.findElement(By.css('div[role="dialog"]'))), 5000);
    
    // Check if post appears in feed
    const posts = await driver.findElements(By.css('.post-card'));
    const postTexts = await Promise.all(posts.map(post => post.getText()));
    assert(postTexts.some(text => text.includes(postContent)), 'New post should appear in feed');
  });
  
  it('should like a post', async function() {
    // Find the first post
    const firstPost = await driver.findElement(By.css('.post-card'));
    
    // Get initial like count
    const likeButton = await firstPost.findElement(By.css('button[aria-label="like"]'));
    const initialLikeCount = await likeButton.getText();
    
    // Click like button
    await likeButton.click();
    
    // Wait for like to register
    await driver.sleep(1000);
    
    // Get updated like count
    const updatedLikeCount = await likeButton.getText();
    
    // Check if like count increased
    assert(parseInt(updatedLikeCount) > parseInt(initialLikeCount), 'Like count should increase');
  });
  
  it('should navigate to profile page', async function() {
    // Click on profile link in header
    await driver.findElement(By.css('button[aria-label="account menu"]')).click();
    await driver.findElement(By.css('li[data-testid="profile"]')).click();
    
    // Wait for profile page to load
    await driver.wait(until.urlContains('/profile/'), 5000);
    
    // Check if profile page contains user information
    const profileContent = await driver.findElement(By.css('main')).getText();
    assert(profileContent.includes(testUser.username), 'Profile page should display username');
    assert(profileContent.includes(testUser.fullName), 'Profile page should display full name');
  });
  
  it('should navigate to leaderboard page', async function() {
    // Click on leaderboard link in navigation
    await driver.findElement(By.css('a[href="/leaderboard"]')).click();
    
    // Wait for leaderboard page to load
    await driver.wait(until.urlIs('http://localhost:3000/leaderboard'), 5000);
    
    // Check if leaderboard page contains expected elements
    const leaderboardContent = await driver.findElement(By.css('main')).getText();
    assert(leaderboardContent.includes('Leaderboard'), 'Leaderboard page should have title');
    
    // Check if tabs for different leaderboard types exist
    const tabs = await driver.findElements(By.css('button[role="tab"]'));
    assert(tabs.length >= 4, 'Leaderboard should have at least 4 tabs');
  });
  
  it('should search for users', async function() {
    // Navigate to home
    await driver.get('http://localhost:3000/');
    
    // Click on search icon
    await driver.findElement(By.css('button[aria-label="search"]')).click();
    
    // Wait for search input to appear
    await driver.wait(until.elementLocated(By.css('input[type="search"]')), 5000);
    
    // Enter search query
    await driver.findElement(By.css('input[type="search"]')).sendKeys(testUser.username);
    await driver.findElement(By.css('input[type="search"]')).sendKeys(Key.ENTER);
    
    // Wait for search results
    await driver.wait(until.elementLocated(By.css('.search-results')), 5000);
    
    // Check if search results contain the test user
    const searchResults = await driver.findElement(By.css('.search-results')).getText();
    assert(searchResults.includes(testUser.username), 'Search results should include test user');
  });
  
  it('should navigate to code editor', async function() {
    // Click on code editor link in navigation
    await driver.findElement(By.css('a[href="/code"]')).click();
    
    // Wait for code editor page to load
    await driver.wait(until.urlIs('http://localhost:3000/code'), 5000);
    
    // Check if code editor contains expected elements
    const editorContent = await driver.findElement(By.css('main')).getText();
    assert(editorContent.includes('Code Editor'), 'Page should have Code Editor title');
    
    // Check if code editor component is present
    const codeEditor = await driver.findElement(By.css('.code-editor'));
    assert(codeEditor !== null, 'Code editor component should be present');
    
    // Check if language selector is present
    const languageSelector = await driver.findElement(By.css('select[aria-label="Select language"]'));
    assert(languageSelector !== null, 'Language selector should be present');
  });
});
