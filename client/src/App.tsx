import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AudioProvider } from './contexts/AudioContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { QueueProvider } from './contexts/QueueContext.tsx';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Profile from './pages/Profile.tsx';
import CreatePost from './pages/CreatePost.tsx';
import PostDetail from './pages/PostDetail.tsx';
import Search from './pages/Search.tsx';
import Notifications from './pages/Notifications.tsx';
import VerifyEmail from './pages/VerifyEmail.tsx';
import AudioPlayer from './components/AudioPlayer.tsx';
import './App.css';

// Loading component for authentication initialization
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="spinner h-12 w-12 mx-auto mb-4"></div>
      <p className="text-secondary">Loading...</p>
    </div>
  </div>
);

// Main app content component
const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AudioProvider>
      <QueueProvider>
        <NotificationProvider>
          <Router>
            <div className="App min-h-screen bg-slate-900">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Routes>
              </main>
              <AudioPlayer />
            </div>
          </Router>
        </NotificationProvider>
      </QueueProvider>
    </AudioProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
