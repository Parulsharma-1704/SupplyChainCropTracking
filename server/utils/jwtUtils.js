import jwt from 'jsonwebtoken';

// Create token
export const generateToken = (userId, role) =>
  jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

// Verify token
export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

// Get token from header
export const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  return auth && auth.startsWith('Bearer ')
    ? auth.split(' ')[1]
    : null;
};
