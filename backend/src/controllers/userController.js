const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const filter = req.query.role ? { role: req.query.role } : {};
  const [users, total] = await Promise.all([
    User.find(filter).select('name email role isActive createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['admin', 'faculty', 'student'].includes(role)) return res.status(400).json({ success: false, message: 'Valid role is required' });
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
exports.updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'isActive', 'role'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('name email role isActive');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deleted' });
});
