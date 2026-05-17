function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    data,
    requestId: res.req.requestId
  });
}

function paginationResponse(res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json({
    data,
    pagination: {
      limit: pagination.limit,
      offset: pagination.offset,
      total: pagination.total
    },
    requestId: res.req.requestId
  });
}

function errorResponse({ code, message, details = [], requestId }) {
  return {
    error: {
      code,
      message,
      details,
      requestId
    }
  };
}

module.exports = {
  successResponse,
  paginationResponse,
  errorResponse
};
