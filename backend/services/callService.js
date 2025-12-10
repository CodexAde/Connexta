import Call from '../models/Call.js';
import { getDMRoomId } from './channelService.js';

export const createCall = async ({ type, channelId, startedById, participantIds = [], recipientId = null }) => {
  const callData = {
    type,
    startedBy: startedById,
    participants: [startedById, ...participantIds],
    isActive: true,
    startedAt: new Date()
  };
  
  if (type === 'channel') {
    callData.channel = channelId;
  } else if (type === 'dm' && recipientId) {
    callData.dmRoomId = getDMRoomId(startedById, recipientId);
    if (!callData.participants.includes(recipientId)) {
      callData.participants.push(recipientId);
    }
  }
  
  const call = new Call(callData);
  await call.save();
  
  const populatedCall = await Call.findById(call._id)
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl');
  
  return populatedCall;
};

export const getActiveCallForChannel = async (channelId) => {
  const call = await Call.findOne({ channel: channelId, isActive: true })
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl');
  
  return call;
};

export const getActiveCallForDM = async (user1Id, user2Id) => {
  const dmRoomId = getDMRoomId(user1Id, user2Id);
  
  const call = await Call.findOne({ dmRoomId, isActive: true })
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl');
  
  return call;
};

export const joinCall = async (callId, userId) => {
  const call = await Call.findByIdAndUpdate(
    callId,
    { $addToSet: { participants: userId } },
    { new: true }
  )
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl');
  
  return call;
};

export const leaveCall = async (callId, userId) => {
  const call = await Call.findById(callId);
  
  if (!call) {
    throw new Error('Call not found');
  }
  
  call.participants = call.participants.filter(
    p => p.toString() !== userId.toString()
  );
  
  if (call.participants.length === 0) {
    call.isActive = false;
    call.endedAt = new Date();
    call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
  }
  
  await call.save();
  
  const populatedCall = await Call.findById(call._id)
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl');
  
  return populatedCall;
};

export const endCall = async (callId) => {
  const call = await Call.findByIdAndUpdate(
    callId,
    {
      isActive: false,
      endedAt: new Date()
    },
    { new: true }
  );
  
  if (call) {
    call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
    await call.save();
  }
  
  return call;
};

export const getUserActiveCalls = async (userId) => {
  const calls = await Call.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name email avatarUrl')
    .populate('startedBy', 'name email avatarUrl')
    .populate('channel', 'name slug');
  
  return calls;
};
