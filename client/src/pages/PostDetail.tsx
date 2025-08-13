import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

interface Post {
  id: string;
  title: string;
  description?: string;
  postType: 'AUDIO_FILE' | 'YOUTUBE_LINK';
  filePath?: string;
  youtubeUrl?: string;
  coverArt?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePhoto?: string;
    description?: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  votes: Array<{
    id: string;
    voteType: string;
    user: {
      id: string;
      username: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    filePath?: string;
    isRemix: boolean;
    parentCommentId?: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      profilePhoto?: string;
    };
    replies?: Array<{
      id: string;
      content: string;
      filePath?: string;
      isRemix: boolean;
      createdAt: string;
      user: {
        id: string;
        username: string;
        profilePhoto?: string;
      };
      votes: Array<{
        id: string;
        voteType: string;
        userId: string;
      }>;
      _count: {
        votes: number;
        replies: number;
      };
    }>;
    votes: Array<{
      id: string;
      voteType: string;
      userId: string;
    }>;
    _count: {
      votes: number;
      replies: number;
    };
  }>;
  _count: {
    votes: number;
    comments: number;
    originalRemixes: number;
  };
}

interface VoteStatus {
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
  voteCounts: {
    upvotes: number;
    downvotes: number;
    total: number;
  };
}

const PostDetail: React.FC = () => {
  const { postId: id } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAudioFile, setReplyAudioFile] = useState<File | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentVotes, setCommentVotes] = useState<{[key: string]: VoteStatus}>({});
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);

  const { user, token } = useAuth();
  const { playTrack } = useAudio();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      console.log('Fetching post with ID:', id);
      try {
        const response = await fetch(API_ENDPOINTS.POST_BY_ID(id));
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setPost(data);
          
          // Calculate vote status from post data
          if (data.votes) {
            const upvotes = data.votes.filter((v: any) => v.voteType === 'UPVOTE').length;
            const downvotes = data.votes.filter((v: any) => v.voteType === 'DOWNVOTE').length;
            const userVote = user ? data.votes.find((v: any) => v.user.id === user.id)?.voteType || null : null;
            
            setVoteStatus({
              userVote,
              voteCounts: {
                upvotes,
                downvotes,
                total: upvotes - downvotes
              }
            });
          }
        } else {
          setError(data.message || 'Failed to fetch post');
        }
      } catch (error) {
        console.error('Fetch post error:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, user]);

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token || !id) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.VOTE(id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
      });

      const data = await response.json();

      if (response.ok) {
        setVoteStatus({
          userVote: data.userVote,
          voteCounts: data.voteCounts
        });
      } else {
        alert(data.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !id) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim() && !selectedAudioFile) {
      return;
    }

    setSubmittingComment(true);

    try {
      const formData = new FormData();
      formData.append('content', newComment.trim());
      
      if (selectedAudioFile) {
        formData.append('audioFile', selectedAudioFile);
      }

      const response = await fetch(API_ENDPOINTS.COMMENTS(id), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new comment to the post
        setPost(prev => prev ? {
          ...prev,
          comments: [data, ...prev.comments],
          _count: {
            ...prev._count,
            comments: prev._count.comments + 1
          }
        } : null);
        setNewComment('');
        setSelectedAudioFile(null);
      } else {
        alert(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, etc.)');
        e.target.value = '';
        return;
      }
      
      // Check file size (250MB limit)
      const maxSize = 250 * 1024 * 1024; // 250MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 250MB. Please select a smaller file.');
        e.target.value = '';
        return;
      }
      
      setSelectedAudioFile(file);
    }
  };

  const handlePlayRemixComment = (comment: any) => {
    if (comment.filePath) {
      const audioUrl = `${API_CONFIG.SERVER_URL}/${comment.filePath}`;
      playTrack({
        id: comment.id,
        title: `Remix by ${comment.user.username}`,
        artist: comment.user.username,
        url: audioUrl,
        postId: post?.id || '',
        userId: comment.user.id
      });
    }
  };

  const handleDownloadRemixComment = (commentId: string) => {
    window.open(API_ENDPOINTS.COMMENT_DOWNLOAD(commentId), '_blank');
  };

  const handleCommentVote = async (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.COMMENT_VOTE(commentId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
      });

      const data = await response.json();

      if (response.ok) {
        setCommentVotes(prev => ({
          ...prev,
          [commentId]: {
            userVote: data.userVote,
            voteCounts: data.voteCounts
          }
        }));
      } else {
        alert(data.message || 'Failed to vote on comment');
      }
    } catch (error) {
      console.error('Comment vote error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !replyingTo) {
      return;
    }

    if (!replyContent.trim() && !replyAudioFile) {
      return;
    }

    setSubmittingReply(true);

    try {
      const formData = new FormData();
      formData.append('content', replyContent.trim());
      
      if (replyAudioFile) {
        formData.append('audioFile', replyAudioFile);
      }

      const response = await fetch(API_ENDPOINTS.COMMENT_REPLIES(replyingTo), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Add the reply to the parent comment
        setPost(prev => {
          if (!prev) return null;
          
          const updatedComments = prev.comments.map(comment => {
            if (comment.id === replyingTo) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data],
                _count: {
                  ...comment._count,
                  replies: (comment._count?.replies || 0) + 1
                }
              };
            }
            return comment;
          });

          return {
            ...prev,
            comments: updatedComments,
            _count: {
              ...prev._count,
              comments: prev._count.comments + 1
            }
          };
        });

        setReplyContent('');
        setReplyAudioFile(null);
        setReplyingTo(null);
      } else {
        alert(data.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, etc.)');
        e.target.value = '';
        return;
      }
      
      // Check file size (250MB limit)
      const maxSize = 250 * 1024 * 1024; // 250MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 250MB. Please select a smaller file.');
        e.target.value = '';
        return;
      }
      
      setReplyAudioFile(file);
    }
  };

  const getCommentVoteStatus = (comment: any) => {
    const votes = comment.votes || [];
    const upvotes = votes.filter((v: any) => v.voteType === 'UPVOTE').length;
    const downvotes = votes.filter((v: any) => v.voteType === 'DOWNVOTE').length;
    const userVote = user ? votes.find((v: any) => v.userId === user.id)?.voteType || null : null;

    return commentVotes[comment.id] || {
      userVote,
      voteCounts: {
        upvotes,
        downvotes,
        total: upvotes - downvotes
      }
    };
  };

  const handlePlayAudio = () => {
    if (post && post.postType === 'AUDIO_FILE' && post.filePath) {
      const audioUrl = `${API_CONFIG.SERVER_URL}/${post.filePath}`;
      playTrack({
        id: post.id,
        title: post.title,
        artist: post.user.username,
        url: audioUrl,
        postId: post.id,
        userId: post.user.id
      });
    }
  };

  const handleDownload = () => {
    if (post && post.postType === 'AUDIO_FILE') {
      window.open(API_ENDPOINTS.POST_DOWNLOAD(post.id), '_blank');
    }
  };

  const handleDeletePost = async () => {
    if (!user || !token || !post) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeletingPost(true);

    try {
      const response = await fetch(API_ENDPOINTS.POST_BY_ID(post.id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Redirect to home page after successful deletion
        navigate('/');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeletingPost(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !token) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeletingComment(commentId);

    try {
      const response = await fetch(API_ENDPOINTS.COMMENT_BY_ID(commentId), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the comment from the post
        setPost(prev => {
          if (!prev) return null;
          
          const updatedComments = prev.comments.filter(comment => comment.id !== commentId);
          
          return {
            ...prev,
            comments: updatedComments,
            _count: {
              ...prev._count,
              comments: prev._count.comments - 1
            }
          };
        });
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeletingComment(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="text-secondary mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <p className="text-red-400">{error || 'Post not found'}</p>
          <Link to="/" className="btn-secondary mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 top-16 overflow-y-auto"
      style={{
        backgroundImage: post.coverArt 
          ? `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${API_CONFIG.SERVER_URL}/${post.coverArt})`
          : `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${API_CONFIG.SERVER_URL}/uploads/covers/default.gif)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto relative z-10 py-6">
        {/* Post Content */}
        <div className="card bg-slate-800/90 backdrop-blur-sm border-slate-600/50 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ProfileAvatar user={post.user} size="xl" />
            <div>
              <Link 
                to={`/profile/${post.user.id}`}
                className="font-semibold text-primary hover:text-accent transition-colors"
              >
                {post.user.username}
              </Link>
              <p className="text-sm text-muted">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <span className="text-sm text-muted capitalize">
            {post.postType.replace('_', ' ').toLowerCase()}
          </span>
        </div>

        <div className="flex gap-6 mb-6">
          {/* Cover Art */}
          <div className="flex-shrink-0">
            <img
              src={post.coverArt ? `${API_CONFIG.SERVER_URL}/${post.coverArt}` : `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
              alt={`Cover art for ${post.title}`}
              className="w-48 h-48 object-cover rounded-lg border border-slate-600 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
              }}
            />
          </div>
          
          {/* Post Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary mb-4">{post.title}</h1>
            
            {post.description && (
              <p className="text-secondary mb-4">{post.description}</p>
            )}
          </div>
        </div>

        {/* Tags, BPM, and Key */}
        <div className="mb-6">
          {/* Regular Tags */}
          {post.tags.filter(tag => !tag.name.startsWith('bpm:') && !tag.name.startsWith('key:')).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags
                .filter(tag => !tag.name.startsWith('bpm:') && !tag.name.startsWith('key:'))
                .map((tag) => (
                  <span 
                    key={tag.id}
                    className="tag"
                  >
                    #{tag.name}
                  </span>
                ))}
            </div>
          )}
          
          {/* BPM and Key Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {post.tags.find(tag => tag.name.startsWith('bpm:')) && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full border border-blue-500/30">
                <span className="font-semibold">BPM:</span>
                <span>{post.tags.find(tag => tag.name.startsWith('bpm:'))?.name.replace('bpm:', '')}</span>
              </div>
            )}
            {post.tags.find(tag => tag.name.startsWith('key:')) && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full border border-purple-500/30">
                <span className="font-semibold">Key:</span>
                <span>{post.tags.find(tag => tag.name.startsWith('key:'))?.name.replace('key:', '')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {post.postType === 'AUDIO_FILE' && post.filePath && (
              <>
                <button
                  onClick={handlePlayAudio}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Play</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Download</span>
                </button>
              </>
            )}
            {post.postType === 'YOUTUBE_LINK' && (
              <a
                href={post.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span>📺</span>
                <span>Watch on YouTube</span>
              </a>
            )}
          </div>
          
          {/* Delete Post Button - Only show if user is post author */}
          {user && user.id === post.user.id && (
            <button
              onClick={handleDeletePost}
              disabled={deletingPost}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <span>🗑️</span>
              <span>{deletingPost ? 'Deleting...' : 'Delete Post'}</span>
            </button>
          )}
        </div>

        {/* Voting */}
        <div className="flex items-center space-x-4 border-t border-slate-600 pt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVote('UPVOTE')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                voteStatus?.userVote === 'UPVOTE'
                  ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-green-600/10 hover:text-green-400 border border-slate-600'
              }`}
              disabled={!user}
            >
              <span>👍</span>
              <span>{voteStatus?.voteCounts.upvotes || 0}</span>
            </button>
            <button
              onClick={() => handleVote('DOWNVOTE')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                voteStatus?.userVote === 'DOWNVOTE'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-red-600/10 hover:text-red-400 border border-slate-600'
              }`}
              disabled={!user}
            >
              <span>👎</span>
              <span>{voteStatus?.voteCounts.downvotes || 0}</span>
            </button>
          </div>
          <div className="text-sm text-muted">
            💬 {post._count.comments} comments • 🎵 {post._count.originalRemixes} remixes
          </div>
        </div>
      </div>

        </div>

        {/* Comments Section */}
        <div className="max-w-4xl mx-auto">
          <div className="card bg-slate-800/90 backdrop-blur-sm border-slate-600/50">
        <h2 className="text-xl font-bold mb-4">Comments ({post._count.comments})</h2>
        
        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex space-x-3">
              <ProfileAvatar user={user} size="md" showLink={false} />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or attach an audio remix..."
                  className="form-textarea"
                  rows={3}
                  maxLength={1000}
                />
                
                {/* File Upload Section */}
                <div className="mt-3 p-3 border-2 border-dashed border-slate-600 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-secondary">🎵 Attach Audio Remix:</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="text-sm text-muted file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                      />
                    </div>
                    {selectedAudioFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedAudioFile(null)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {selectedAudioFile && (
                    <div className="mt-2 text-sm text-green-400">
                      ✓ Selected: {selectedAudioFile.name} ({(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted">
                    {newComment.length}/1000 characters
                  </span>
                  <button
                    type="submit"
                    disabled={(!newComment.trim() && !selectedAudioFile) || submittingComment}
                    className="btn-primary disabled:opacity-50"
                  >
                    {submittingComment ? 'Posting...' : selectedAudioFile ? 'Post Remix' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 bg-slate-700/30 rounded-lg mb-6 border border-slate-600">
            <p className="text-secondary">
              <Link to="/login" className="text-accent hover:text-blue-300 transition-colors">
                Log in
              </Link>{' '}
              to join the conversation
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments.length === 0 ? (
            <p className="text-muted text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            post.comments.map((comment) => {
              const voteStatus = getCommentVoteStatus(comment);
              return (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className={`flex space-x-3 p-4 rounded-lg ${
                    comment.isRemix ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-l-4 border-purple-500' : 'bg-slate-700/30 border border-slate-600'
                  }`}>
                    <ProfileAvatar user={comment.user} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link 
                          to={`/profile/${comment.user.id}`}
                          className="font-semibold text-primary hover:text-accent transition-colors"
                        >
                          {comment.user.username}
                        </Link>
                        {comment.isRemix && (
                          <span className="px-2 py-1 bg-purple-600/80 text-purple-200 text-xs rounded-full font-semibold">
                            🎵 REMIX
                          </span>
                        )}
                        <span className="text-sm text-muted">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      {comment.content && (
                        <p className="text-secondary mb-2">{comment.content}</p>
                      )}
                      {comment.isRemix && comment.filePath && (
                        <div className="flex items-center space-x-2 mb-3">
                          <button
                            onClick={() => handlePlayRemixComment(comment)}
                            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <span>Play Remix</span>
                          </button>
                          <button
                            onClick={() => handleDownloadRemixComment(comment.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <span>Download</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Comment Actions */}
                      <div className="flex items-center space-x-4 text-sm">
                        {/* Voting */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCommentVote(comment.id, 'UPVOTE')}
                            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                              voteStatus.userVote === 'UPVOTE'
                                ? 'bg-green-600/20 text-green-400'
                                : 'text-muted hover:bg-green-600/10 hover:text-green-400'
                            }`}
                            disabled={!user}
                          >
                            <span>👍</span>
                            <span>{voteStatus.voteCounts.upvotes}</span>
                          </button>
                          <button
                            onClick={() => handleCommentVote(comment.id, 'DOWNVOTE')}
                            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                              voteStatus.userVote === 'DOWNVOTE'
                                ? 'bg-red-600/20 text-red-400'
                                : 'text-muted hover:bg-red-600/10 hover:text-red-400'
                            }`}
                            disabled={!user}
                          >
                            <span>👎</span>
                            <span>{voteStatus.voteCounts.downvotes}</span>
                          </button>
                        </div>
                        
                        {/* Reply Button */}
                        {user && (
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-muted hover:text-accent transition-colors"
                          >
                            💬 Reply ({comment._count?.replies || 0})
                          </button>
                        )}

                        {/* Delete Comment Button - Show if user is comment author or post author */}
                        {user && (user.id === comment.user.id || user.id === post.user.id) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingComment === comment.id}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {deletingComment === comment.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="ml-11 bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                      <form onSubmit={handleReplySubmit}>
                        <div className="flex space-x-3">
                          <ProfileAvatar user={user!} size="sm" showLink={false} />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply or attach an audio remix..."
                              className="form-textarea"
                              rows={2}
                              maxLength={1000}
                            />
                            
                            {/* Reply File Upload */}
                            <div className="mt-2 p-2 border border-dashed border-slate-600 rounded bg-slate-700/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-secondary">🎵 Audio Remix:</span>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleReplyFileSelect}
                                    className="text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                                  />
                                </div>
                                {replyAudioFile && (
                                  <button
                                    type="button"
                                    onClick={() => setReplyAudioFile(null)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {replyAudioFile && (
                                <div className="mt-1 text-xs text-green-400">
                                  ✓ {replyAudioFile.name}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-muted">
                                {replyContent.length}/1000
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                    setReplyAudioFile(null);
                                  }}
                                  className="btn-ghost text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={(!replyContent.trim() && !replyAudioFile) || submittingReply}
                                  className="btn-primary text-sm disabled:opacity-50"
                                >
                                  {submittingReply ? 'Posting...' : replyAudioFile ? 'Post Remix Reply' : 'Reply'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3">
                      {comment.replies.map((reply) => {
                        const replyVoteStatus = getCommentVoteStatus(reply);
                        return (
                          <div key={reply.id} className={`flex space-x-3 p-3 rounded-lg border-l-2 border-slate-600 ${
                            reply.isRemix ? 'bg-gradient-to-r from-purple-900/10 to-blue-900/10' : 'bg-slate-700/20'
                          }`}>
                            <ProfileAvatar user={reply.user} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Link 
                                  to={`/profile/${reply.user.id}`}
                                  className="font-semibold text-primary hover:text-accent text-sm transition-colors"
                                >
                                  {reply.user.username}
                                </Link>
                                {reply.isRemix && (
                                  <span className="px-1 py-0.5 bg-purple-600/80 text-purple-200 text-xs rounded font-semibold">
                                    🎵 REMIX
                                  </span>
                                )}
                                <span className="text-xs text-muted">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              {reply.content && (
                                <p className="text-secondary text-sm mb-2">{reply.content}</p>
                              )}
                              {reply.isRemix && reply.filePath && (
                                <div className="flex items-center space-x-2 mb-2">
                                  <button
                                    onClick={() => handlePlayRemixComment(reply)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                  >
                                    <span>Play</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadRemixComment(reply.id)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  >
                                    <span>Download</span>
                                  </button>
                                </div>
                              )}
                              
                              {/* Reply Voting */}
                              <div className="flex items-center space-x-2 text-xs">
                                <button
                                  onClick={() => handleCommentVote(reply.id, 'UPVOTE')}
                                  className={`flex items-center space-x-1 px-1 py-0.5 rounded transition-colors ${
                                    replyVoteStatus.userVote === 'UPVOTE'
                                      ? 'bg-green-600/20 text-green-400'
                                      : 'text-muted hover:bg-green-600/10 hover:text-green-400'
                                  }`}
                                  disabled={!user}
                                >
                                  <span>👍</span>
                                  <span>{replyVoteStatus.voteCounts.upvotes}</span>
                                </button>
                                <button
                                  onClick={() => handleCommentVote(reply.id, 'DOWNVOTE')}
                                  className={`flex items-center space-x-1 px-1 py-0.5 rounded transition-colors ${
                                    replyVoteStatus.userVote === 'DOWNVOTE'
                                      ? 'bg-red-600/20 text-red-400'
                                      : 'text-muted hover:bg-red-600/10 hover:text-red-400'
                                  }`}
                                  disabled={!user}
                                >
                                  <span>👎</span>
                                  <span>{replyVoteStatus.voteCounts.downvotes}</span>
                                </button>

                                {/* Delete Reply Button - Show if user is reply author or post author */}
                                {user && (user.id === reply.user.id || user.id === post.user.id) && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    disabled={deletingComment === reply.id}
                                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-xs"
                                  >
                                    {deletingComment === reply.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
