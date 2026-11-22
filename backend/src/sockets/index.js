const jwt = require('jsonwebtoken');
const User = require('../models/User');

function configureSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('Invalid user'));
      socket.user = user;
      next();
    } catch { next(new Error('Invalid or expired socket token')); }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.user._id}`);
    if (socket.user.role === 'faculty' || socket.user.role === 'admin') socket.join(`faculty:${socket.user._id}`);
    socket.emit('connection:ready', { userId: socket.user._id, role: socket.user.role });
    socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.user.email}`));
  });
}
module.exports = configureSockets;
