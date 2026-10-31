import 'server-only';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { configuration } from './config';

const globalDb = globalThis as unknown as { offshoreDb?: PrismaClient };
export function database() {
  if (!globalDb.offshoreDb) {
    const adapter = new PrismaPg({ connectionString: configuration().databaseUrl, max: 5 });
    globalDb.offshoreDb = new PrismaClient({ adapter });
  }
  return globalDb.offshoreDb;
}
