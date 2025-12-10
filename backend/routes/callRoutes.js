import express from 'express';
import * as callController from '../controllers/callController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', callController.createCall);
router.get('/active', callController.getActiveCall);
router.get('/user', callController.getUserCalls);
router.post('/:callId/join', callController.joinCall);
router.post('/:callId/leave', callController.leaveCall);
router.post('/:callId/end', callController.endCall);

export default router;
