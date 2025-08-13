import express from 'express';
import { auth } from '../middleware/auth';
import {
  getUserQueue,
  addToQueue,
  addToQueueNext,
  removeFromQueue,
  reorderQueue,
  clearQueue,
  getQueueSettings,
  updateQueueSettings
} from '../controllers/queueController';

const router = express.Router();

// All queue routes require authentication
router.use(auth);

// Queue management routes
router.get('/', getUserQueue);
router.post('/', addToQueue);
router.post('/next', addToQueueNext);
router.delete('/:postId', removeFromQueue);
router.put('/reorder', reorderQueue);
router.delete('/', clearQueue);

// Queue settings routes
router.get('/settings', getQueueSettings);
router.put('/settings', updateQueueSettings);

export default router;
