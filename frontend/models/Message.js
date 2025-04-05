import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['sent', 'received', 'error'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);