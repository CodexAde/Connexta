import * as channelService from '../services/channelService.js';

export const getChannels = async (req, res, next) => {
  try {
    const channels = await channelService.getChannelsForUser(req.user);
    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

export const getChannelById = async (req, res, next) => {
  try {
    const channel = await channelService.getChannelById(req.params.channelId, req.user);
    res.json({ channel });
  } catch (error) {
    if (error.message === 'Channel not found' || error.message === 'Access denied to this channel') {
      return res.status(error.message === 'Channel not found' ? 404 : 403).json({ message: error.message });
    }
    next(error);
  }
};

export const createChannel = async (req, res, next) => {
  try {
    const { name, description, type } = req.body;
    
    const channel = await channelService.createChannel(
      { name, description, type: type || 'custom' },
      req.user._id
    );
    
    res.status(201).json({ channel });
  } catch (error) {
    if (error.message === 'Channel with this name already exists') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getDMChannel = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const channel = await channelService.getDMChannel(req.user._id, userId);
    res.json({ channel });
  } catch (error) {
    next(error);
  }
};

export const getUserDMs = async (req, res, next) => {
  try {
    const channels = await channelService.getUserDMChannels(req.user._id);
    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

export const joinChannel = async (req, res, next) => {
  try {
    const channel = await channelService.joinChannel(req.params.channelId, req.user._id);
    res.json({ channel });
  } catch (error) {
    next(error);
  }
};
