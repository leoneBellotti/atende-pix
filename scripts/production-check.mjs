import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const envFile = process.env.ENV_FILE;

if (envFile && existsSync(envFile)) {
  loadEnvFile(envFile);
}

const required = [
  'NODE_ENV',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN_SECONDS',
  'API_PORT',
  'WEB_ORIGIN',
  'VITE_API_BASE_URL'
];

const recommended = [
  'ADMIN_EMAILS',
  'ERROR_MONITORING_ENABLED',
  'ERROR_LOG_PATH',
  'STRUCTURED_LOGGING_ENABLED',
  'REQUEST_LOGGING_ENABLED',
  'RATE_LIMIT_ENABLED',
  'BACKUP_RETENTION_DAYS'
];

const errors = [];
const warnings = [];

for (const key of required) {
  if (!readEnv(key)) {
    errors.push(`Variavel obrigatoria ausente: ${key}`);
  }
}

for (const key of recommended) {
  if (!readEnv(key)) {
    warnings.push(`Variavel recomendada ausente: ${key}`);
  }
}

if (readEnv('NODE_ENV') !== 'production') {
  errors.push('NODE_ENV deve ser production.');
}

validateSecret('JWT_ACCESS_SECRET');
validateSecret('JWT_REFRESH_SECRET');
validateUrl('WEB_ORIGIN');
validateUrl('VITE_API_BASE_URL');

if (readEnv('WEB_ORIGIN')?.startsWith('http://')) {
  warnings.push('WEB_ORIGIN usa http://. Em producao, use HTTPS.');
}

if (readEnv('VITE_API_BASE_URL')?.startsWith('http://')) {
  warnings.push('VITE_API_BASE_URL usa http://. Em producao, use HTTPS.');
}

if (readEnv('RATE_LIMIT_TRUST_PROXY') !== 'true') {
  warnings.push('RATE_LIMIT_TRUST_PROXY nao esta true. Ative quando usar proxy confiavel.');
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

for (const error of errors) {
  console.error(`ERRO: ${error}`);
}

if (errors.length) {
  process.exit(1);
}

console.log('Checklist automatico de producao OK.');

function readEnv(key) {
  const value = process.env[key];
  return value?.trim();
}

function validateSecret(key) {
  const value = readEnv(key);

  if (!value) {
    return;
  }

  const unsafeValues = ['change-me-access', 'change-me-refresh', 'dev-access-secret'];

  if (unsafeValues.includes(value) || value.length < 32) {
    errors.push(`${key} deve ser um segredo forte, unico e com pelo menos 32 caracteres.`);
  }
}

function validateUrl(key) {
  const value = readEnv(key);

  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    errors.push(`${key} deve ser uma URL valida.`);
  }
}

function loadEnvFile(path) {
  const content = readFileSync(path, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
