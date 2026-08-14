const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    college: { type: String, default: '' },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, enum: ['registered', 'attended', 'cancelled'], default: 'registered' },
  },
  { timestamps: true }
);

// Prevent the same email registering twice for the same event
RegistrationSchema.index({ event: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
