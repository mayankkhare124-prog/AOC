const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — public (footer/social links, stats, hero video)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) settings = await SiteSettings.create({ key: 'main' });
    res.json({ success: true, data: settings });
  })
);

// PUT /api/settings — admin only
router.put(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const settings = await SiteSettings.findOneAndUpdate({ key: 'main' }, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    res.json({ success: true, data: settings });
  })
);

module.exports = router;
