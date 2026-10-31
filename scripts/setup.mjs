import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import argon2 from 'argon2';

const file =
  process.env.OFFSHORE_CONFIG || join(homedir(), '.config', 'offshore-journey', 'config.json');
if (resolve(file).startsWith(process.cwd() + '/'))
  throw new Error('Guarde a configuração e as credenciais fora da pasta do projeto.');
let previous = {};
try {
  previous = JSON.parse(await readFile(file, 'utf8'));
} catch {}
const rl = process.stdin.isTTY
  ? createInterface({ input: process.stdin, output: process.stdout })
  : null;
let password = process.env.PROJECT_PASSWORD;
if (!password && !rl)
  throw new Error(
    'Execute npm run setup em um terminal interativo ou forneça PROJECT_PASSWORD pelo ambiente.',
  );
if (!password) {
  rl.close();
  password = await new Promise((resolve, reject) => {
    process.stdout.write('Defina a senha compartilhada (mínimo de 12 caracteres): ');
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const listener = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Configuração cancelada.'));
          return;
        }
        if (char === '\r' || char === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u007f') {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', listener);
    }
    process.stdin.on('data', listener);
  });
}
if (password.length < 12) throw new Error('Use uma senha com pelo menos 12 caracteres.');
const externalUrl = process.env.DATABASE_URL || previous.DATABASE_URL;
const local =
  process.env.OFFSHORE_LOCAL_DB !== undefined
    ? process.env.OFFSHORE_LOCAL_DB === 'true'
    : process.env.DATABASE_URL
      ? false
      : (previous.LOCAL_POSTGRES ?? !externalUrl);
const port = Number(process.env.POSTGRES_PORT || previous.POSTGRES_PORT || 55432);
const databaseUrl =
  externalUrl ||
  `postgresql://offshore:${randomBytes(24).toString('hex')}@127.0.0.1:${port}/offshore`;
const settings = {
  ...previous,
  DATABASE_URL: databaseUrl,
  PROJECT_PASSWORD_HASH: await argon2.hash(password, { type: argon2.argon2id }),
  SESSION_SECRET: randomBytes(48).toString('hex'),
  APP_URL: process.env.APP_URL || previous.APP_URL || 'http://localhost:3000',
  SESSION_HOURS: 12,
  LOCAL_POSTGRES: local,
  POSTGRES_PORT: port,
  POSTGRES_DIR:
    process.env.POSTGRES_DIR ||
    previous.POSTGRES_DIR ||
    join(homedir(), '.local', 'share', 'offshore-journey', 'postgres'),
};
await mkdir(dirname(file), { recursive: true, mode: 0o700 });
await writeFile(file, JSON.stringify(settings, null, 2) + '\n', { mode: 0o600 });
console.log(
  'Configuração salva fora do projeto. A senha não será exibida nem gravada em texto aberto.',
);
console.log('Próximos passos: npm run db:migrate e npm run dev.');
