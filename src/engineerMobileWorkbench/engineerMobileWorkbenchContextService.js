'use strict';

const DENY_RESPONSE = {
  statusCode: 403,
  body: {
    status: 'deny',
    code: 'ENGINEER_MOBILE_WORKBENCH_CONTEXT_DENIED',
    message: 'Engineer mobile workbench context is unavailable.'
  }
};

const MAX_SAFE_TEXT_LENGTH = 120;
const MAX_SAFE_LIST_LENGTH = 30;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > MAX_SAFE_TEXT_LENGTH) {
    return null;
  }

  return trimmedValue;
}

function sanitizeTextList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeText)
    .filter(Boolean)
    .slice(0, MAX_SAFE_LIST_LENGTH);
}

function authFromRequest(req = {}) {
  return isObject(req.auth) ? req.auth : {};
}

function buildContextInput(req = {}) {
  const auth = authFromRequest(req);
  const organizationId = sanitizeText(auth.organizationId);
  const engineerId = sanitizeText(auth.engineerId);

  if (!organizationId || !engineerId) {
    return null;
  }

  return {
    organizationId,
    engineerId,
    userId: sanitizeText(auth.userId),
    role: sanitizeText(auth.role),
    permissions: sanitizeTextList(auth.permissions)
  };
}

function pickProvider(options = {}) {
  if (!isObject(options)) {
    return null;
  }

  if (isObject(options.currentContext)) {
    return options.currentContext;
  }

  if (isObject(options.workbenchContext)) {
    return options.workbenchContext;
  }

  if (isObject(options.contextProvider)) {
    return options.contextProvider;
  }

  if (isObject(options.engineerMobileWorkbenchContext)) {
    return options.engineerMobileWorkbenchContext;
  }

  return null;
}

async function readProviderContext(provider, input) {
  if (!provider) {
    return {};
  }

  if (typeof provider.getCurrentContext === 'function') {
    const result = await provider.getCurrentContext(input);
    return isObject(result) ? result : {};
  }

  if (typeof provider.getContext === 'function') {
    const result = await provider.getContext(input);
    return isObject(result) ? result : {};
  }

  if (typeof provider.buildContext === 'function') {
    const result = await provider.buildContext(input);
    return isObject(result) ? result : {};
  }

  return provider;
}

function sanitizeContext(input, providerContext = {}) {
  return {
    organizationId: input.organizationId,
    engineerId: input.engineerId,
    userId: input.userId,
    role: input.role,
    permissions: input.permissions,
    engineerDisplayName: sanitizeText(providerContext.engineerDisplayName),
    organizationName: sanitizeText(providerContext.organizationName),
    timezone: sanitizeText(providerContext.timezone),
    locale: sanitizeText(providerContext.locale),
    workbenchMode: sanitizeText(providerContext.workbenchMode) || 'engineer_mobile_workbench',
    capabilities: sanitizeTextList(providerContext.capabilities),
    featureFlags: sanitizeTextList(providerContext.featureFlags)
  };
}

async function buildEngineerMobileWorkbenchContextResponseAsync(req = {}, options = {}) {
  const input = buildContextInput(req);

  if (!input) {
    return DENY_RESPONSE;
  }

  try {
    const providerContext = await readProviderContext(pickProvider(options), input);

    return {
      statusCode: 200,
      body: {
        status: 'allow',
        context: sanitizeContext(input, providerContext)
      }
    };
  } catch (error) {
    return DENY_RESPONSE;
  }
}

module.exports = {
  buildEngineerMobileWorkbenchContextResponseAsync,
  buildContextInput,
  sanitizeContext
};
