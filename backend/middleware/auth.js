// ─────────────────────────────────────────────────────
// JACKOT — Auth Middleware
// Protects every route — checks user is logged in
// ─────────────────────────────────────────────────────

const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error:   'Not authorized. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error:   'Token is invalid or expired. Please log in again.',
      });
    }

    // Attach user to request so routes can use it
    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};

module.exports = { protect };