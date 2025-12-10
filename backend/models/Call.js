import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['channel', 'dm'],
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  dmRoomId: {
    type: String
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

callSchema.index({ channel: 1, isActive: 1 });
callSchema.index({ dmRoomId: 1, isActive: 1 });

const Call = mongoose.model('Call', callSchema);

export default Call;
