const crypto = require('node:crypto');

function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}

function requestId(req, res, next) {
  const incomingRequestId = req.get('X-Request-Id');
  const currentRequestId = incomingRequestId || createRequestId();

  req.requestId = currentRequestId;
  res.setHeader('X-Request-Id', currentRequestId);

  next();
}

module.exports = {
  requestId
};
