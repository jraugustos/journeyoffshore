import { mkdir, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const roots = [
  '.gitignore',
  '.vercelignore',
  'vercel.json',
  '.prettierrc.json',
  '.prettierignore',
  'offshore_workshop_interativo_v17.html',
  'tests/original.sha256',
  'tests/application-evidence',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'next-env.d.ts',
  'tsconfig.json',
  'vitest.config.ts',
  'prisma.config.ts',
  '.env.example',
  'README.md',
  'PRD.md',
  'STATUS.md',
  'VALIDACAO.md',
  'docs',
  'prisma',
  'public',
  'src/app',
  'src/components',
  'src/lib',
  'src/server',
  'src/data',
  'src/workshop.css',
  'scripts/run.mjs',
  'scripts/setup.mjs',
  'scripts/package.mjs',
  'tests/application.spec.cjs',
  'tests/fidelity.spec.cjs',
];
const paths = [];
async function collect(item) {
  const children = await readdir(item, { withFileTypes: true }).catch(() => null);
  if (!children) {
    paths.push(item);
    return;
  }
  for (const child of children.sort((a, b) => a.name.localeCompare(b.name)))
    await collect(join(item, child.name));
}
for (const root of roots) await collect(root);
await mkdir('dist', { recursive: true });
const file = 'dist/offshore-journey-1.0.0.tar.gz';
const result = spawnSync('tar', ['-czf', file, ...paths], {
  stdio: 'inherit',
  env: { ...process.env, COPYFILE_DISABLE: '1' },
});
if (result.status !== 0) throw new Error('Não foi possível gerar o pacote.');
console.log('Pacote de código, migrações e documentação gerado: ' + file);
