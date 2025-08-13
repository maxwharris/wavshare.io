# wavshare - Music Collaboration Platform

A full-stack music collaboration platform where users can share original music samples or YouTube links, and other users can download and create remixes. The platform facilitates music collaboration through a social media-like interface with voting, commenting, remix tracking, and professional music metadata features.

## 🎵 Features

### Core Features
- **Audio File Sharing**: Upload and share original music samples (up to 250MB)
- **YouTube Integration**: Share YouTube links for music content
- **Remix System**: Create and track remixes of original posts
- **Social Interaction**: Vote, comment, and reply to posts
- **Audio Player**: Built-in audio player with playback controls
- **User Profiles**: Comprehensive user profiles with statistics
- **Real-time Notifications**: Get notified about interactions
- **Tag System**: Organize content with tags

### Professional Music Features
- **BPM Metadata**: Add beats per minute information to tracks (60-200 BPM)
- **Musical Key Support**: Specify musical keys for harmonic mixing compatibility
- **Advanced Search**: Search by BPM range, musical key, and text queries
- **Professional Metadata Display**: Separate display for BPM and key information
- **DJ-Friendly Tools**: Essential metadata for professional DJs and producers

### Content Management
- **Post Deletion**: Authors can delete their posts with cascade cleanup
- **Comment Moderation**: Post authors can delete comments on their posts
- **Reply Management**: Delete functionality for comment replies
- **File Cleanup**: Automatic removal of associated audio files when content is deleted
- **Cascade Deletion**: Proper cleanup of all related content (votes, replies, etc.)

### Enhanced User Experience
- **Large File Support**: 250MB upload limit for high-quality audio
- **File Size Validation**: Client and server-side file size checking
- **Confirmation Dialogs**: Prevent accidental deletions
- **Loading States**: Visual feedback during operations
- **Error Handling**: Comprehensive error messages and recovery

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
   MAX_FILE_SIZE=262144000
   UPLOAD_PATH=../uploads
   CLIENT_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=wavshare <noreply@remixthis.com>
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

## 🎛️ Professional Music Features

### BPM and Key Metadata
- **BPM Input**: Specify beats per minute (60-200 BPM range) when creating posts
- **Musical Key Selection**: Choose from all major and minor keys (C, C#, Db, D, etc.)
- **Smart Storage**: BPM and key data stored as special tags but displayed separately
- **Professional Display**: Color-coded badges for BPM (blue) and key (purple) information

### Advanced Search Capabilities
- **BPM Range Filtering**: Find tracks within specific tempo ranges
- **Musical Key Search**: Discover harmonically compatible tracks
- **Combined Search**: Text + BPM + key filtering work together
- **Real-time Results**: Debounced search with immediate feedback
- **Client-side Optimization**: Efficient filtering without additional server requests

### Content Management System
- **Author Controls**: Post authors can delete their own posts
- **Comment Moderation**: Post authors can moderate comments on their posts
- **Reply Management**: Full delete functionality for comment replies
- **Confirmation Protection**: Prevent accidental deletions with confirmation dialogs
- **Cascade Cleanup**: Automatic removal of all related content and files

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 with TypeScript
- React Router DOM for routing
- Tailwind CSS for styling
- Context API for state management
- Custom hooks for audio playback and authentication

**Backend:**
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Multer for file uploads (250MB limit)
- Comprehensive error handling and validation

### Project Structure

```
remixthis/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ProfileAvatar.tsx
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AudioContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── CreatePost.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   ├── Search.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ...
│   │   └── ...
├── server/                 # Express backend
│   ├── prisma/            # Database schema
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   │   ├── postsController.ts
│   │   │   ├── commentController.ts
│   │   │   ├── authController.ts
│   │   │   └── ...
│   │   ├── middleware/    # Custom middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── ...
│   │   ├── routes/        # API route definitions
│   │   │   ├── posts.ts
│   │   │   ├── comments.ts
│   │   │   ├── search.ts
│   │   │   └── ...
│   │   ├── services/      # Business logic services
│   │   │   └── emailService.ts
│   │   └── index.ts       # Server entry point
├── shared/                # Shared TypeScript types
│   └── types.ts
├── database/              # SQLite database files
├── uploads/               # File upload storage
│   └── audio/            # Audio file storage
└── README.md             # This file
```
