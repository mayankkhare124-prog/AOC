const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { clean, isValidEmail, isHoneypotTripped } = require('../utils/sanitize');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (isHoneypotTripped(req.body)) {
      return res.status(201).json({ success: true, data: {} });
    }

    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 150).toLowerCase();
    const subject = clean(req.body.subject, 150);
    const message = clean(req.body.message, 2000);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const doc = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ success: true, data: doc });
  })
);

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const re = new RegExp(clean(req.query.search, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }, { subject: re }];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const [docs, total] = await Promise.all([
      ContactMessage.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      ContactMessage.countDocuments(filter),
    ]);
    res.json({ success: true, count: docs.length, total, page, pages: Math.ceil(total / limit), data: docs });
  })
);

// Only the moderation status is editable here — never the message content itself.
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const allowed = ['new', 'read', 'replied'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}.` });
    }
    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: doc });
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: {} });
  })
);

module.exports = router;
