import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

export const uploadFile = async (file, folder = 'connexta/files') => {
  const result = await uploadBufferToCloudinary(file.buffer, folder);
  
  const fileType = getFileType(file.mimetype);
  
  return {
    url: result.url,
    publicId: result.publicId,
    type: fileType,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype
  };
};

export const uploadAvatar = async (file) => {
  const result = await uploadBufferToCloudinary(file.buffer, 'connexta/avatars', 'image');
  
  return {
    url: result.url,
    publicId: result.publicId
  };
};

export const uploadMultipleFiles = async (files, folder = 'connexta/files') => {
  const uploadPromises = files.map(file => uploadFile(file, folder));
  const results = await Promise.all(uploadPromises);
  return results;
};

export const deleteFile = async (publicId) => {
  const result = await deleteFromCloudinary(publicId);
  return result;
};

const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf' || 
      mimeType.includes('document') || 
      mimeType.includes('spreadsheet') ||
      mimeType === 'text/plain') {
    return 'document';
  }
  return 'other';
};
