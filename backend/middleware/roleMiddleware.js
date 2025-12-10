import { canAccessChannel } from '../utils/departmentLogic.js';
import Channel from '../models/Channel.js';

export const checkDirectorAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.department === 'Admin' || user.department === 'Directors' || user.roles?.isDirector) {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. Directors only.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const checkChannelAccess = async (req, res, next) => {
  try {
    const channelId = req.params.channelId || req.body.channelId;
    
    if (!channelId) {
      return next();
    }
    
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    if (!canAccessChannel(req.user, channel)) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }
    
    req.channel = channel;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const checkAdmin = (req, res, next) => {
  if (req.user.department === 'Admin' || req.user.roles?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};
