import express from 'express';
import * as uploadController from '../controllers/uploadController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadSingle, uploadMultiple, uploadAvatar } from '../middleware/multerMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/file', uploadSingle, uploadController.uploadFile);
router.post('/files', uploadMultiple, uploadController.uploadMultipleFiles);
router.post('/avatar', uploadAvatar, uploadController.uploadAvatar);
router.delete('/file', uploadController.deleteFile);

export default router;
