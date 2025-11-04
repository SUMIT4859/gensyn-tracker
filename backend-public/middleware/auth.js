// backend-public/middleware/auth.js
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || req.query.token || req.headers['x-access-token'];
  const token = header ? header.split(" ")[1] || header : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;
