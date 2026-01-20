const jwt = require("jsonwebtoken");

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
};

const signToken = (payload, options = {}) => {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d", ...options });
};

const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = { signToken, verifyToken };
