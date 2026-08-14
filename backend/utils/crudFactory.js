const asyncHandler = require('./asyncHandler');
const { pickFields } = require('./sanitize');

/**
 * Generates standard CRUD handlers for a Mongoose model.
 *
 * publicFilter:   extra filter applied on public (non-admin) GET requests,
 *                 e.g. { published: true } — also enforced on getOne so an
 *                 unpublished/draft record can't be fetched by guessing its
 *                 ID.
 * allowedFields:  whitelist of field names accepted on create/update. If
 *                 omitted, all fields are accepted (kept optional so this
 *                 factory doesn't silently break a resource nobody's
 *                 whitelisted yet — every resource route in this project
 *                 does pass one).
 */
function crudFactory(Model, { publicFilter = {}, defaultSort = '-createdAt', populate = null, allowedFields = null } = {}) {
  const getAll = asyncHandler(async (req, res) => {
    const isAdmin = !!req.admin;
    const filter = isAdmin ? {} : publicFilter;
    let query = Model.find(filter).sort(defaultSort);
    if (populate) query = query.populate(populate);
    const docs = await query;
    res.json({ success: true, count: docs.length, data: docs });
  });

  const getOne = asyncHandler(async (req, res) => {
    const isAdmin = !!req.admin;
    // Non-admins are bound by the same publicFilter as the list endpoint —
    // e.g. { published: true } — so an unpublished record can't be read by
    // ID alone. Admins (protect/optionalAuth already verified) see everything.
    const filter = isAdmin ? { _id: req.params.id } : { _id: req.params.id, ...publicFilter };
    let query = Model.findOne(filter);
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: doc });
  });

  const create = asyncHandler(async (req, res) => {
    const payload = allowedFields ? pickFields(req.body, allowedFields) : req.body;
    const doc = await Model.create(payload);
    res.status(201).json({ success: true, data: doc });
  });

  const update = asyncHandler(async (req, res) => {
    const payload = allowedFields ? pickFields(req.body, allowedFields) : req.body;
    const doc = await Model.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: doc });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: {} });
  });

  return { getAll, getOne, create, update, remove };
}

module.exports = crudFactory;
