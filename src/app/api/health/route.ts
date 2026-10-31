import { database } from '@/server/db';
import { privateJson } from '@/server/access';
import { configured } from '@/server/config';
export async function GET() {
  if (!configured()) return privateJson({ status: 'setup-required' }, 503);
  try {
    await database().$queryRaw`SELECT 1`;
    return privateJson({ status: 'ok' });
  } catch {
    return privateJson({ status: 'unavailable' }, 503);
  }
}
