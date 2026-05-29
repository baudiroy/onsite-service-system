'use strict';

const { buildCustomerAccessContext } = require('./customerAccessContextProvider');
const { createCustomerAccessReadOnlyRepository } = require('./customerAccessReadOnlyRepository');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function contextInputFromRequest(req) {
  return isObject(req) ? req.customerAccessContextInput : undefined;
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
}

function hasOwn(value, key) {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function applyCustomerAccessContextToRequest(req, context) {
  if (!isObject(req)) {
    return req;
  }

  const safeContext = isObject(context) ? context : buildCustomerAccessContext();

  if (!hasOwn(req, 'customerAccessRouteParams')) {
    req.customerAccessRouteParams = objectOrEmpty(req.params);
  }

  req.params = {
    ...objectOrEmpty(safeContext.params),
    ...objectOrEmpty(req.params),
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
    const input = getInput(req, res);
    const context = buildCustomerAccessContext(input, { repository });

    if (isPromiseLike(context)) {
      return context
        .then((resolvedContext) => {
          applyCustomerAccessContextToRequest(req, resolvedContext);

          if (typeof next === 'function') {
            return next();
          }

          return undefined;
        })
        .catch(() => {
          applyCustomerAccessContextToRequest(req, buildCustomerAccessContext());

          if (typeof next === 'function') {
            return next();
          }

          return undefined;
        });
    }

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
