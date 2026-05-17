const { AuthError } = require('../utils/errors');
const { AuthService } = require('../services/AuthService');

const authService = new AuthService();

function extractBearerToken(req) {
  const authorization = req.get('authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function requireAuth(req, res, next) {
  try {
    if (req.user) {
      next();
      return;
    }

    const token = extractBearerToken(req);

    if (!token) {
      next(new AuthError('Authentication required.'));
      return;
    }

    req.user = await authService.getCurrentUserFromToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
  extractBearerToken
};
