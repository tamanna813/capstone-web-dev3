const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authentication token required' });
  let payload;
  try { payload = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET); }
  catch { return res.status(401).json({ success: false, message: 'Invalid or expired access token' }); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User account is unavailable' });
  req.user = user;
  next();
});
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
  next();
};
module.exports = { protect, authorize };
