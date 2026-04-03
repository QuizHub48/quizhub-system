const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:{ type: String, required: true },
  content:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String },
  senderRole: { type: String, enum: ['student', 'lecturer', 'admin'] },
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for direct messaging
  recipientRole: { type: String, enum: ['student', 'lecturer', 'admin'] },
  subject:    { type: String, default: '' },
  content:    { type: String, required: true },
  replies:    [replySchema],
  readByRecipient: { type: Boolean, default: false },
  readBySender: { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
