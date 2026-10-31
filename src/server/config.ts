import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function configuration() {
  const file =
    process.env.OFFSHORE_CONFIG || join(homedir(), '.config', 'offshore-journey', 'config.json');
  const local = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const read = (key: string) => process.env[key] || local[key] || '';
  return {
    databaseUrl: read('DATABASE_URL'),
    passwordHash: read('PROJECT_PASSWORD_HASH'),
    secret: read('SESSION_SECRET'),
    appUrl: read('APP_URL') || 'http://localhost:3000',
    sessionHours: Math.min(168, Math.max(1, Number(read('SESSION_HOURS')) || 12)),
  };
}
export function configured() {
  const config = configuration();
  try {
    const url = new URL(config.appUrl);
    const secureOrLocal =
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
    return (
      secureOrLocal &&
      !!config.databaseUrl &&
      config.passwordHash.startsWith('$argon2id$') &&
      config.secret.length >= 32
    );
  } catch {
    return false;
  }
}
