import express from 'express';
import * as channelController from '../controllers/channelController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkChannelAccess } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', channelController.getChannels);
router.post('/', channelController.createChannel);
router.get('/dms', channelController.getUserDMs);
router.get('/dm/:userId', channelController.getDMChannel);
router.get('/:channelId', checkChannelAccess, channelController.getChannelById);
router.post('/:channelId/join', channelController.joinChannel);

export default router;
