'use strict';

const SENSITIVE_KEY_PATTERN = /token|secret|password|databaseurl|database_url|db_url|postgres_url|connectionstring|connection_string|rawline|raw_line|rawphone|raw_phone|rawaddress|raw_address|lineuserid|line_user_id|phone|address/i;
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseEnabledFlag(value) {
  if (value === true) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function sanitizeCustomerAccessEnv(envLike) {
  if (!isPlainObject(envLike)) {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(envLike)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }

    if (
      key === 'CUSTOMER_ACCESS_ENABLED'
      || key === 'CUSTOMER_ACCESS_READ_ONLY_ENABLED'
      || key === 'CUSTOMER_ACCESS_DB_ENABLED'
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function buildSafeSummary(flags) {
  return {
    enabled: Boolean(flags.enabled),
    readOnlyEnabled: Boolean(flags.readOnlyEnabled),
    dbEnabled: Boolean(flags.dbEnabled),
  };
}

function buildDisabledBootstrapInput(flags = {}) {
  return {
    enabled: false,
    customerAccess: {
      enabled: false,
    },
    safeSummary: buildSafeSummary({
      enabled: false,
      readOnlyEnabled: flags.readOnlyEnabled,
      dbEnabled: flags.dbEnabled,
    }),
  };
}

function buildCustomerAccessBootstrapInputFromEnv(envLike) {
  const env = sanitizeCustomerAccessEnv(envLike);
  const customerAccessEnabled = parseEnabledFlag(env.CUSTOMER_ACCESS_ENABLED);
  const readOnlyEnabled = parseEnabledFlag(env.CUSTOMER_ACCESS_READ_ONLY_ENABLED);
  const dbEnabled = parseEnabledFlag(env.CUSTOMER_ACCESS_DB_ENABLED);
  const enabled = customerAccessEnabled || readOnlyEnabled;

  if (!enabled) {
    return buildDisabledBootstrapInput({
      readOnlyEnabled,
      dbEnabled,
    });
  }

  return {
    enabled: true,
    customerAccess: {
      enabled: true,
    },
    safeSummary: buildSafeSummary({
      enabled: true,
      readOnlyEnabled,
      dbEnabled,
    }),
  };
}

module.exports = {
  buildCustomerAccessBootstrapInputFromEnv,
  sanitizeCustomerAccessEnv,
};
