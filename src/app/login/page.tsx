import { redirect } from 'next/navigation';
import AccessForm from '@/components/AccessForm';
import { hasAccess } from '@/server/access';
import { configured } from '@/server/config';
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (!configured())
    return (
      <main className="setup-page">
        <img src="/brand.svg" width="48" height="48" alt="Itaú" />
        <h1>Configuração inicial</h1>
        <p>Defina a senha compartilhada e a conexão com o banco antes de abrir o projeto.</p>
        <p>
          No terminal deste projeto, execute <code>npm run setup</code>.
        </p>
        <p>Depois, execute as migrações e inicie a aplicação conforme o README.</p>
      </main>
    );
  if (await hasAccess()) redirect('/');
  return <AccessForm />;
}
