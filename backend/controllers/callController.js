import * as callService from '../services/callService.js';
import { emitToChannel, emitToDM } from '../utils/socketManager.js';
import { getDMRoomId } from '../services/channelService.js';

export const createCall = async (req, res, next) => {
  try {
    const { type, channelId, recipientId } = req.body;
    
    const call = await callService.createCall({
      type,
      channelId,
      startedById: req.user._id,
      recipientId
    });
    
    const io = req.app.get('io');
    
    if (type === 'channel' && channelId) {
      emitToChannel(io, channelId, 'call:started', call);
    } else if (type === 'dm' && recipientId) {
      const dmRoomId = getDMRoomId(req.user._id, recipientId);
      emitToDM(io, dmRoomId, 'call:started', call);
    }
    
    res.status(201).json({ call });
  } catch (error) {
    next(error);
  }
};

export const getActiveCall = async (req, res, next) => {
  try {
    const { channelId, userId } = req.query;
    
    let call;
    if (channelId) {
      call = await callService.getActiveCallForChannel(channelId);
    } else if (userId) {
      call = await callService.getActiveCallForDM(req.user._id, userId);
    }
    
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

export const joinCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    const call = await callService.joinCall(callId, req.user._id);
    
    const io = req.app.get('io');
    
    if (call.type === 'channel' && call.channel) {
      emitToChannel(io, call.channel.toString(), 'call:user-joined', {
        callId: call._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
          avatarUrl: req.user.avatarUrl
        }
      });
    } else if (call.type === 'dm' && call.dmRoomId) {
      emitToDM(io, call.dmRoomId, 'call:user-joined', {
        callId: call._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
          avatarUrl: req.user.avatarUrl
        }
      });
    }
    
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

export const leaveCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    const call = await callService.leaveCall(callId, req.user._id);
    
    const io = req.app.get('io');
    
    if (call.type === 'channel' && call.channel) {
      emitToChannel(io, call.channel.toString(), 'call:user-left', {
        callId: call._id,
        userId: req.user._id
      });
    } else if (call.type === 'dm' && call.dmRoomId) {
      emitToDM(io, call.dmRoomId, 'call:user-left', {
        callId: call._id,
        userId: req.user._id
      });
    }
    
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

export const endCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    
    const call = await callService.endCall(callId);
    
    const io = req.app.get('io');
    
    if (call.type === 'channel' && call.channel) {
      emitToChannel(io, call.channel.toString(), 'call:ended', { callId: call._id });
    } else if (call.type === 'dm' && call.dmRoomId) {
      emitToDM(io, call.dmRoomId, 'call:ended', { callId: call._id });
    }
    
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

export const getUserCalls = async (req, res, next) => {
  try {
    const calls = await callService.getUserActiveCalls(req.user._id);
    res.json({ calls });
  } catch (error) {
    next(error);
  }
};
