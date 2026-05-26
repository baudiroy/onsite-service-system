const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const OPTIONAL_ENV = [
  'NODE_ENV',
  'PORT',
  'APP_BASE_URL',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'JWT_EXPIRES_IN',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'SEED_ADMIN_DISPLAY_NAME',
  'SEED_SMOKE_USER_EMAIL',
  'SEED_SMOKE_USER_PASSWORD',
  'SEED_SMOKE_USER_DISPLAY_NAME',
  'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'OPENAI_API_KEY',
  'AI_PROVIDER',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_SIGNED_URL_TTL_SECONDS'
];
const ALLOWED_NODE_ENV = ['development', 'test', 'staging', 'production'];

function readInteger(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid integer environment variable: ${name}`);
  }

  return parsedValue;
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function readString(name, defaultValue = '') {
  const rawValue = process.env[name];
  return rawValue === undefined || rawValue === '' ? defaultValue : rawValue;
}

function readBoolean(name, defaultValue = false) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Invalid boolean environment variable: ${name}`);
}

function validateNodeEnv(nodeEnv) {
  if (!ALLOWED_NODE_ENV.includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV. Expected one of: ${ALLOWED_NODE_ENV.join(', ')}`);
  }
}

requireEnv(REQUIRED_ENV);

const nodeEnv = readString('NODE_ENV', 'development');
validateNodeEnv(nodeEnv);

const env = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  isProduction: nodeEnv === 'production',
  port: readInteger('PORT', 3000),
  appBaseUrl: readString('APP_BASE_URL', 'http://localhost:3000'),
  corsOrigin: readString('CORS_ORIGIN', '*'),
  logLevel: readString('LOG_LEVEL', 'info'),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: readString('JWT_EXPIRES_IN', '8h'),
  seedAdminEmail: readString('SEED_ADMIN_EMAIL', 'admin@example.com'),
  seedAdminPassword: readString('SEED_ADMIN_PASSWORD', 'ChangeMe123!'),
  seedAdminDisplayName: readString('SEED_ADMIN_DISPLAY_NAME', 'System Admin'),
  seedSmokeUserEmail: readString('SEED_SMOKE_USER_EMAIL'),
  seedSmokeUserPassword: readString('SEED_SMOKE_USER_PASSWORD'),
  seedSmokeUserDisplayName: readString('SEED_SMOKE_USER_DISPLAY_NAME', 'Smoke Regular User'),
  repairIntakeDraftToCaseRoutesEnabled: readBoolean('REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED', false),
  r2AccountId: readString('R2_ACCOUNT_ID'),
  r2AccessKeyId: readString('R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: readString('R2_SECRET_ACCESS_KEY'),
  r2Bucket: readString('R2_BUCKET', 'onsite-service-attachments'),
  r2SignedUrlTtlSeconds: readInteger('R2_SIGNED_URL_TTL_SECONDS', 900),
  optionalEnv: OPTIONAL_ENV
};

module.exports = {
  env
};
