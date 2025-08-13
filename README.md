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
