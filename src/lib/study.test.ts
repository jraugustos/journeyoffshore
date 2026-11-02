import { describe, it, expect } from 'vitest';
import {
  clone,
  normalizeImported,
  defaultCase,
  validateWorkspace,
  copyCase,
  type WorkspaceData,
} from './domain';
import { workspaceMatrix, createFeature, editableFeatures } from './features';
import { deepTimeline } from './deepTimeline';
import { diffState, applyChanges } from './changes';
import { csvExport, htmlExport } from './exports';
import seed from '../data/seed.json';
import matrix from '../data/matrix.json';
const initial = () => normalizeImported(seed, seed as WorkspaceData);
describe('Catálogo editável e roadmap aprofundado', () => {
  it('cria códigos únicos e persiste definições sem alterar a referência original', () => {
    const before = initial(),
      next = clone(before),
      snapshot = clone(matrix);
    const f = createFeature(next, matrix, 'Nova capacidade funcional');
    const second = createFeature(next, matrix, 'Outra funcionalidade');
    expect(f.id).toBe('F086');
    expect(second.id).toBe('F087');
    editableFeatures(next, matrix)[0].funcionalidade = 'Referência aprofundada';
    const saved = validateWorkspace(applyChanges(before, diffState(before, next)));
    expect(workspaceMatrix(saved, matrix).items[0].funcionalidade).toBe('Referência aprofundada');
    expect(matrix).toEqual(snapshot);
    expect(csvExport(saved, 'features', matrix)).toContain('Nova capacidade funcional');
    expect(htmlExport(saved, matrix)).toContain('Nova capacidade funcional');
    expect(normalizeImported(JSON.parse(JSON.stringify(saved)), initial()).featureCatalog).toEqual(
      saved.featureCatalog,
    );
  });
  it('rejeita nomes vazios e códigos duplicados', () => {
    const s = initial();
    createFeature(s, matrix, '');
    expect(() => validateWorkspace(s)).toThrow();
    s.featureCatalog.at(-1).funcionalidade = 'Título válido';
    s.featureCatalog.push(clone(s.featureCatalog[0]));
    expect(() => validateWorkspace(s)).toThrow();
  });
  it('produz uma linha por caso, com vários marcos e pendências sem herdar o plano original', () => {
    const s = initial(),
      board = s.boards.find((b) => defaultCase(b).steps.length >= 2)!;
    const standard = defaultCase(board);
    standard.steps = standard.steps.slice(0, 2);
    standard.steps[0].release = 'Release B';
    standard.steps[0].featureIds = ['F001'];
    standard.steps[1].release = '';
    const alternative = copyCase(standard, board);
    alternative.title = 'Abertura digital';
    alternative.steps[0].release = 'Release D';
    board.cases.push(alternative);
    const empty = copyCase(standard, board);
    empty.steps = [];
    board.cases.push(empty);
    const result = deepTimeline(s, workspaceMatrix(s, matrix))
      .flatMap((g) => g.contexts)
      .find((c) => c.board.id === board.id)!;
    const row = result.rows.find((r) => r.item.uid === standard.uid)!;
    expect(row.phases.map((p) => p.phase)).toEqual(['', 'Release B']);
    expect(row.phases[1].steps[0].features[0].id).toBe('F001');
    expect(
      result.rows.find((r) => r.item.uid === alternative.uid)!.phases.map((p) => p.phase),
    ).toEqual(['', 'Release D']);
    expect(result.rows.find((r) => r.item.uid === empty.uid)!.phases).toEqual([
      { phase: '', steps: [] },
    ]);
    standard.steps[0].release = 'Day-1';
    expect(
      deepTimeline(s, matrix)
        .flatMap((g) => g.contexts)
        .find((c) => c.board.id === board.id)!
        .rows.find((r) => r.item.uid === standard.uid)!
        .phases.map((p) => p.phase),
    ).toEqual(['', 'Day-1']);
  });
});
