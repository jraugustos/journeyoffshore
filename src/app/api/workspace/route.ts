import { z } from 'zod';
import { guard, privateJson } from '@/server/access';
import { readWorkspace, references, updateWorkspace } from '@/server/workspace';
import { ConflictError } from '@/lib/changes';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const changesSchema = z
  .array(
    z.object({
      collection: z.enum(['state', 'macros', 'boards']),
      id: z.string().optional(),
      field: z.string().min(1).max(200),
      before: z.unknown().optional(),
      value: z.unknown().optional(),
      remove: z.boolean().optional(),
    }),
  )
  .max(1500);
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return privateJson({ ...(await readWorkspace()), ...references() });
}
export async function PATCH(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const raw = await request.text();
    if (raw.length > 8_000_000) return privateJson({ error: 'Alteração muito grande.' }, 413);
    const changes = changesSchema.parse(JSON.parse(raw).changes);
    return privateJson(await updateWorkspace(changes));
  } catch (error: any) {
    if (error instanceof ConflictError)
      return privateJson(
        {
          error: error.message,
          conflicts: error.conflicts.map((item) => ({
            collection: item.collection,
            id: item.id,
            field: item.field,
          })),
          ...(await readWorkspace()),
        },
        409,
      );
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return privateJson({ error: 'Formato de alteração inválido.' }, 400);
    if (/RETRY_TRANSACTION/.test(error.message))
      return privateJson({ error: 'Outra gravação está em andamento. Tente novamente.' }, 409);
    console.error('workspace-update', error.code || error.name);
    return privateJson(
      {
        error:
          error.message?.startsWith('Há ') || error.message?.startsWith('Cada ')
            ? error.message
            : 'Não foi possível salvar. Suas alterações continuam na tela.',
      },
      422,
    );
  }
}
