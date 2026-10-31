import { guard, privateJson } from '@/server/access';
import { readWorkspace, references } from '@/server/workspace';
import { csvExport, htmlExport } from '@/lib/exports';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data } = await readWorkspace(),
    { matrix } = references();
  const params = new URL(request.url).searchParams,
    format = params.get('format') || 'json',
    kind = params.get('kind') || 'progress';
  const types: Record<string, string> = {
    json: 'application/json',
    html: 'text/html',
    csv: 'text/csv',
  };
  if (!types[format]) return privateJson({ error: 'Formato inválido.' }, 400);
  const body =
    format === 'json'
      ? JSON.stringify(data, null, 2)
      : format === 'html'
        ? htmlExport(data, matrix)
        : csvExport(data, kind, matrix);
  return new Response(body, {
    headers: {
      'Content-Type': types[format] + '; charset=utf-8',
      'Content-Disposition': `attachment; filename="offshore-${format === 'csv' ? kind : 'projeto'}.${format}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
