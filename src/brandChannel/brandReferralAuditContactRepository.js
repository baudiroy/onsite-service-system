'use strict';

const BRAND_REFERRAL_AUDIT_CONTACT_TABLE = 'brand_referral_contact_events';

const BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS = Object.freeze([
  'organization_id',
  'brand_id',
  'source_channel',
  'referral_source',
  'entry_context',
  'line_channel_id',
  'event_type',
  'reason_key',
  'result_status',
  'request_id',
  'created_at',
  'retention_until',
  'deleted_at',
]);

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function pickAllowedColumns(row) {
  const picked = {};

  for (const column of BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(row, column) && row[column] !== undefined) {
      picked[column] = row[column];
    }
  }

  return picked;
}

async function insertBrandReferralAuditContactEvent(dbClient, row) {
  if (!dbClient || typeof dbClient.insert !== 'function') {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_db_client_missing',
    };
  }

  if (!isPlainObject(row)) {
    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_row_invalid',
    };
  }

  try {
    const safeRow = pickAllowedColumns(row);
    const inserted = await dbClient.insert(BRAND_REFERRAL_AUDIT_CONTACT_TABLE, safeRow);

    return {
      ok: true,
      id: isPlainObject(inserted) && typeof inserted.id === 'string' ? inserted.id : undefined,
      createdAt: isPlainObject(inserted) && typeof inserted.created_at === 'string'
        ? inserted.created_at
        : safeRow.created_at,
    };
  } catch (error) {
    if (error && error.code === '23505') {
      return {
        ok: false,
        reasonKey: 'brand_referral_audit_contact_duplicate_request',
      };
    }

    if (error && error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        reasonKey: 'brand_referral_audit_contact_timeout',
      };
    }

    return {
      ok: false,
      reasonKey: 'brand_referral_audit_contact_write_failed',
    };
  }
}

module.exports = {
  BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  BRAND_REFERRAL_AUDIT_CONTACT_TABLE,
  insertBrandReferralAuditContactEvent,
};
