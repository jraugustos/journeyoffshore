import { guard, privateJson } from '@/server/access';
import { replaceWorkspace } from '@/server/workspace';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const raw = await request.text();
    if (raw.length > 8_000_000) return privateJson({ error: 'Arquivo muito grande.' }, 413);
    const body = JSON.parse(raw);
    if (!Number.isInteger(body.revision)) throw new Error('Revisão inválida.');
    return privateJson(await replaceWorkspace(body.data, body.revision));
  } catch (error: any) {
    return privateJson(
      {
        error:
          error.message === 'RETRY_TRANSACTION'
            ? 'O projeto mudou em outra sessão. Atualize antes de importar.'
            : 'Não foi possível importar: ' + (error.message || 'arquivo inválido'),
      },
      error.message === 'RETRY_TRANSACTION' ? 409 : 400,
    );
  }
}
