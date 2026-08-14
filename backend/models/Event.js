const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    time: { type: String, default: '' },
    venue: { type: String, default: '' },
    category: { type: String, default: 'General' },
    speaker: { type: String, default: '' },
    agenda: { type: String, default: '' },
    posterImage: { type: String, default: '' },
    registrationEnabled: { type: Boolean, default: true },
    registrationLink: { type: String, default: '' },
    registrationLimit: { type: Number, default: 0 }, // 0 = unlimited
    // Atomic seat counter — incremented via findOneAndUpdate at registration
    // time (see routes/registrations.js) so concurrent submissions can't both
    // pass a "capacity OK?" check before either has actually reserved a seat.
    // Decremented when a registration is cancelled/deleted so it stays in
    // sync with the real Registration collection.
    seatsTaken: { type: Number, default: 0, min: 0 },
    // statusOverride lets admin force "upcoming"/"past" instead of date-based calc
    statusOverride: { type: String, enum: ['auto', 'upcoming', 'past'], default: 'auto' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EventSchema.index({ date: -1 });

// Virtual: computed status based on date unless overridden
EventSchema.virtual('status').get(function () {
  if (this.statusOverride && this.statusOverride !== 'auto') return this.statusOverride;
  return this.date && this.date.getTime() > Date.now() ? 'upcoming' : 'past';
});

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

EventSchema.pre('validate', async function (next) {
  if (this.isModified('title') || !this.slug) {
    let base = slugify(this.title || 'event');
    let slug = base;
    let i = 1;
    const Event = mongoose.model('Event');
    // ensure uniqueness
    while (await Event.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${i++}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
