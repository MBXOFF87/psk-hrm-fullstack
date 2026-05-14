const { dbFindOne } = require('./db');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await dbFindOne('users', { _id: req.session.userId });
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!roles.includes(user.role) && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.user = user;
    next();
  };
}

function attachUser(req, res, next) {
  if (req.session?.userId) {
    dbFindOne('users', { _id: req.session.userId })
      .then(u => { req.user = u; next(); })
      .catch(() => next());
  } else {
    next();
  }
}

module.exports = { requireAuth, requireRole, attachUser };
