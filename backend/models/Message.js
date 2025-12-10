import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'document', 'video', 'audio', 'other'],
    default: 'other'
  },
  fileName: String,
  fileSize: Number,
  mimeType: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  attachments: [attachmentSchema],
  isDm: {
    type: Boolean,
    default: false
  },
  dmParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dmRoomId: {
    type: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ dmRoomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
