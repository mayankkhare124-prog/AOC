const express = require('express');
const JoinRequest = require('../models/JoinRequest');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { clean, isValidEmail, isValidPhone, isValidURLOrEmpty, isHoneypotTripped } = require('../utils/sanitize');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Honeypot: a hidden "website" field real visitors never fill in. Bots that
    // blindly fill every input trip it — we accept the request but drop it
    // silently so the bot doesn't learn its submission was rejected.
    if (isHoneypotTripped(req.body)) {
      return res.status(201).json({ success: true, data: {} });
    }

    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 150).toLowerCase();
    const phone = clean(req.body.phone, 20);
    const branch = clean(req.body.branch, 100);
    const year = clean(req.body.year, 20);
    const reason = clean(req.body.reason, 1000);
    const experience = clean(req.body.experience, 1000);
    const introVideoUrl = clean(req.body.introVideoUrl, 500);
    const instagram = clean(req.body.instagram, 300);
    const linkedin = clean(req.body.linkedin, 300);

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
    }
    if (!isValidURLOrEmpty(instagram) || !isValidURLOrEmpty(linkedin) || !isValidURLOrEmpty(introVideoUrl)) {
      return res.status(400).json({ success: false, message: 'Links (Instagram, LinkedIn, Intro Video) must be valid URLs (starting with http:// or https://).' });
    }

    const doc = await JoinRequest.create({ name, email, phone, branch, year, reason, experience, introVideoUrl, instagram, linkedin });
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
      filter.$or = [{ name: re }, { email: re }, { branch: re }];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const [docs, total] = await Promise.all([
      JoinRequest.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      JoinRequest.countDocuments(filter),
    ]);
    res.json({ success: true, count: docs.length, total, page, pages: Math.ceil(total / limit), data: docs });
  })
);

// Only the moderation status is editable by admins here — the applicant's
// own submitted fields (name/email/etc.) are never accepted from req.body.
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const allowed = ['new', 'reviewed', 'accepted', 'rejected'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}.` });
    }
    const doc = await JoinRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: doc });
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const doc = await JoinRequest.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: {} });
  })
);

module.exports = router;
