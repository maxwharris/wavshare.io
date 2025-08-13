# RemixThis - Project Documentation

## Project Overview

RemixThis is a full-stack music collaboration platform where users can share original music samples or YouTube links, and other users can download and create remixes. The platform facilitates music collaboration through a social media-like interface with voting, commenting, and remix tracking features.

## Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 with TypeScript
- React Router DOM 6.20.1 for routing
- Axios 1.6.2 for HTTP requests
- Tailwind CSS 3.3.6 for styling
- Create React App as build tool

**Backend:**
- Node.js with Express 4.18.2
- TypeScript 5.3.3
- Prisma 5.7.1 as ORM
- SQLite database
- JWT authentication with jsonwebtoken 9.0.2
- bcryptjs 2.4.3 for password hashing

**Additional Libraries & Tools:**
- Multer 1.4.5 for file uploads
- Nodemailer 7.0.5 for email services
- Express Rate Limit 7.1.5 for API rate limiting
- Express Validator 7.0.1 for input validation
- Helmet 7.1.0 for security headers
- CORS 2.8.5 for cross-origin requests
- Nodemon 3.0.2 for development

### Project Structure

```
remixthis/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Audio)
│   │   ├── pages/          # Page components
│   │   └── ...
├── server/                 # Express backend
│   ├── prisma/            # Database schema and migrations
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic services
│   │   └── index.ts       # Server entry point
├── shared/                # Shared TypeScript types
├── database/              # SQLite database files
├── uploads/               # File upload storage
└── concept.txt           # Original project requirements
```

## Database Schema

### Models

**User**
- id (String, Primary Key, CUID)
- username (String, Unique)
- email (String, Unique)
- passwordHash (String)
- emailVerified (Boolean, default: false)
- emailVerificationToken (String, Optional)
- emailVerificationExpires (DateTime, Optional)
- profilePhoto (String, Optional)
- description (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)

**Post**
- id (String, Primary Key, CUID)
- userId (String, Foreign Key)
- title (String)
- description (String, Optional)
- filePath (String, Optional) - for uploaded audio files
- youtubeUrl (String, Optional) - for YouTube links
- postType (String) - 'AUDIO_FILE' or 'YOUTUBE_LINK'
- createdAt (DateTime)
- updatedAt (DateTime)

**Tag**
- id (String, Primary Key, CUID)
- name (String, Unique)

**PostTag** (Many-to-Many Junction)
- postId (String, Foreign Key)
- tagId (String, Foreign Key)

**Remix**
- id (String, Primary Key, CUID)
- originalPostId (String, Foreign Key)
- remixPostId (String, Foreign Key)
- userId (String, Foreign Key)
- createdAt (DateTime)

**Vote**
- id (String, Primary Key, CUID)
- userId (String, Foreign Key)
- postId (String, Foreign Key)
- voteType (String) - 'UPVOTE' or 'DOWNVOTE'
- createdAt (DateTime)

**Comment**
- id (String, Primary Key, CUID)
- userId (String, Foreign Key)
- postId (String, Foreign Key)
- content (String)
- createdAt (DateTime)
- updatedAt (DateTime)

### Relationships

- User has many Posts, Votes, Comments, Remixes
- Post belongs to User, has many Tags (through PostTag), Votes, Comments
- Post can be original or remix (self-referential through Remix model)
- Vote belongs to User and Post (unique constraint on userId + postId)
- Comment belongs to User and Post

## API Endpoints

### Authentication Routes (`/api/auth`)

**POST /api/auth/register**
- Description: Register new user
- Access: Public
- Validation: username (3-30 chars, alphanumeric + underscore), email, password (min 6 chars)
- Response: User object + JWT token

**POST /api/auth/login**
- Description: Login user
- Access: Public
- Body: usernameOrEmail, password
- Response: User object + JWT token

**GET /api/auth/me**
- Description: Get current user profile
- Access: Private (requires JWT)
- Response: User object

**GET /api/auth/verify-email/:token**
- Description: Verify email address
- Access: Public
- Response: Success message

**POST /api/auth/resend-verification**
- Description: Resend verification email
- Access: Private
- Response: Success message

### Posts Routes (`/api/posts`)

**GET /api/posts**
- Description: Get all posts with pagination
- Access: Public
- Query params: page, limit, search, tags
- Response: Array of posts with user, tags, vote counts

**POST /api/posts**
- Description: Create new post
- Access: Private
- Body: title, description, postType, youtubeUrl (optional), tags (optional)
- File upload: audioFile (for AUDIO_FILE type)
- Validation: title (1-200 chars), description (max 1000 chars)

**GET /api/posts/:id**
- Description: Get specific post by ID
- Access: Public
- Response: Post with full details, comments, remixes

**PUT /api/posts/:id**
- Description: Update post (owner only)
- Access: Private
- Body: title, description, tags

**DELETE /api/posts/:id**
- Description: Delete post (owner only)
- Access: Private

### Comments Routes (`/api/comments`)

**GET /api/posts/:postId/comments**
- Description: Get comments for a post
- Access: Public

**POST /api/posts/:postId/comments**
- Description: Add comment to post
- Access: Private
- Body: content

**PUT /api/comments/:id**
- Description: Update comment (owner only)
- Access: Private

**DELETE /api/comments/:id**
- Description: Delete comment (owner only)
- Access: Private

### Votes Routes (`/api/votes`)

**POST /api/posts/:postId/vote**
- Description: Vote on a post
- Access: Private
- Body: voteType ('UPVOTE' or 'DOWNVOTE')

**DELETE /api/posts/:postId/vote**
- Description: Remove vote from post
- Access: Private

### Users Routes (`/api/users`)

**GET /api/users/:id**
- Description: Get user profile
- Access: Public

**PUT /api/users/:id**
- Description: Update user profile (owner only)
- Access: Private
- Body: username, description, profilePhoto

**GET /api/users/:id/posts**
- Description: Get user's posts
- Access: Public

## Frontend Architecture

### Components

**Core Components:**
- `App.tsx` - Main application component with routing
- `Navbar.tsx` - Navigation header with auth state
- `AudioPlayer.tsx` - Global audio player component

**Pages:**
- `Home.tsx` - Main feed displaying posts
- `Login.tsx` - User login form
- `Register.tsx` - User registration form
- `CreatePost.tsx` - Post creation form
- `PostDetail.tsx` - Individual post view
- `Profile.tsx` - User profile page
- `VerifyEmail.tsx` - Email verification page

### Contexts

**AuthContext:**
- Manages user authentication state
- Provides login, logout, register functions
- Handles JWT token storage and validation
- Protects private routes

**AudioContext:**
- Manages global audio player state
- Handles playlist functionality
- Controls playback across the application
- Provides seamless audio experience while browsing

### Key Features

**Authentication System:**
- JWT-based authentication
- Email verification (currently disabled for testing)
- Protected routes and components
- Persistent login state

**Post Management:**
- Support for audio file uploads and YouTube links
- Tag system for categorization
- Rich text descriptions
- File validation and processing

**Social Features:**
- Upvote/downvote system
- Comment threads
- User profiles with post history
- Remix tracking and relationships

**Audio Player:**
- Global audio player with queue functionality
- Seamless playback while browsing
- Support for uploaded files and YouTube integration
- Volume and playback controls

## Security Features

**Backend Security:**
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token expiration (30 days)
- File upload restrictions (50MB max)

**Frontend Security:**
- Protected routes with authentication checks
- Input sanitization
- Secure token storage
- HTTPS enforcement in production

## Configuration

### Environment Variables

**Server (.env):**
```
PORT=5000
NODE_ENV=development
DATABASE_URL="file:../database/remixthis.db"
JWT_SECRET=dev-jwt-secret-key-remixthis-2024
MAX_FILE_SIZE=50000000
UPLOAD_PATH=../uploads
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=RemixThis <noreply@remixthis.com>
```

**Client:**
- Proxy configuration to backend (http://localhost:5000)
- Tailwind CSS configuration
- TypeScript configuration

## Development Workflow

### Setup Commands

**Server:**
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Client:**
```bash
cd client
npm install
npm start
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Current Status

### Implemented Features
✅ User registration and authentication
✅ Email verification system (disabled for testing)
✅ Post creation (audio files and YouTube links)
✅ Voting system (upvote/downvote)
✅ Comment system
✅ User profiles
✅ Audio player with basic controls
✅ File upload handling
✅ Tag system
✅ Remix relationship tracking
✅ Responsive UI with Tailwind CSS

### Known Issues
- Email service configuration needs proper SMTP credentials
- Prisma client generation permission issues on Windows
- Audio player needs YouTube integration
- Missing notification system
- Profile photo upload not fully implemented

### Future Enhancements
- Real-time notifications
- Advanced audio player features
- Social features (following, feeds)
- Search and filtering improvements
- Mobile app development
- Advanced remix tools
- Integration with music streaming services

## Deployment Considerations

**Database:**
- Consider migrating from SQLite to PostgreSQL for production
- Implement database backups and migrations
- Set up connection pooling

**File Storage:**
- Move from local file storage to cloud storage (AWS S3, Cloudinary)
- Implement CDN for audio file delivery
- Add file compression and optimization

**Infrastructure:**
- Set up proper CI/CD pipeline
- Configure production environment variables
- Implement logging and monitoring
- Set up SSL certificates
- Configure reverse proxy (Nginx)

**Performance:**
- Implement caching strategies (Redis)
- Optimize database queries
- Add pagination for large datasets
- Implement lazy loading for audio files

This documentation provides a comprehensive overview of the RemixThis project architecture, implementation details, and future development considerations.
