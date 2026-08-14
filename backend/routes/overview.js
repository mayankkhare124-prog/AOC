const express = require('express');
const Event = require('../models/Event');
const Session = require('../models/Session');
const Registration = require('../models/Registration');
const JoinRequest = require('../models/JoinRequest');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/overview — admin dashboard summary cards
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const [allEvents, sessions, registrations, joinRequests, contactMessages] = await Promise.all([
      Event.find(),
      Session.countDocuments(),
      Registration.countDocuments(),
      JoinRequest.countDocuments({ status: 'new' }),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);
    const upcoming = allEvents.filter((e) => e.status === 'upcoming').length;

    res.json({
      success: true,
      data: {
        totalEvents: allEvents.length,
        upcomingEvents: upcoming,
        totalSessions: sessions,
        totalRegistrations: registrations,
        newJoinRequests: joinRequests,
        newContactMessages: contactMessages,
      },
    });
  })
);

module.exports = router;
