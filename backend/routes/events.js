const express = require('express');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const asyncHandler = require('../utils/asyncHandler');
const crudFactory = require('../utils/crudFactory');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();
const EVENT_ALLOWED_FIELDS = [
  'title', 'description', 'date', 'time', 'venue', 'category', 'speaker', 'agenda',
  'posterImage', 'registrationEnabled', 'registrationLink', 'registrationLimit',
  'statusOverride', 'featured', 'published',
];
const handlers = crudFactory(Event, {
  publicFilter: { published: true },
  defaultSort: 'date',
  allowedFields: EVENT_ALLOWED_FIELDS,
});

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const filter = req.admin ? {} : { published: true };
    let events = await Event.find(filter).sort('date');

    if (req.query.status === 'upcoming') {
      events = events.filter((e) => e.status === 'upcoming');
    } else if (req.query.status === 'past') {
      events = events.filter((e) => e.status === 'past');
    }

    // Attach public registration counts (cheap at club scale; avoids exposing registrant data).
    const counts = await Promise.all(
      events.map((e) => Registration.countDocuments({ event: e._id, status: { $ne: 'cancelled' } }))
    );
    const data = events.map((e, i) => {
      const obj = e.toObject();
      obj.registeredCount = counts[i];
      obj.spotsLeft = e.registrationLimit > 0 ? Math.max(e.registrationLimit - counts[i], 0) : null;
      return obj;
    });

    res.json({ success: true, count: data.length, data });
  })
);

router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const event = await Event.findOne({ slug: req.params.slug, published: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const related = await Event.find({ _id: { $ne: event._id }, published: true })
      .sort('date')
      .limit(3);

    // Public registration count — used for the "X / capacity registered" display.
    // Only the count is exposed publicly; registrant details stay admin-only.
    const registeredCount = await Registration.countDocuments({
      event: event._id,
      status: { $ne: 'cancelled' },
    });

    const eventData = event.toObject();
    eventData.registeredCount = registeredCount;
    eventData.spotsLeft =
      event.registrationLimit > 0 ? Math.max(event.registrationLimit - registeredCount, 0) : null;

    res.json({ success: true, data: eventData, related });
  })
);

router.get('/:id', optionalAuth, handlers.getOne);
router.post('/', protect, handlers.create);
router.put('/:id', protect, handlers.update);
router.delete('/:id', protect, handlers.remove);

module.exports = router;
