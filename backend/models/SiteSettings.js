const mongoose = require('mongoose');

// Singleton document — always fetched/updated by a fixed key
const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    social: {
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
      mits: { type: String, default: '' },
    },
    stats: {
      voicesTrained: { type: Number, default: 0 },
      sessionsHeld: { type: Number, default: 0 },
      yearsRunning: { type: Number, default: 0 },
      eventsHosted: { type: Number, default: 0 },
      membersCount: { type: Number, default: 0 },
    },
    heroVideoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
