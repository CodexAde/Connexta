import * as authService from '../services/authService.js';
import * as uploadService from '../services/uploadService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;
    
    let avatarUrl = '';
    if (req.file) {
      const uploadResult = await uploadService.uploadAvatar(req.file);
      avatarUrl = uploadResult.url;
    }
    
    const result = await authService.registerUser({
      name,
      email,
      password,
      department,
      avatarUrl
    });
    
    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.message === 'Email already registered') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
