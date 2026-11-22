const jwt = require('jsonwebtoken');

function createAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m'
  });
}
function createRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d'
  });
}
module.exports = { createAccessToken, createRefreshToken };
