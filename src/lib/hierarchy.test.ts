import { describe, it, expect } from 'vitest';
import { removeHierarchy } from './hierarchy';
import { normalizeImported, validateWorkspace, type WorkspaceData, defaultCase } from './domain';
import seed from '../data/seed.json';
const initial = () => normalizeImported(seed, seed as WorkspaceData);
describe('Exclusão de estruturas e integridade', () => {
  it('remove macroprocesso e contextos sem referências órfãs e preserva o conteúdo no JSON', () => {
    const s = initial(),
      macro = s.macros.find((m) => s.boards.some((b) => b.macroId === m.id))!,
      board = s.boards.find((b) => b.macroId === macro.id)!;
    s.featureRouting = { test: { boardId: board.id, macroId: macro.id, release: 'Release A' } };
    s.responsibilities = [
      { uid: 'assignment', context: 'board:' + board.id, capabilityId: 'cap', personIds: [] },
    ];
    removeHierarchy(s, { type: 'macro', id: macro.id });
    expect(s.boards.some((b) => b.macroId === macro.id)).toBe(false);
    expect(s.responsibilities).toHaveLength(0);
    expect(s.featureRouting.test).toEqual({ release: 'Release A' });
    expect(s.deletedItems.at(-1).boards[0].id).toBe(board.id);
    expect(() => validateWorkspace(s)).not.toThrow();
  });
  it('remove contexto sem afetar os demais e mantém o macroprocesso', () => {
    const s = initial(),
      front = s.boards[0];
    removeHierarchy(s, { type: 'front', boardId: front.id });
    expect(s.boards).toHaveLength(seed.boards.length - 1);
    expect(s.macros.some((m) => m.id === front.macroId)).toBe(true);
    expect(() => validateWorkspace(s)).not.toThrow();
  });
  it('remove somente a etapa escolhida no caso correto', () => {
    const s = initial(),
      front = s.boards.find((b) => defaultCase(b).steps.length)!;
    const item = defaultCase(front),
      id = item.steps[0].uid,
      count = item.steps.length;
    removeHierarchy(s, { type: 'step', boardId: front.id, caseId: item.uid, id });
    expect(item.steps).toHaveLength(count - 1);
    expect(s.deletedItems.at(-1).record.uid).toBe(id);
    expect(() => validateWorkspace(s)).not.toThrow();
  });
  it('permite excluir o último macroprocesso e contexto mantendo um workspace vazio válido', () => {
    const s = initial(),
      front = s.boards[0];
    s.boards = [front];
    s.macros = s.macros.filter((m) => m.id === front.macroId);
    removeHierarchy(s, { type: 'macro', id: front.macroId });
    expect(s.boards).toHaveLength(0);
    expect(s.macros).toHaveLength(0);
    expect(() => validateWorkspace(s)).not.toThrow();
  });
});
