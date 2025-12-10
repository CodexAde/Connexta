import * as uploadService from '../services/uploadService.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    const result = await uploadService.uploadFile(req.file);
    
    res.json({ file: result });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }
    
    const results = await uploadService.uploadMultipleFiles(req.files);
    
    res.json({ files: results });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    const result = await uploadService.uploadAvatar(req.file);
    
    res.json({ avatar: result });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID required' });
    }
    
    await uploadService.deleteFile(publicId);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};
