const { ERROR_CODES, isAppError } = require('../utils/errors');
const { errorResponse } = require('../utils/responses');
const { logger } = require('../utils/logger');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = isAppError(error) ? error.statusCode : 500;
  const code = isAppError(error) ? error.code : ERROR_CODES.INTERNAL_ERROR;
  const message = isAppError(error) ? error.message : 'Internal server error.';
  const details = isAppError(error) ? error.details : [];

  const requestId = error.requestId || req.requestId;

  if (statusCode >= 500) {
    logger.error('request_error', {
      requestId: req.requestId,
      code,
      error
    });
  }

  res.status(statusCode).json(errorResponse({
    code,
    message,
    details,
    requestId
  }));
}

module.exports = {
  errorHandler
};
