import { clone, type RecordData, type WorkspaceData } from './domain';
export function removeHierarchy(
  state: WorkspaceData,
  target: { type: string; id?: string; boardId?: string; caseId?: string },
) {
  const fronts =
    target.type === 'macro'
      ? state.boards.filter((b) => b.macroId === target.id)
      : state.boards.filter((b) => b.id === target.boardId);
  const entry: RecordData = {
    uid: crypto.randomUUID(),
    at: new Date().toISOString(),
    type: target.type,
  };
  if (target.type === 'step') {
    const item = fronts[0]?.cases.find((c: RecordData) => c.uid === target.caseId);
    const step = item?.steps.find((s: RecordData) => s.uid === target.id);
    if (!step) throw Error('Etapa não encontrada.');
    Object.assign(entry, { record: clone(step), boardId: target.boardId, caseId: target.caseId });
    item.steps = item.steps.filter((s: RecordData) => s.uid !== target.id);
  } else {
    const ids = new Set(fronts.map((b) => b.id));
    entry.boards = clone(fronts);
    if (target.type === 'macro') {
      entry.macro = clone(state.macros.find((m) => m.id === target.id));
      state.macros = state.macros.filter((m) => m.id !== target.id);
    }
    state.boards = state.boards.filter((b) => !ids.has(b.id));
    entry.responsibilities = (state.responsibilities || []).filter(
      (r: RecordData) =>
        ids.has(r.context?.replace(/^board:/, '')) ||
        (target.type === 'macro' && r.context === 'macro:' + target.id),
    );
    state.responsibilities = (state.responsibilities || []).filter(
      (r: RecordData) => !entry.responsibilities.includes(r),
    );
    entry.routing = {};
    for (const [id, r] of Object.entries(state.featureRouting || {}) as [string, RecordData][]) {
      if (ids.has(r.boardId) || (target.type === 'macro' && r.macroId === target.id)) {
        entry.routing[id] = clone(r);
        delete r.boardId;
        delete r.macroId;
      }
    }
    for (const macro of state.macros)
      macro.boards = state.boards.filter((b) => b.macroId === macro.id).map((b) => b.id);
  }
  state.deletedItems ??= [];
  state.deletedItems.push(entry);
}
