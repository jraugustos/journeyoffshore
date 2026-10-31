import type { Metadata } from 'next';
import '../workshop.css';
import './globals.css';
export const metadata: Metadata = {
  title: 'Novas jornadas Offshore',
  description: 'Workspace do projeto Offshore Journey',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
