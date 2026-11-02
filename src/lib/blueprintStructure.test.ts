import { describe, it, expect } from 'vitest';
import { insertMacro, insertFront, insertStep, moveFront } from './blueprintStructure';
import {
  clone,
  defaultCase,
  normalizeImported,
  validateWorkspace,
  type WorkspaceData,
} from './domain';
import { applyChanges, diffState } from './changes';
import seed from '../data/seed.json';

const initial = () => normalizeImported(seed, seed as WorkspaceData);
const persist = (before: WorkspaceData, after: WorkspaceData) =>
  validateWorkspace(applyChanges(before, diffState(before, after)));

describe('Estrutura editável da blueprint', () => {
  it('insere macroprocessos antes, entre e depois dos existentes e persiste a ordem', () => {
    const before = initial(),
      next = clone(before);
    const first = insertMacro(next, next.macros[0].id);
    const middle = insertMacro(next, next.macros[2].id);
    const last = insertMacro(next);
    const saved = persist(before, next);
    expect(saved.macros.map((macro) => macro.id)).toEqual([
      first.id,
      before.macros[0].id,
      middle.id,
      ...before.macros.slice(1).map((m) => m.id),
      last.id,
    ]);
  });

  it('insere contextos na posição do macroprocesso e preserva os registros existentes', () => {
    const before = initial(),
      next = clone(before);
    const macroId = next.boards[0].macroId;
    const first = insertFront(next, macroId, next.boards[0].id);
    const last = insertFront(next, macroId);
    const saved = persist(before, next);
    expect(saved.macros.find((m) => m.id === macroId)?.boards).toEqual([
      first.id,
      ...before.boards.filter((b) => b.macroId === macroId).map((b) => b.id),
      last.id,
    ]);
    for (const board of before.boards)
      expect(saved.boards.find((b) => b.id === board.id)).toEqual(board);
    expect(defaultCase(saved.boards.find((b) => b.id === first.id)!)).toMatchObject({
      boardId: first.id,
      macroId,
      isDefault: true,
      steps: [],
    });
  });

  it('usa o ID real para inserir etapas mesmo quando há etapas ocultas pelo filtro', () => {
    const before = initial(),
      next = clone(before);
    const board = next.boards.find((b) => defaultCase(b).steps.length >= 2)!;
    const item = defaultCase(board),
      originalIds = item.steps.map((s: any) => s.uid);
    item.steps[1].release = 'Release B';
    const middle = insertStep(next, board.id, item.uid, originalIds[1]);
    const first = insertStep(next, board.id, item.uid, originalIds[0]);
    const last = insertStep(next, board.id, item.uid);
    const saved = persist(before, next);
    const steps = defaultCase(saved.boards.find((b) => b.id === board.id)!).steps;
    expect(steps.map((s: any) => s.uid)).toEqual([
      first.uid,
      originalIds[0],
      middle.uid,
      ...originalIds.slice(1),
      last.uid,
    ]);
    expect(board.cases.filter((c: any) => c.uid !== item.uid)).toEqual(
      before.boards.find((b) => b.id === board.id)!.cases.filter((c: any) => c.uid !== item.uid),
    );
  });

  it('reordena e transfere um contexto com seus casos, responsáveis e funcionalidades', () => {
    const before = initial();
    const board = before.boards[0],
      destination = before.macros.find((m) => m.id !== board.macroId)!;
    const sibling = insertFront(before, board.macroId);
    before.responsibilities = [{ uid: 'owners', context: 'board:' + board.id, personIds: [] }];
    before.featureRouting = {
      F001: { boardId: board.id, macroId: board.macroId, release: 'Day-1' },
    };
    const next = clone(before);
    moveFront(next, sibling.id, board.macroId, board.id);
    let saved = persist(before, next);
    expect(saved.macros.find((m) => m.id === board.macroId)?.boards.slice(0, 2)).toEqual([
      sibling.id,
      board.id,
    ]);
    const moved = clone(saved);
    moveFront(moved, board.id, destination.id);
    saved = persist(saved, moved);
    const result = saved.boards.find((b) => b.id === board.id)!;
    expect(result).toMatchObject({
      name: board.name,
      ownerIds: board.ownerIds,
      macroId: destination.id,
    });
    expect(
      result.cases.every((c: any) => c.macroId === destination.id && c.boardId === board.id),
    ).toBe(true);
    expect(saved.responsibilities).toEqual(before.responsibilities);
    expect(saved.featureRouting.F001).toEqual({
      boardId: board.id,
      macroId: destination.id,
      release: 'Day-1',
    });
    expect(saved.macros.find((m) => m.id === board.macroId)?.boards).not.toContain(board.id);
    expect(saved.macros.find((m) => m.id === destination.id)?.boards.at(-1)).toBe(board.id);
  });

  it('reconstrói uma blueprint vazia e rejeita referências de outra hierarquia', () => {
    const next = initial();
    next.macros = [];
    next.boards = [];
    const macro = insertMacro(next),
      front = insertFront(next, macro.id);
    insertStep(next, front.id, defaultCase(front).uid);
    expect(() => validateWorkspace(next)).not.toThrow();
    const other = insertMacro(next),
      otherFront = insertFront(next, other.id);
    expect(() => insertFront(next, macro.id, otherFront.id)).toThrow();
    expect(() => moveFront(next, front.id, macro.id, otherFront.id)).toThrow();
    expect(() => insertStep(next, front.id, defaultCase(otherFront).uid)).toThrow();
    expect(() => insertMacro(next, 'missing')).toThrow();
  });
});
