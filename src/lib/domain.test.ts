import { describe, expect, it } from 'vitest';
import {
  clone,
  validateWorkspace,
  newFront,
  newStep,
  copyCase,
  defaultCase,
  normalizeImported,
  coverage,
  type WorkspaceData,
} from './domain';
import { applyChanges, diffState, ConflictError } from './changes';
import { csvExport, htmlExport } from './exports';
import seed from '../data/seed.json';
import matrix from '../data/matrix.json';

const initial = () => normalizeImported(seed, seed as WorkspaceData);
describe('Estrutura e preservação', () => {
  it('preserva o estado inicial e seus arquivos históricos', () => {
    const state = initial();
    expect(state.macros).toHaveLength(4);
    expect(state.boards).toHaveLength(8);
    expect(state.v13ArchivedDefaults.removedCases).toHaveLength(15);
    expect(state).toEqual(normalizeImported(state, state));
  });
  it('adiciona macroprocesso e frente e renomeia sem perder os vínculos', () => {
    const state = initial(),
      next = clone(state),
      id = 'new-macro';
    next.macros.push({
      id,
      name: 'Novo macroprocesso',
      short: 'Novo',
      status: 'Em definição',
      ownerIds: [],
      boards: [],
    });
    const front = newFront(id);
    next.boards.push(front);
    const applied = validateWorkspace(applyChanges(state, diffState(state, next)));
    expect(applied.macros.find((macro) => macro.id === id)?.boards).toEqual([front.id]);
    const renamed = clone(applied);
    renamed.macros.find((macro) => macro.id === id)!.name = 'Serviço transversal';
    const final = applyChanges(applied, diffState(applied, renamed));
    expect(final.boards.find((board) => board.id === front.id)?.macroId).toBe(id);
    expect(defaultCase(final.boards.find((board) => board.id === front.id)!)).toBeTruthy();
  });
  it('copia caso e dados com novos IDs e preserva seu contexto', () => {
    const state = initial(),
      board = state.boards[1],
      source = defaultCase(board);
    source.need = 'Concluir a entrada';
    source.steps[0].dataRequirements = [
      { uid: 'original-data', name: 'Identificador', providerKind: '', providerId: '' },
    ];
    const copied = copyCase(source, board);
    expect(copied.uid).not.toBe(source.uid);
    expect(copied.need).toBe(source.need);
    expect(copied.steps[0].uid).not.toBe(source.steps[0].uid);
    expect(copied.steps[0].dataRequirements[0].uid).not.toBe('original-data');
  });
  it('rejeita macroprocesso inexistente, IDs repetidos e decisão final incompleta', () => {
    const invalid = initial();
    invalid.boards[0].macroId = 'missing';
    expect(() => validateWorkspace(invalid)).toThrow();
    const duplicate = initial();
    duplicate.macros.push(clone(duplicate.macros[0]));
    expect(() => validateWorkspace(duplicate)).toThrow();
    const decision = initial();
    decision.boards[0].decisions.push({ uid: 'd', title: 'Decisão', status: 'Decisão final' });
    expect(() => validateWorkspace(decision)).toThrow();
  });
  it('preserva o original nas migrações de versões anteriores', () => {
    for (const schema of [1, 2, 3]) {
      const old = {
        schema,
        session: { title: 'Anterior' },
        boards: [
          {
            id: 'onboarding',
            cases: [{ uid: 'old', title: 'Caso anterior', flow: 'Entrada → Análise' }],
          },
        ],
      };
      const next = normalizeImported(old, initial());
      expect(next.migrationArchive).toEqual(old);
      expect(
        next.boards
          .find((board) => board.id === 'onboarding')!
          .cases.some((item: any) => item.uid === 'old'),
      ).toBe(true);
    }
  });
});
describe('Gravações concorrentes', () => {
  it('combina edições em campos diferentes', () => {
    const state = initial(),
      a = clone(state),
      b = clone(state);
    a.macros[0].name = 'Prospecção revisada';
    b.macros[0].status = 'Priorizado';
    const first = applyChanges(state, diffState(state, a));
    const merged = applyChanges(first, diffState(state, b));
    expect(merged.macros[0].name).toBe('Prospecção revisada');
    expect(merged.macros[0].status).toBe('Priorizado');
  });
  it('recusa alterações conflitantes sem modificar o estado', () => {
    const state = initial(),
      a = clone(state),
      b = clone(state);
    a.macros[0].name = 'A';
    b.macros[0].name = 'B';
    const saved = applyChanges(state, diffState(state, a));
    expect(() => applyChanges(saved, diffState(state, b))).toThrow(ConflictError);
    expect(saved.macros[0].name).toBe('A');
  });
  it('aceita repetição idempotente de uma solicitação já gravada', () => {
    const state = initial(),
      next = clone(state);
    next.macros[0].name = 'Atualizado';
    const delta = diffState(state, next);
    const saved = applyChanges(state, delta);
    expect(applyChanges(saved, delta)).toEqual(saved);
  });
});
describe('Cobertura e exportação', () => {
  it('calcula oito verificações e reconhece dispensa explícita de dados', () => {
    const state = initial(),
      board = state.boards[1];
    defaultCase(board).steps = [newStep('Teste')];
    const step = defaultCase(board).steps[0];
    expect(coverage(board, state).total).toBe(8);
    step.dataNotApplicable = true;
    step.objective = 'Consultar';
    expect(coverage(board, state).done).toBe(2);
  });
  it('exporta CSV com acentos e proteção de fórmulas', () => {
    const state = initial();
    state.boards[0].cases[0].title = '=HYPERLINK("x")';
    const csv = csvExport(state, 'cases', matrix);
    expect(csv.startsWith('\ufeff')).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('Prospecção');
  });
  it('escapa textos e inclui a base completa no HTML de consulta', () => {
    const state = initial();
    state.boards[0].cases[0].need = '</script><script>injected()</script>';
    const html = htmlExport(state, matrix);
    expect(html).not.toContain('</script><script>injected()');
    expect(html).toContain('workspace-data');
    expect(html).toContain('v13ArchivedDefaults');
  });
});
