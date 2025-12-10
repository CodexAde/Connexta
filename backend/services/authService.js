import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getChannelsForDepartment } from '../utils/departmentLogic.js';
import Channel from '../models/Channel.js';

export const registerUser = async ({ name, email, password, department, avatarUrl }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const channelSlugs = getChannelsForDepartment(department);
  const channels = await Channel.find({ slug: { $in: channelSlugs } });
  const channelIds = channels.map(c => c._id);
  
  const roles = {
    isAdmin: department === 'Admin',
    isDirector: department === 'Directors'
  };
  
  const user = new User({
    name,
    email,
    passwordHash,
    department,
    avatarUrl: avatarUrl || '',
    roles,
    channels: channelIds
  });
  
  await user.save();
  
  await Channel.updateMany(
    { _id: { $in: channelIds } },
    { $addToSet: { members: user._id } }
  );
  
  const token = generateToken(user._id);
  
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    channels: channelIds
  };
  
  return { user: userResponse, token };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).populate('channels', 'name slug type');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken(user._id);
  
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    channels: user.channels
  };
  
  return { user: userResponse, token };
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
