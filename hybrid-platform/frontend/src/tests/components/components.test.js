import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import NewsFeed from '../../components/feed/NewsFeed';
import VideoPlayer from '../../components/video/VideoPlayer';
import CodeEditor from '../../components/code/CodeEditor';
import ShareComponent from '../../components/social/ShareComponent';
import BadgesComponent from '../../components/gamification/BadgesComponent';
import PointsComponent from '../../components/gamification/PointsComponent';

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to wrap components with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Reset mocks before each test
beforeEach(() => {
  fetch.mockClear();
});

describe('NewsFeed Component', () => {
  test('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    renderWithProviders(<NewsFeed />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders posts when data is loaded', async () => {
    // Mock successful fetch response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          posts: [
            { _id: '1', content: 'Test post 1', user: { username: 'testuser', avatar: '' }, createdAt: new Date().toISOString() },
            { _id: '2', content: 'Test post 2', user: { username: 'testuser2', avatar: '' }, createdAt: new Date().toISOString() }
          ],
          currentPage: 1,
          totalPages: 1
        })
      })
    );
    
    renderWithProviders(<NewsFeed />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test post 1')).toBeInTheDocument();
      expect(screen.getByText('Test post 2')).toBeInTheDocument();
    });
  });
  
  test('renders error message when fetch fails', async () => {
    // Mock failed fetch response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to load posts' })
      })
    );
    
    renderWithProviders(<NewsFeed />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
    });
  });
});

describe('VideoPlayer Component', () => {
  const mockVideo = {
    _id: '1',
    title: 'Test Video',
    description: 'This is a test video',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    user: { username: 'testuser', avatar: '' },
    views: 100,
    likes: ['user1', 'user2'],
    createdAt: new Date().toISOString()
  };
  
  test('renders video player with correct video', () => {
    renderWithProviders(<VideoPlayer video={mockVideo} />);
    
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('This is a test video')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('100 views')).toBeInTheDocument();
    
    // Check if video element has correct source
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toHaveAttribute('src', mockVideo.videoUrl);
  });
  
  test('handles like button click', async () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue('fake-token'),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock successful like response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['user1', 'user2', 'currentUser'])
      })
    );
    
    renderWithProviders(<VideoPlayer video={mockVideo} />);
    
    // Click like button
    fireEvent.click(screen.getByLabelText('like'));
    
    // Verify fetch was called with correct parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/videos/${mockVideo._id}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': 'fake-token'
        }
      });
    });
  });
});

describe('CodeEditor Component', () => {
  test('renders code editor with initial code', () => {
    const initialCode = 'console.log("Hello, world!");';
    
    renderWithProviders(<CodeEditor initialCode={initialCode} language="javascript" />);
    
    // Check if code editor contains the initial code
    const codeElement = screen.getByText(/Hello, world!/i);
    expect(codeElement).toBeInTheDocument();
  });
  
  test('renders language selector with correct options', () => {
    renderWithProviders(<CodeEditor initialCode="" language="javascript" />);
    
    // Open language selector
    fireEvent.click(screen.getByLabelText('Select language'));
    
    // Check if common languages are in the dropdown
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
  });
});

describe('ShareComponent', () => {
  test('renders share button', () => {
    renderWithProviders(
      <ShareComponent 
        contentType="post" 
        contentId="123" 
        title="Test Content" 
      />
    );
    
    expect(screen.getByLabelText('share')).toBeInTheDocument();
  });
  
  test('opens share menu when clicked', () => {
    // Mock successful fetch response for sharing links
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://example.com/posts/123',
          text: 'Check out "Test Content" by @testuser on Hybrid Platform',
          platforms: {
            twitter: 'https://twitter.com/intent/tweet?text=...',
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=...',
            linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=...',
            reddit: 'https://www.reddit.com/submit?url=...',
            email: 'mailto:?subject=...'
          }
        })
      })
    );
    
    renderWithProviders(
      <ShareComponent 
        contentType="post" 
        contentId="123" 
        title="Test Content" 
      />
    );
    
    // Click share button
    fireEvent.click(screen.getByLabelText('share'));
    
    // Check if share menu opens with platform options
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });
});

describe('BadgesComponent', () => {
  test('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    fetch.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<BadgesComponent userId="user123" />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders badges when data is loaded', async () => {
    // Mock successful fetch responses
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { _id: '1', name: 'Content Creator', description: 'Created 5 posts', icon: '🏆', category: 'content', level: 1 },
          { _id: '2', name: 'Social Butterfly', description: 'Gained 10 followers', icon: '🦋', category: 'social', level: 1 }
        ])
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          badges: [
            { _id: '1', name: 'Content Creator', description: 'Created 5 posts', icon: '🏆', category: 'content', level: 1 }
          ]
        })
      })
    );
    
    renderWithProviders(<BadgesComponent userId="user123" />);
    
    // Wait for badges to load
    await waitFor(() => {
      expect(screen.getByText('Content Creator')).toBeInTheDocument();
    });
  });
  
  test('renders empty state when no badges', async () => {
    // Mock successful fetch responses with no badges
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          badges: []
        })
      })
    );
    
    renderWithProviders(<BadgesComponent userId="user123" />);
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText('No badges earned yet.')).toBeInTheDocument();
    });
  });
});

describe('PointsComponent', () => {
  test('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    fetch.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<PointsComponent userId="user123" />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders points and level when data is loaded', async () => {
    // Mock successful fetch response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          _id: 'user123',
          username: 'testuser',
          points: 150
        })
      })
    );
    
    renderWithProviders(<PointsComponent userId="user123" />);
    
    // Wait for points to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });
  });
  
  test('renders progress to next level', async () => {
    // Mock successful fetch response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          _id: 'user123',
          username: 'testuser',
          points: 150
        })
      })
    );
    
    renderWithProviders(<PointsComponent userId="user123" />);
    
    // Wait for progress information to load
    await waitFor(() => {
      expect(screen.getByText('50 more points to reach Level 3')).toBeInTheDocument();
    });
  });
});
