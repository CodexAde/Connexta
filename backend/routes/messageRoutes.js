import express from 'express';
import * as messageController from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkChannelAccess } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', messageController.createMessage);
router.get('/channel/:channelId', checkChannelAccess, messageController.getChannelMessages);
router.get('/dm/:userId', messageController.getDMMessages);
router.delete('/:messageId', messageController.deleteMessage);
router.put('/:messageId', messageController.editMessage);

export default router;
