'use strict';

const DATA_CLASSIFICATIONS = Object.freeze({
  PUBLIC: 'public',
  CUSTOMER_VISIBLE: 'customer_visible',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
  SECRET: 'secret',
});

const DATA_CLASSIFICATION_RANK = Object.freeze({
  [DATA_CLASSIFICATIONS.PUBLIC]: 0,
  [DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE]: 1,
  [DATA_CLASSIFICATIONS.INTERNAL]: 2,
  [DATA_CLASSIFICATIONS.CONFIDENTIAL]: 3,
  [DATA_CLASSIFICATIONS.RESTRICTED]: 4,
  [DATA_CLASSIFICATIONS.SECRET]: 5,
});

const DATA_ACCESS_PURPOSES = Object.freeze({
  CUSTOMER_VISIBLE: 'customer_visible',
  EXPORT: 'export',
  RAG_RETRIEVAL: 'rag_retrieval',
});

const DEFAULT_CLASSIFICATION = DATA_CLASSIFICATIONS.INTERNAL;

const EXACT_FIELD_CLASSIFICATIONS = Object.freeze({
  case_no: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
  case_number: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
  customer_facing_status: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
  customer_report_summary: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
  appointment_window: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
  public_service_area: DATA_CLASSIFICATIONS.PUBLIC,
  public_faq_title: DATA_CLASSIFICATIONS.PUBLIC,
  public_faq_answer: DATA_CLASSIFICATIONS.PUBLIC,
});

const SECRET_FIELD_PATTERNS = Object.freeze([
  /(^|_)token($|_)/,
  /(^|_)secret($|_)/,
  /credential/,
  /password/,
  /api[_-]?key/,
  /access[_-]?token/,
  /channel[_-]?secret/,
  /webhook[_-]?secret/,
  /database[_-]?url/,
  /db[_-]?url/,
  /private[_-]?key/,
]);

const RESTRICTED_FIELD_PATTERNS = Object.freeze([
  /raw[_-]?line[_-]?(user[_-]?)?id/,
  /line[_-]?user[_-]?id/,
  /full[_-]?phone/,
  /full[_-]?mobile/,
  /phone/,
  /mobile/,
  /tel/,
  /full[_-]?address/,
  /address/,
  /signature/,
  /unmasked[_-]?photo/,
  /photo[_-]?raw/,
  /audit[_-]?raw[_-]?payload/,
  /audit[_-]?payload/,
  /ai[_-]?raw[_-]?payload/,
  /ai[_-]?payload/,
  /internal[_-]?note/,
  /engineer[_-]?internal[_-]?comment/,
  /billing[_-]?internal/,
  /settlement[_-]?internal/,
]);

const CONFIDENTIAL_FIELD_PATTERNS = Object.freeze([
  /quote[_-]?amount/,
  /invoice[_-]?amount/,
  /approval[_-]?amount/,
  /cost/,
  /price/,
  /payment/,
]);

function normalizeFieldKey(fieldKey) {
  if (typeof fieldKey !== 'string') {
    return '';
  }

  return fieldKey
    .trim()
    .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function matchesAnyPattern(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function classifyField(fieldKey) {
  const normalizedFieldKey = normalizeFieldKey(fieldKey);

  if (!normalizedFieldKey) {
    return DEFAULT_CLASSIFICATION;
  }

  if (Object.prototype.hasOwnProperty.call(EXACT_FIELD_CLASSIFICATIONS, normalizedFieldKey)) {
    return EXACT_FIELD_CLASSIFICATIONS[normalizedFieldKey];
  }

  if (matchesAnyPattern(normalizedFieldKey, SECRET_FIELD_PATTERNS)) {
    return DATA_CLASSIFICATIONS.SECRET;
  }

  if (matchesAnyPattern(normalizedFieldKey, RESTRICTED_FIELD_PATTERNS)) {
    return DATA_CLASSIFICATIONS.RESTRICTED;
  }

  if (matchesAnyPattern(normalizedFieldKey, CONFIDENTIAL_FIELD_PATTERNS)) {
    return DATA_CLASSIFICATIONS.CONFIDENTIAL;
  }

  return DEFAULT_CLASSIFICATION;
}

function isAtLeastClassification(classification, minimumClassification) {
  const currentRank = DATA_CLASSIFICATION_RANK[classification];
  const minimumRank = DATA_CLASSIFICATION_RANK[minimumClassification];

  if (currentRank === undefined || minimumRank === undefined) {
    return true;
  }

  return currentRank >= minimumRank;
}

function canExposeClassificationForPurpose(classification, purpose) {
  if (purpose === DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE) {
    return classification === DATA_CLASSIFICATIONS.PUBLIC
      || classification === DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE;
  }

  if (
    purpose === DATA_ACCESS_PURPOSES.EXPORT
    || purpose === DATA_ACCESS_PURPOSES.RAG_RETRIEVAL
  ) {
    return !isAtLeastClassification(classification, DATA_CLASSIFICATIONS.RESTRICTED);
  }

  return false;
}

function canExposeFieldForPurpose(fieldKey, purpose) {
  return canExposeClassificationForPurpose(classifyField(fieldKey), purpose);
}

module.exports = Object.freeze({
  DATA_CLASSIFICATIONS,
  DATA_CLASSIFICATION_RANK,
  DATA_ACCESS_PURPOSES,
  DEFAULT_CLASSIFICATION,
  classifyField,
  canExposeClassificationForPurpose,
  canExposeFieldForPurpose,
  isAtLeastClassification,
  normalizeFieldKey,
});
