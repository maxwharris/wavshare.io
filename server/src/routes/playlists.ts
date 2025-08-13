import express from 'express';
import { auth } from '../middleware/auth';
import {
  getUserPlaylists,
  getPlaylistById,
  getPlaylistsByUserId,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  addPlaylistToQueue
} from '../controllers/playlistController';

const router = express.Router();

// Get user's playlists
router.get('/', auth, getUserPlaylists);

// Create new playlist
router.post('/', auth, createPlaylist);

// Get playlists by user ID (public access)
router.get('/user/:userId', getPlaylistsByUserId);

// Get playlist by ID (public access)
router.get('/:playlistId', getPlaylistById);

// Update playlist
router.put('/:playlistId', auth, updatePlaylist);

// Delete playlist
router.delete('/:playlistId', auth, deletePlaylist);

// Add track to playlist
router.post('/:playlistId/tracks', auth, addTrackToPlaylist);

// Remove track from playlist
router.delete('/:playlistId/tracks/:postId', auth, removeTrackFromPlaylist);

// Reorder playlist tracks
router.put('/:playlistId/tracks/reorder', auth, reorderPlaylistTracks);

// Add playlist to queue
router.post('/:playlistId/queue', auth, addPlaylistToQueue);

export default router;
