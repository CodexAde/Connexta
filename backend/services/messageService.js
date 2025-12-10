import Message from '../models/Message.js';
import { getDMRoomId } from './channelService.js';

export const createMessage = async ({ channelId, senderId, content, attachments = [], isDm = false, recipientId = null }) => {
  const messageData = {
    sender: senderId,
    content,
    attachments,
    isDm
  };
  
  if (isDm && recipientId) {
    messageData.dmRoomId = getDMRoomId(senderId, recipientId);
    messageData.dmParticipants = [senderId, recipientId];
  } else if (channelId) {
    messageData.channel = channelId;
  }
  
  const message = new Message(messageData);
  await message.save();
  
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email department avatarUrl');
  
  return populatedMessage;
};

export const getChannelMessages = async (channelId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  
  const messages = await Message.find({
    channel: channelId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name email department avatarUrl');
  
  const total = await Message.countDocuments({ channel: channelId, isDeleted: false });
  
  return {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getDMMessages = async (user1Id, user2Id, page = 1, limit = 50) => {
  const dmRoomId = getDMRoomId(user1Id, user2Id);
  const skip = (page - 1) * limit;
  
  const messages = await Message.find({
    dmRoomId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name email department avatarUrl');
  
  const total = await Message.countDocuments({ dmRoomId, isDeleted: false });
  
  return {
    messages: messages.reverse(),
    dmRoomId,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.sender.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this message');
  }
  
  message.isDeleted = true;
  await message.save();
  
  return message;
};

export const editMessage = async (messageId, userId, newContent) => {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.sender.toString() !== userId.toString()) {
    throw new Error('Not authorized to edit this message');
  }
  
  message.content = newContent;
  message.isEdited = true;
  await message.save();
  
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email department avatarUrl');
  
  return populatedMessage;
};
