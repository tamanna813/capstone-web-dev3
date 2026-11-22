const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { createAccessToken, createRefreshToken } = require('../utils/tokens');
const bcrypt = require('bcryptjs');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters' });
  // Public registration is restricted to student accounts. Admin creates faculty/admin users.
  const user = await User.create({ name, email, password, role: 'student' });
  res.status(201).json({ success: true, message: 'Student registered successfully', data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokenHash');
  if (!user || !user.isActive || !(await user.comparePassword(password || ''))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();
  res.json({ success: true, data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required' });
  let payload;
  try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); }
  if (payload.type !== 'refresh') return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) return res.status(401).json({ success: false, message: 'Refresh token revoked' });
  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await user.save();
  res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
});

exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshTokenHash');
  user.refreshTokenHash = undefined;
  await user.save();
  res.json({ success: true, message: 'Logged out. Refresh token invalidated.' });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});
