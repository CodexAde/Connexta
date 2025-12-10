import express from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/multerMiddleware.js';

const router = express.Router();

router.post('/register', uploadAvatar, authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

export default router;
