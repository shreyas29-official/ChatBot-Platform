const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  systemPrompt: {
    type: String,
    default: 'You are a helpful assistant.'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);