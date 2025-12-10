import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['default', 'department', 'directors', 'dm', 'custom'],
    default: 'custom'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

channelSchema.index({ type: 1 });
channelSchema.index({ members: 1 });

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
