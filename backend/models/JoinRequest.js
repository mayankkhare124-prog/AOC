const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    branch: { type: String, default: '' },
    year: { type: String, default: '' },
    reason: { type: String, default: '' },
    experience: { type: String, default: '' },
    introVideoUrl: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    status: { type: String, enum: ['new', 'reviewed', 'accepted', 'rejected'], default: 'new' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);
