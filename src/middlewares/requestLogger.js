const { logger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const endedAt = process.hrtime.bigint();
    const latencyMs = Number(endedAt - startedAt) / 1_000_000;

    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      latencyMs: Number(latencyMs.toFixed(2)),
      actorId: req.user?.id || null
    });
  });

  next();
}

module.exports = {
  requestLogger
};
