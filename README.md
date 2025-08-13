# RemixThis - Music Collaboration Platform

A full-stack music collaboration platform where users can share original music samples or YouTube links, and other users can download and create remixes. The platform facilitates music collaboration through a social media-like interface with voting, commenting, and remix tracking features.

## 🎵 Features

- **Audio File Sharing**: Upload and share original music samples
- **YouTube Integration**: Share YouTube links for music content
- **Remix System**: Create and track remixes of original posts
- **Social Interaction**: Vote, comment, and reply to posts
- **Audio Player**: Built-in audio player with playback controls
- **User Profiles**: Comprehensive user profiles with statistics
- **Real-time Notifications**: Get notified about interactions
- **Tag System**: Organize content with tags
- **Dark Theme**: Modern dark UI design

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd remixthis
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up the database**
   ```bash
   cd ../server
   npx prisma generate
   npx prisma db push
   ```

5. **Configure environment variables**
   
   Create `server/.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="file:../database/remixthis.db"
   JWT_SECRET=your-jwt-secret-key
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

6. **Start the development servers**
   
   Terminal 1 (Server):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Client):
   ```bash
   cd client
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 with TypeScript
- React Router DOM for routing
- Tailwind CSS for styling
- Context API for state management

**Backend:**
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Multer for file uploads

### Project Structure

```
remixthis/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Audio, Notifications)
│   │   ├── pages/          # Page components
│   │   └── ...
├── server/                 # Express backend
│   ├── prisma/            # Database schema
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic services
│   │   └── index.ts       # Server entry point
├── shared/                # Shared TypeScript types
├── database/              # SQLite database files
├── uploads/               # File upload storage
└── README.md             # This file
```

## 📊 Database Schema

### Core Models

- **User**: User accounts with authentication and profiles
- **Post**: Music posts (audio files or YouTube links)
- **Comment**: Hierarchical comments with reply support
- **Vote**: Upvote/downvote system for posts and comments
- **Remix**: Tracks remix relationships between posts
- **Tag**: Content categorization system
- **Notification**: Real-time user notifications

### Key Relationships

- Users can create multiple posts and comments
- Posts can have multiple comments (with nested replies)
- Posts can be remixed, creating remix relationships
- Users can vote on posts and comments
- Posts can have multiple tags for categorization

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user
- `GET /verify-email/:token` - Email verification
- `POST /resend-verification` - Resend verification email

### Posts (`/api/posts`)
- `GET /` - Get all posts (with pagination)
- `POST /` - Create new post
- `GET /:id` - Get specific post
- `PUT /:id` - Update post
- `DELETE /:id` - Delete post
- `GET /:id/download` - Download audio file

### Comments (`/api/comments`)
- `GET /:postId` - Get post comments
- `POST /:postId` - Create comment
- `POST /:commentId/replies` - Create reply
- `POST /:commentId/vote` - Vote on comment
- `GET /:id/download` - Download remix audio

### Votes (`/api/votes`)
- `POST /:postId` - Vote on post
- `GET /:postId` - Get vote status

### Users (`/api/users`)
- `GET /profile/:id` - Get user profile
- `PUT /profile` - Update profile

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /mark-all-read` - Mark all as read

## 🎨 Frontend Features

### Components

**Core Components:**
- `AudioPlayer` - Global audio player with controls
- `Navbar` - Navigation with authentication state
- `NotificationBell` - Real-time notification indicator

**Pages:**
- `Home` - Main feed with posts and remix indicators
- `PostDetail` - Detailed post view with comments
- `Profile` - User profiles with posts, remixes, and stats
- `CreatePost` - Post creation form
- `Login/Register` - Authentication forms
- `Notifications` - Notification center

### Contexts

- **AuthContext**: User authentication and session management
- **AudioContext**: Global audio player state and controls
- **NotificationContext**: Real-time notification system

## 🔒 Security Features

- JWT-based authentication with secure token storage
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- File upload restrictions and validation
- CORS configuration
- Security headers with Helmet.js

## 🎵 Audio Features

- **File Upload**: Support for various audio formats
- **Global Player**: Seamless playback while browsing
- **Download System**: Download original tracks and remixes
- **Remix Tracking**: Visual indicators for remix relationships
- **Volume Controls**: Adjustable volume and seek controls

## 🔔 Notification System

- **Real-time Updates**: Instant notifications for user interactions
- **Notification Types**: Comments, replies, votes, and remixes
- **Notification Center**: Dedicated page for managing notifications
- **Read Status**: Track read/unread notification states

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark design throughout the application
- **Responsive Design**: Mobile-friendly interface
- **Interactive Elements**: Hover effects and smooth transitions
- **Visual Feedback**: Loading states and success/error messages
- **Remix Indicators**: Clear visual distinction for remix content

## 🛠️ Development

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

### Available Scripts

**Server:**
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

**Client:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📈 Current Status

### ✅ Implemented Features
- User registration and authentication system
- Post creation (audio files and YouTube links)
- Hierarchical comment system with replies
- Voting system for posts and comments
- Remix relationship tracking and display
- Real-time notification system
- User profiles with comprehensive statistics
- Global audio player with controls
- File upload and download system
- Tag-based content organization
- Dark theme UI design
- Responsive mobile interface

### 🚧 Known Issues
- Email service requires proper SMTP configuration
- YouTube player integration needs enhancement
- Profile photo upload system needs completion

### 🔮 Future Enhancements
- Advanced search and filtering
- Social features (following, feeds)
- Mobile app development
- Integration with music streaming services
- Advanced remix tools and collaboration features
- Real-time chat system
- Music visualization features

## 🚀 Deployment

### Production Considerations

**Database:**
- Migrate from SQLite to PostgreSQL for production
- Implement database backups and connection pooling

**File Storage:**
- Move to cloud storage (AWS S3, Cloudinary)
- Implement CDN for audio file delivery

**Infrastructure:**
- Set up CI/CD pipeline
- Configure production environment variables
- Implement logging and monitoring
- Set up SSL certificates and reverse proxy

**Performance:**
- Implement caching strategies (Redis)
- Optimize database queries and add indexing
- Add pagination for large datasets
- Implement lazy loading for audio files

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@remixthis.com or create an issue in the repository.

---

**RemixThis** - Where music collaboration comes alive! 🎵
