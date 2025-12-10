import * as messageService from '../services/messageService.js';
import { emitToChannel, emitToDM } from '../utils/socketManager.js';
import { getDMRoomId } from '../services/channelService.js';

export const createMessage = async (req, res, next) => {
  try {
    const { channelId, content, attachments = [], isDm = false, recipientId } = req.body;
    
    const message = await messageService.createMessage({
      channelId,
      senderId: req.user._id,
      content,
      attachments,
      isDm,
      recipientId
    });
    
    const io = req.app.get('io');
    
    if (isDm && recipientId) {
      const dmRoomId = getDMRoomId(req.user._id, recipientId);
      emitToDM(io, dmRoomId, 'message:new', message);
    } else if (channelId) {
      emitToChannel(io, channelId, 'message:new', message);
    }
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await messageService.getChannelMessages(channelId, parseInt(page), parseInt(limit));
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDMMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await messageService.getDMMessages(req.user._id, userId, parseInt(page), parseInt(limit));
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    
    await messageService.deleteMessage(messageId, req.user._id);
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    if (error.message === 'Message not found' || error.message === 'Not authorized to delete this message') {
      return res.status(error.message === 'Message not found' ? 404 : 403).json({ message: error.message });
    }
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    const message = await messageService.editMessage(messageId, req.user._id, content);
    
    res.json({ message });
  } catch (error) {
    if (error.message === 'Message not found' || error.message === 'Not authorized to edit this message') {
      return res.status(error.message === 'Message not found' ? 404 : 403).json({ message: error.message });
    }
    next(error);
  }
};
