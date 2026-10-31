import 'server-only';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { configuration } from './config';

const globalDb = globalThis as unknown as { offshoreDb?: PrismaClient };
export function database() {
  if (!globalDb.offshoreDb) {
    const pool = new Pool({
      connectionString: configuration().databaseUrl,
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (error) => {
      console.error('Conexão PostgreSQL inativa encerrada.', {
        code: (error as NodeJS.ErrnoException).code || 'UNKNOWN',
      });
    });
    if (process.env.VERCEL === '1') attachDatabasePool(pool);
    const adapter = new PrismaPg(pool);
    globalDb.offshoreDb = new PrismaClient({ adapter });
  }
  return globalDb.offshoreDb;
}
