import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Admin', 'Tech', 'Marketing', 'Finance', 'HR', 'Directors', 'Operations', 'Sales']
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  roles: {
    isAdmin: {
      type: Boolean,
      default: false
    },
    isDirector: {
      type: Boolean,
      default: false
    }
  },
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  }
}, {
  timestamps: true
});

userSchema.index({ name: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);

export default User;
