'use strict';

const {
  buildDataCorrectionDecisionAuditWriterInput,
} = require('./dataCorrectionDecisionAuditWriterInputBuilder');
const {
  normalizeDecisionAuditWriterFailureResult,
  normalizeDecisionAuditWriterRecordedResult,
  normalizeDecisionAuditWriterResult,
  normalizeDecisionAuditWriterSkippedResult,
} = require('./dataCorrectionDecisionAuditWriterResultNormalizer');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function resolveInjectedDecisionAuditWriter(writer) {
  if (typeof writer === 'function') {
    return writer;
  }

  if (isPlainObject(writer) && typeof writer.write === 'function') {
    return writer.write.bind(writer);
  }

  return null;
}

function callInjectedDecisionAuditWriter(writer, auditIntent) {
  const write = resolveInjectedDecisionAuditWriter(writer);

  if (!write) {
    return normalizeDecisionAuditWriterSkippedResult();
  }

  const writerInput = buildDataCorrectionDecisionAuditWriterInput(auditIntent);

  try {
    const result = write(writerInput);

    if (isPromiseLike(result)) {
      result.catch(() => {});

      return normalizeDecisionAuditWriterRecordedResult();
    }

    return normalizeDecisionAuditWriterResult(result);
  } catch (error) {
    return normalizeDecisionAuditWriterFailureResult();
  }
}

async function callInjectedDecisionAuditWriterAsync(writer, auditIntent) {
  const write = resolveInjectedDecisionAuditWriter(writer);

  if (!write) {
    return normalizeDecisionAuditWriterSkippedResult();
  }

  const writerInput = buildDataCorrectionDecisionAuditWriterInput(auditIntent);

  try {
    const result = await write(writerInput);

    return normalizeDecisionAuditWriterResult(result);
  } catch (error) {
    return normalizeDecisionAuditWriterFailureResult();
  }
}

module.exports = {
  callInjectedDecisionAuditWriter,
  callInjectedDecisionAuditWriterAsync,
  resolveInjectedDecisionAuditWriter,
};
