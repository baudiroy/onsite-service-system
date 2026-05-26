const crypto = require('node:crypto');

const { env } = require('../../config/env');
const { StorageError } = require('../../utils/errors');

const SERVICE = 's3';
const REGION = 'auto';
const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD';

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function sha256(value, encoding = 'hex') {
  return crypto.createHash('sha256').update(value).digest(encoding);
}

function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

function amzDate(now) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(now) {
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

function getSigningKey(secretAccessKey, date, region, service) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, date);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, service);
  return hmac(dateRegionServiceKey, 'aws4_request');
}

class R2StorageProvider {
  constructor({
    accountId = env.r2AccountId,
    accessKeyId = env.r2AccessKeyId,
    secretAccessKey = env.r2SecretAccessKey,
    bucket = env.r2Bucket,
    ttlSeconds = env.r2SignedUrlTtlSeconds
  } = {}) {
    this.accountId = accountId;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.bucket = bucket;
    this.ttlSeconds = ttlSeconds;
  }

  ensureConfigured() {
    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey || !this.bucket) {
      throw new StorageError('R2 storage is not configured.');
    }
  }

  endpointHost() {
    return `${this.accountId}.r2.cloudflarestorage.com`;
  }

  createSignedUrl({ method, objectKey, contentType = null, ttlSeconds = this.ttlSeconds }) {
    this.ensureConfigured();

    const now = new Date();
    const date = dateStamp(now);
    const xAmzDate = amzDate(now);
    const credentialScope = `${date}/${REGION}/${SERVICE}/aws4_request`;
    const credential = `${this.accessKeyId}/${credentialScope}`;
    const host = this.endpointHost();
    const canonicalUri = `/${this.bucket}/${encodePath(objectKey)}`;
    const query = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': xAmzDate,
      'X-Amz-Expires': String(ttlSeconds),
      'X-Amz-SignedHeaders': 'host'
    });

    const canonicalQueryString = Array.from(query.entries())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .sort()
      .join('&');
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      UNSIGNED_PAYLOAD
    ].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      xAmzDate,
      credentialScope,
      sha256(canonicalRequest)
    ].join('\n');
    const signingKey = getSigningKey(this.secretAccessKey, date, REGION, SERVICE);
    const signature = hmac(signingKey, stringToSign, 'hex');
    query.set('X-Amz-Signature', signature);

    return {
      signedUrl: `https://${host}${canonicalUri}?${query.toString()}`,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
      method,
      contentType
    };
  }

  createSignedUploadUrl({ objectKey, contentType, ttlSeconds }) {
    return this.createSignedUrl({
      method: 'PUT',
      objectKey,
      contentType,
      ttlSeconds
    });
  }

  createSignedDownloadUrl({ objectKey, ttlSeconds }) {
    return this.createSignedUrl({
      method: 'GET',
      objectKey,
      ttlSeconds
    });
  }
}

module.exports = {
  R2StorageProvider
};
