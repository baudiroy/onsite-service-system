'use strict';

const {
  BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  insertBrandReferralAuditContactEvent,
} = require('./brandReferralAuditContactRepository');
const {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES,
} = require('./brandReferralAuditIntentBuilder');

const ALLOWED_EVENT_TYPES = new Set(Object.values(BRAND_REFERRAL_AUDIT_EVENT_TYPES));
const ALLOWED_RESULT_STATUSES = new Set([
  'normalized',
  'denied',
  'malformed',
  'unknown',
]);

const UNSAFE_KEYS = new Set([
  'line_user_id',
  'lineUserId',
  'raw_line_user_id',
  'rawLineUserId',
  'token',
  'secret',
  'access_token',
  'line_access_token',
  'lineAccessToken',
  'channel_secret',
  'line_channel_secret',
  'lineChannelSecret',
  'binding_token',
  'verification_code',
  'phone',
  'customer_phone',
  'address',
  'customer_address',
  'customer_name',
  'provider_payload',
  'raw_provider_payload',
  'ai_payload',
  'raw_ai_payload',
  'customer_payload',
  'full_customer_payload',
  'credential',
  'database_url',
  'DATABASE_URL',
  'stack',
  'sql',
  'sql_input',
  'case_data',
  'customer_case_data',
  'internal_note',
  'billing',
  'settlement',
  'cross_organization',
]);

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value, maxLength = 160) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function findUnsafeKey(input) {
  if (!isPlainObject(input)) {
    return undefined;
  }

  return Object.keys(input).find((key) => UNSAFE_KEYS.has(key));
}

function normalizeTimestamp(value) {
  const timestamp = safeString(value, 64);
  if (!timestamp) {
    return undefined;
  }

  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? undefined : timestamp;
}

function buildAuditContactRow(auditIntent = {}) {
  if (!isPlainObject(auditIntent)) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_intent_invalid',
    };
  }

  const unsafeKey = findUnsafeKey(auditIntent);
  if (unsafeKey) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_unsafe_field',
    };
  }

  const organizationId = safeString(auditIntent.organization_id || auditIntent.organizationId, 80);
  const eventType = safeString(auditIntent.event_type || auditIntent.eventType, 80);
  const resultStatus = safeString(auditIntent.result_status || auditIntent.resultStatus, 80);

  if (!organizationId) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_organization_required',
    };
  }

  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_event_type_invalid',
    };
  }

  if (!resultStatus || !ALLOWED_RESULT_STATUSES.has(resultStatus)) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_result_status_invalid',
    };
  }

  return {
    ok: true,
    row: {
      organization_id: organizationId,
      brand_id: safeString(auditIntent.brand_id || auditIntent.brandId, 80),
      source_channel: safeString(auditIntent.source_channel || auditIntent.sourceChannel, 80),
      referral_source: safeString(auditIntent.referral_source || auditIntent.referralSource, 120),
      entry_context: safeString(auditIntent.entry_context || auditIntent.entryContext, 160),
      line_channel_id: safeString(auditIntent.line_channel_id || auditIntent.lineChannelId, 120),
      event_type: eventType,
      reason_key: safeString(auditIntent.reason_key || auditIntent.reasonKey, 120),
      result_status: resultStatus,
      request_id: safeString(auditIntent.request_id || auditIntent.requestId, 120),
      created_at: normalizeTimestamp(auditIntent.created_at || auditIntent.createdAt || auditIntent.timestamp),
      retention_until: normalizeTimestamp(auditIntent.retention_until || auditIntent.retentionUntil),
      deleted_at: normalizeTimestamp(auditIntent.deleted_at || auditIntent.deletedAt),
    },
  };
}

function createBrandReferralAuditContactWriter(options = {}) {
  const dbClient = options.dbClient || options.transaction;
  const repository = typeof options.repository === 'function'
    ? options.repository
    : insertBrandReferralAuditContactEvent;

  return {
    write: async (auditIntent = {}) => {
      if (!dbClient) {
        return {
          ok: false,
          reasonKey: 'brand_referral_audit_contact_db_client_missing',
        };
      }

      const built = buildAuditContactRow(auditIntent);
      if (!built.ok) {
        return {
          ok: false,
          reasonKey: built.reasonKey,
        };
      }

      const result = await repository(dbClient, built.row);
      if (!result || result.ok !== true) {
        return {
          ok: false,
          reasonKey: result && typeof result.reasonKey === 'string'
            ? result.reasonKey
            : 'brand_referral_audit_contact_write_failed',
        };
      }

      return {
        ok: true,
        id: result.id,
        createdAt: result.createdAt,
      };
    },
  };
}

module.exports = {
  ALLOWED_BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS: BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  buildAuditContactRow,
  createBrandReferralAuditContactWriter,
};
