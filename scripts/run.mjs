import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const file =
  process.env.OFFSHORE_CONFIG || join(homedir(), '.config', 'offshore-journey', 'config.json');
const local = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
for (const [key, value] of Object.entries(local))
  if (process.env[key] === undefined) process.env[key] = String(value);
let database;
if (process.env.LOCAL_POSTGRES === 'true') {
  const connection = new URL(process.env.DATABASE_URL);
  const directory =
    process.env.POSTGRES_DIR || join(homedir(), '.local', 'share', 'offshore-journey', 'postgres');
  if (existsSync(join(directory, 'postmaster.pid'))) {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('SELECT 1');
    } catch {
      throw new Error(
        'A base local já possui um processo registrado, mas não respondeu. Verifique o serviço antes de iniciar outra instância.',
      );
    } finally {
      await client.end();
    }
    console.log('Usando o PostgreSQL local já em execução.');
  } else {
    const { default: EmbeddedPostgres } = await import('embedded-postgres');
    database = new EmbeddedPostgres({
      databaseDir: directory,
      user: decodeURIComponent(connection.username),
      password: decodeURIComponent(connection.password),
      port: Number(connection.port || 55432),
      persistent: true,
      authMethod: 'scram-sha-256',
      postgresFlags: ['-c', 'listen_addresses=127.0.0.1'],
      onLog: () => {},
      onError: () => {},
    });
    if (!existsSync(join(directory, 'PG_VERSION'))) await database.initialise();
    await database.start();
    try {
      await database.createDatabase(connection.pathname.slice(1));
    } catch (error) {
      if (error.code !== '42P04' && !/already exists/.test(error.message)) throw error;
    }
    console.log('PostgreSQL local disponível.');
  }
}
const mode = process.argv[2] || 'dev';
const binary = mode === 'migrate' ? 'prisma' : 'next';
const args =
  mode === 'migrate'
    ? ['migrate', 'deploy']
    : [mode, '--hostname', '127.0.0.1', ...(mode === 'dev' ? ['--webpack'] : [])];
if (mode === 'start' && process.env.HOST) args[args.indexOf('127.0.0.1')] = process.env.HOST;
const child = spawn(join(process.cwd(), 'node_modules', '.bin', binary), args, {
  stdio: 'inherit',
  env: process.env,
});
let closing = false;
async function stop(signal) {
  if (closing) return;
  closing = true;
  child.kill(signal || 'SIGTERM');
}
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGTERM', () => void stop('SIGTERM'));
child.on('exit', async (code) => {
  if (database) await database.stop();
  process.exitCode = code || 0;
});
