import { redirect } from 'next/navigation';
import { hasAccess } from '@/server/access';
import Workspace from '@/components/Workspace';
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  if (!(await hasAccess())) redirect('/login');
  return <Workspace />;
}
