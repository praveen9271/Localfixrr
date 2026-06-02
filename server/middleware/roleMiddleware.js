import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Provider from '../models/Provider.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'localfixr-dev-secret';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      if (!req.user.isActive || req.user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Account is blocked or inactive' });
      }
      if (req.user.role === 'service_provider') {
        let provider = await Provider.findOne({ user: req.user._id });
        if (!provider) {
          // Auto-create provider profile if it doesn't exist
          provider = await Provider.create({
            user: req.user._id,
            businessName: `${req.user.name}'s Services`,
            serviceAreas: [req.user.address].filter(Boolean),
          });
          req.user.providerProfile = provider._id;
          await req.user.save();
        }
        req.provider = provider;
      }
      return next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Restrict to admin only
const adminOnly = (req, res, next) => {
  const configuredAdminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const userEmail = String(req.user?.email || '').trim().toLowerCase();

  if (req.user && req.user.role === 'admin' && (!configuredAdminEmail || userEmail === configuredAdminEmail)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
};

// Restrict to service provider only
const providerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'service_provider') {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Service provider only.' });
  }
};

// Restrict to user only (regular customers)
const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. User only.' });
  }
};

const authenticateUser = protect;

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for this account role' });
  }

  return next();
};

// Allow admin or service provider
const adminOrProvider = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'service_provider')) {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin or Service Provider only.' });
  }
};

export { protect, authenticateUser, authorizeRoles, adminOnly, providerOnly, userOnly, adminOrProvider };
