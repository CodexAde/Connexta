import Channel from '../models/Channel.js';
import User from '../models/User.js';
import { getDefaultChannels, canAccessChannel } from '../utils/departmentLogic.js';

export const initializeDefaultChannels = async () => {
  const defaultChannels = getDefaultChannels();
  
  for (const channelData of defaultChannels) {
    const existing = await Channel.findOne({ slug: channelData.slug });
    if (!existing) {
      await Channel.create(channelData);
      console.log(`Created default channel: ${channelData.name}`);
    }
  }
};

export const getChannelsForUser = async (user) => {
  const channels = await Channel.find({
    $or: [
      { members: user._id },
      { isDefault: true }
    ]
  }).populate('members', 'name avatarUrl status');
  
  const accessibleChannels = channels.filter(channel => canAccessChannel(user, channel));
  
  return accessibleChannels;
};

export const getChannelById = async (channelId, user) => {
  const channel = await Channel.findById(channelId)
    .populate('members', 'name email department avatarUrl status');
  
  if (!channel) {
    throw new Error('Channel not found');
  }
  
  if (!canAccessChannel(user, channel)) {
    throw new Error('Access denied to this channel');
  }
  
  return channel;
};

export const createChannel = async (channelData, creatorId) => {
  const slug = channelData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const existing = await Channel.findOne({ slug });
  if (existing) {
    throw new Error('Channel with this name already exists');
  }
  
  const channel = new Channel({
    ...channelData,
    slug,
    createdBy: creatorId,
    members: [creatorId]
  });
  
  await channel.save();
  
  await User.findByIdAndUpdate(creatorId, {
    $addToSet: { channels: channel._id }
  });
  
  return channel;
};

export const getDMChannel = async (user1Id, user2Id) => {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  const dmSlug = `dm-${sortedIds[0]}-${sortedIds[1]}`;
  
  let channel = await Channel.findOne({ slug: dmSlug, type: 'dm' })
    .populate('members', 'name email department avatarUrl status');
  
  if (!channel) {
    channel = await Channel.create({
      name: 'Direct Message',
      slug: dmSlug,
      type: 'dm',
      members: [user1Id, user2Id],
      isDefault: false
    });
    
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $addToSet: { channels: channel._id } }
    );
    
    channel = await Channel.findById(channel._id)
      .populate('members', 'name email department avatarUrl status');
  }
  
  return channel;
};

export const getDMRoomId = (user1Id, user2Id) => {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  return `dm-${sortedIds[0]}-${sortedIds[1]}`;
};

export const getUserDMChannels = async (userId) => {
  const channels = await Channel.find({
    type: 'dm',
    members: userId
  }).populate('members', 'name email department avatarUrl status');
  
  return channels;
};

export const joinChannel = async (channelId, userId) => {
  const channel = await Channel.findByIdAndUpdate(
    channelId,
    { $addToSet: { members: userId } },
    { new: true }
  );
  
  await User.findByIdAndUpdate(userId, {
    $addToSet: { channels: channelId }
  });
  
  return channel;
};
