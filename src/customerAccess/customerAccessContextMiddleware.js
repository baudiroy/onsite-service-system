'use strict';

const { buildCustomerAccessContext } = require('./customerAccessContextProvider');
const { createCustomerAccessReadOnlyRepository } = require('./customerAccessReadOnlyRepository');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function contextInputFromRequest(req) {
  return isObject(req) ? req.customerAccessContextInput : undefined;
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
}

function applyCustomerAccessContextToRequest(req, context) {
  if (!isObject(req)) {
    return req;
  }

  const safeContext = isObject(context) ? context : buildCustomerAccessContext();

  req.params = {
    ...objectOrEmpty(req.params),
    ...objectOrEmpty(safeContext.params),
  };
  req.auth = {
    ...objectOrEmpty(req.auth),
    ...objectOrEmpty(safeContext.auth),
  };
  req.channel = {
    ...objectOrEmpty(req.channel),
    ...objectOrEmpty(safeContext.channel),
  };
  req.access = {
    ...objectOrEmpty(req.access),
    ...objectOrEmpty(safeContext.access),
  };
  req.customerVisibleData = objectOrEmpty(safeContext.customerVisibleData);
  req.customerAccessContext = safeContext;

  return req;
}

function buildCustomerAccessContextMiddleware(options) {
  const safeOptions = isObject(options) ? options : {};
  const getInput = typeof safeOptions.getInput === 'function'
    ? safeOptions.getInput
    : contextInputFromRequest;
  const repository = safeOptions.repository || (
    safeOptions.readModel || safeOptions.dataProvider || safeOptions.queryExecutor
      ? createCustomerAccessReadOnlyRepository({
        readModel: safeOptions.readModel,
        dataProvider: safeOptions.dataProvider,
        queryExecutor: safeOptions.queryExecutor,
      })
      : undefined
  );

  return function customerAccessContextMiddleware(req, res, next) {
    const context = buildCustomerAccessContext(getInput(req, res), { repository });

    applyCustomerAccessContextToRequest(req, context);

    if (typeof next === 'function') {
      return next();
    }

    return undefined;
  };
}

module.exports = {
  applyCustomerAccessContextToRequest,
  buildCustomerAccessContextMiddleware,
};
