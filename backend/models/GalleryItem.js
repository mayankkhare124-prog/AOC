const mongoose = require('mongoose');

const GalleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    category: {
      type: String,
      enum: ['Events', 'Workshops', 'Debates', 'Behind The Scenes', 'Team', 'Community'],
      default: 'Events',
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    caption: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryItem', GalleryItemSchema);
