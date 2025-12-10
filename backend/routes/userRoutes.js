import express from 'express';
import * as userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.get('/search', userController.searchUsers);
router.get('/all', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.put('/profile', userController.updateProfile);

export default router;
