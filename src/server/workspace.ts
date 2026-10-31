import 'server-only';
import { database } from './db';
import {
  validateWorkspace,
  normalizeImported,
  type WorkspaceData,
  type RecordData,
} from '@/lib/domain';
import { applyChanges, equal, type Change } from '@/lib/changes';
import seed from '@/data/seed.json';
import matrix from '@/data/matrix.json';
import launch from '@/data/launch.json';

const WORKSPACE = 'offshore';
type Tx = any;
export const references = () => ({ matrix, launch });
export function initialData() {
  return normalizeImported(seed, seed as WorkspaceData);
}

async function write(tx: Tx, data: WorkspaceData, revision: number, create = false) {
  const { session, macros, boards, ...metadata } = data;
  metadata.updatedAt = new Date().toISOString();
  if (create) await tx.workspace.create({ data: { id: WORKSPACE, session, metadata, revision } });
  else {
    const result = await tx.workspace.updateMany({
      where: { id: WORKSPACE, revision },
      data: { session, metadata, revision: { increment: 1 } },
    });
    if (result.count !== 1) throw new Error('RETRY_TRANSACTION');
  }
  for (const [position, macro] of macros.entries()) {
    const { id, name, short, status, ownerIds, ...extra } = macro;
    const row = {
      workspaceId: WORKSPACE,
      name,
      short: short || name,
      status: status || 'Em definição',
      ownerIds: ownerIds || [],
      position,
      metadata: extra,
    };
    await tx.macroProcess.upsert({ where: { id }, create: { id, ...row }, update: row });
  }
  for (const [position, board] of boards.entries()) {
    const row = {
      workspaceId: WORKSPACE,
      macroId: board.macroId,
      name: board.name,
      position,
      payload: board,
    };
    await tx.workFront.upsert({
      where: { id: board.id },
      create: { id: board.id, ...row },
      update: row,
    });
  }
  await tx.workFront.deleteMany({
    where: { workspaceId: WORKSPACE, id: { notIn: boards.map((item) => item.id) } },
  });
  await tx.macroProcess.deleteMany({
    where: { workspaceId: WORKSPACE, id: { notIn: macros.map((item) => item.id) } },
  });
}

export async function readWorkspace() {
  const db = database();
  const read = () =>
    db.$transaction(
      (tx) =>
        tx.workspace.findUnique({
          where: { id: WORKSPACE },
          include: {
            macros: { orderBy: { position: 'asc' } },
            fronts: { orderBy: { position: 'asc' } },
          },
        }),
      { isolationLevel: 'RepeatableRead' },
    );
  let row = await read();
  if (!row) {
    try {
      await db.$transaction(async (tx) => write(tx, initialData(), 0, true), { timeout: 15000 });
    } catch (error: any) {
      if (error.code !== 'P2002') throw error;
    }
    row = await read();
    if (!row) throw new Error('Não foi possível inicializar o projeto.');
  }
  const data = {
    ...(row.metadata as RecordData),
    schema: 4 as const,
    session: row.session as RecordData,
    macros: row.macros.map((macro) => ({
      ...(macro.metadata as RecordData),
      id: macro.id,
      name: macro.name,
      short: macro.short,
      status: macro.status,
      ownerIds: macro.ownerIds,
      boards: row!.fronts.filter((front) => front.macroId === macro.id).map((front) => front.id),
    })),
    boards: row.fronts.map((front) => ({
      ...(front.payload as RecordData),
      id: front.id,
      name: front.name,
      macroId: front.macroId,
    })),
  };
  return { data: validateWorkspace(data), revision: row.revision };
}

export async function updateWorkspace(changes: Change[]) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readWorkspace();
    const data = validateWorkspace(applyChanges(current.data, changes));
    for (const board of data.boards) {
      const previous = current.data.boards.find((item) => item.id === board.id);
      for (const decision of board.decisions || []) {
        const before = previous?.decisions?.find((item: RecordData) => item.uid === decision.uid);
        if (!equal(before, decision)) {
          board.decisionHistory ??= [];
          board.decisionHistory.unshift({
            uid: crypto.randomUUID(),
            decisionUid: decision.uid,
            title: decision.title,
            from: before?.status || 'Novo',
            to: decision.status,
            at: new Date().toISOString(),
            owner: decision.owner || '',
            rationale: decision.rationale || '',
            before: before || null,
            after: decision,
          });
        }
      }
    }
    try {
      await database().$transaction(async (tx) => write(tx, data, current.revision), {
        timeout: 15000,
      });
      return readWorkspace();
    } catch (error: any) {
      if (error.message !== 'RETRY_TRANSACTION' || attempt === 3) throw error;
    }
  }
  throw new Error('Não foi possível concluir a gravação. Tente novamente.');
}

export async function replaceWorkspace(input: RecordData, expectedRevision: number) {
  const normalized = normalizeImported(input, initialData());
  await database().$transaction(async (tx) => write(tx, normalized, expectedRevision), {
    timeout: 15000,
  });
  return readWorkspace();
}
