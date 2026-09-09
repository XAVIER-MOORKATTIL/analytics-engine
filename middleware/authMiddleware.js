const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature against environment secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user context without returning hashed password
      req.user = await User.findById(decoded.id).select('-password');

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token payload missing' });
  }
};

module.exports = { protect };