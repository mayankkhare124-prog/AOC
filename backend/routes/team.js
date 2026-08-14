const express = require('express');
const TeamMember = require('../models/TeamMember');
const crudFactory = require('../utils/crudFactory');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();
const TEAM_ALLOWED_FIELDS = [
  'name', 'role', 'quote', 'imageUrl', 'instagram', 'linkedin', 'order', 'published',
];
const h = crudFactory(TeamMember, {
  publicFilter: { published: true },
  defaultSort: 'order -createdAt',
  allowedFields: TEAM_ALLOWED_FIELDS,
});

router.get('/', optionalAuth, (req, res, next) => h.getAll(req, res, next));
router.get('/:id', optionalAuth, h.getOne);
router.post('/', protect, h.create);
router.put('/:id', protect, h.update);
router.delete('/:id', protect, h.remove);

module.exports = router;
