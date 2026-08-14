const express = require('express');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { clean, isValidEmail, isValidPhone, isHoneypotTripped } = require('../utils/sanitize');

const router = express.Router();

/**
 * Roll an Event's seatsTaken counter back by one. Used when a registration
 * attempt fails after the seat was reserved (duplicate email) and when an
 * admin cancels/deletes a registration, so seatsTaken never drifts from
 * reality.
 */
async function releaseSeat(eventId) {
  await Event.findByIdAndUpdate(eventId, { $inc: { seatsTaken: -1 } });
}

// POST /api/registrations — public, from the event registration form
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (isHoneypotTripped(req.body)) {
      // Look successful to the bot, do nothing.
      return res.status(201).json({ success: true, data: {} });
    }

    const event = clean(req.body.event, 100);
    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 150).toLowerCase();
    const phone = clean(req.body.phone, 20);
    const college = clean(req.body.college, 150);
    const department = clean(req.body.department, 100);
    const year = clean(req.body.year, 20);
    const message = clean(req.body.message, 1000);

    if (!event || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and event are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
    }

    const eventDoc = await Event.findById(event).catch(() => null);
    if (!eventDoc) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (!eventDoc.registrationEnabled) {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event.' });
    }

    // Atomic capacity check-and-reserve: this single findOneAndUpdate only
    // matches (and only then increments seatsTaken) if there's still room,
    // so two concurrent requests can't both read "capacity OK" and both
    // succeed past the limit — MongoDB evaluates the filter and applies the
    // update as one atomic operation per document.
    let reservedEvent = null;
    if (eventDoc.registrationLimit > 0) {
      reservedEvent = await Event.findOneAndUpdate(
        {
          _id: event,
          $expr: { $lt: [{ $ifNull: ['$seatsTaken', 0] }, '$registrationLimit'] },
        },
        { $inc: { seatsTaken: 1 } },
        { new: true }
      );
      if (!reservedEvent) {
        return res.status(400).json({ success: false, message: 'Registration limit reached for this event.' });
      }
    } else {
      // Unlimited capacity — still track seatsTaken for reporting, just without a ceiling.
      reservedEvent = await Event.findByIdAndUpdate(event, { $inc: { seatsTaken: 1 } }, { new: true });
    }

    try {
      const reg = await Registration.create({ event, name, email, phone, college, department, year, message });
      return res.status(201).json({ success: true, data: reg });
    } catch (err) {
      // The unique (event, email) index is what actually catches duplicates —
      // release the seat we reserved above since this registration didn't happen.
      await releaseSeat(event);
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'You have already registered for this event.' });
      }
      throw err;
    }
  })
);

// GET /api/registrations — admin only, with search/status/pagination
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.event) filter.event = req.query.event;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const re = new RegExp(clean(req.query.search, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const [regs, total] = await Promise.all([
      Registration.find(filter)
        .populate('event', 'title date slug')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Registration.countDocuments(filter),
    ]);
    res.json({ success: true, count: regs.length, total, page, pages: Math.ceil(total / limit), data: regs });
  })
);

// GET /api/registrations/export — admin only, CSV
router.get(
  '/export',
  protect,
  asyncHandler(async (req, res) => {
    const regs = await Registration.find().populate('event', 'title').sort('-createdAt');
    const header = 'Name,Email,Phone,College,Department,Year,Event,Status,Registered At\n';
    const rows = regs
      .map((r) =>
        [
          r.name,
          r.email,
          r.phone,
          r.college,
          r.department,
          r.year,
          r.event ? r.event.title : '',
          r.status,
          r.createdAt.toISOString(),
        ]
          .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aoc-registrations.csv"');
    res.send(header + rows);
  })
);

// Admin can update status (registered/attended/cancelled) — nothing else on
// this record is writable via this route (name/email/etc. came from the
// registrant and shouldn't be admin-editable here).
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const allowed = ['registered', 'attended', 'cancelled'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}.` });
    }
    const existing = await Registration.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found.' });

    const wasCancelled = existing.status === 'cancelled';
    const willBeCancelled = req.body.status === 'cancelled';

    existing.status = req.body.status;
    await existing.save();

    // Keep the Event's seatsTaken counter in sync: cancelling frees a seat,
    // un-cancelling (rare, but possible from the admin panel) reserves one back.
    if (!wasCancelled && willBeCancelled) {
      await releaseSeat(existing.event);
    } else if (wasCancelled && !willBeCancelled) {
      await Event.findByIdAndUpdate(existing.event, { $inc: { seatsTaken: 1 } });
    }

    res.json({ success: true, data: existing });
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Not found.' });
    if (reg.status !== 'cancelled') {
      await releaseSeat(reg.event);
    }
    res.json({ success: true, data: {} });
  })
);

module.exports = router;
