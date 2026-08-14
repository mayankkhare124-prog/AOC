const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    speaker: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Public Speaking', 'Debate', 'Table Topics', 'Leadership', 'Interview Skills', 'Networking', 'General'],
      default: 'General',
    },
    thumbnail: { type: String, default: '' },
    videoUrl: { type: String, default: '' }, // youtube / vimeo / mp4 — resolved client-side
    duration: { type: String, default: '' }, // e.g. "24 min"
    resources: [{ label: String, url: String }],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SessionSchema.index({ date: -1 });

module.exports = mongoose.model('Session', SessionSchema);
