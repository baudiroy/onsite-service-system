'use strict';

function createSmokeRunId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
  const suffix = Math.random().toString(16).slice(2, 8) || 'smoke';

  return `${timestamp}-${suffix}`;
}

function normalizeSmokeRunId(input) {
  const normalized = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return normalized || createSmokeRunId();
}

function shortSmokeRunId(runId, maxLength = 16) {
  const normalized = normalizeSmokeRunId(runId)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)
    .replace(/^-|-$/g, '');

  return normalized || 'smoke';
}

function buildSmokePrefix(taskCode, smokeName, runId) {
  const smokeRunId = normalizeSmokeRunId(runId);
  return [taskCode, smokeName, smokeRunId].filter(Boolean).join(' ');
}

function toCodePart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createSmokeMarker({ taskCode, smokeName, runId }) {
  const smokeRunId = normalizeSmokeRunId(runId);
  const compactSmokeRunId = shortSmokeRunId(smokeRunId);
  const smokePrefix = buildSmokePrefix(taskCode, smokeName, smokeRunId);
  const codePrefix = [taskCode, smokeName, smokeRunId]
    .map(toCodePart)
    .filter(Boolean)
    .join('-');

  return {
    smokeRunId,
    shortSmokeRunId: compactSmokeRunId,
    smokePrefix,
    codePrefix
  };
}

module.exports = {
  buildSmokePrefix,
  createSmokeMarker,
  createSmokeRunId,
  normalizeSmokeRunId,
  shortSmokeRunId
};
