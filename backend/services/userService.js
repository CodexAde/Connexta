import User from '../models/User.js';

export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('-passwordHash')
    .populate('channels', 'name slug type');
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

export const searchUsers = async (query, currentUserId) => {
  const users = await User.find({
    $and: [
      { _id: { $ne: currentUserId } },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
    .select('name email department avatarUrl')
    .limit(20);
  
  return users;
};

export const getAllUsers = async (currentUserId) => {
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('name email department avatarUrl status')
    .sort({ name: 1 });
  
  return users;
};

export const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = ['name', 'avatarUrl'];
  const filteredUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    userId,
    filteredUpdates,
    { new: true, runValidators: true }
  ).select('-passwordHash');
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

export const updateUserStatus = async (userId, status) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  ).select('-passwordHash');
  
  return user;
};
