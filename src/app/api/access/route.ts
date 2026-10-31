import { login, logout, privateJson, sameOrigin } from '@/server/access';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'Origem não permitida.' }, 403);
  try {
    const body = await request.text();
    if (body.length > 4096) return privateJson({ error: 'Solicitação inválida.' }, 400);
    const input = JSON.parse(body);
    return await login(typeof input.password === 'string' ? input.password : '');
  } catch {
    return privateJson(
      { error: 'Não foi possível acessar. Verifique a configuração do serviço.' },
      503,
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'Origem não permitida.' }, 403);
  return logout();
}
