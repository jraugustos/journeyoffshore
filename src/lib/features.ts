import { clone, type RecordData, type WorkspaceData } from './domain';

export function workspaceMatrix(state: WorkspaceData, source: RecordData): RecordData {
  return { ...source, items: state.featureCatalog ?? source.items };
}

export function editableFeatures(state: WorkspaceData, source: RecordData): RecordData[] {
  state.featureCatalog ??= clone(source.items);
  return state.featureCatalog;
}

export function createFeature(
  state: WorkspaceData,
  source: RecordData,
  name = 'Nova funcionalidade',
  defaults: RecordData = {},
) {
  const items = editableFeatures(state, source);
  const next =
    Math.max(
      0,
      ...[
        ...source.items,
        ...items,
        ...(state.deletedItems || [])
          .filter((item: RecordData) => item.type === 'feature')
          .map((item: RecordData) => item.record),
      ].map((item: RecordData) => Number(/^F(\d+)$/.exec(item.id)?.[1]) || 0),
    ) + 1;
  const feature = {
    publico: '',
    jornada: '',
    subjornada: '',
    marco_produto: '',
    status_vendor: 'A validar',
    rfi_ids: '',
    natureza: 'Definida no projeto',
    expectativa_ux: 'A validar',
    prioridade: '',
    observacao: '',
    fonte_rfi: '',
    fonte_timeline: '',
    ...defaults,
    id: 'F' + String(next).padStart(3, '0'),
    funcionalidade: name,
  };
  items.push(feature);
  return feature;
}

export function removeFeature(state: WorkspaceData, source: RecordData, id: string) {
  const items = editableFeatures(state, source);
  const feature = items.find((item) => item.id === id);
  if (!feature) throw new Error('Funcionalidade não encontrada.');
  const links: RecordData[] = [];
  for (const board of state.boards)
    for (const item of board.cases)
      for (const step of item.steps) {
        if (!step.featureIds?.includes(id)) continue;
        links.push({ boardId: board.id, caseId: item.uid, stepId: step.uid });
        step.featureIds = step.featureIds.filter((value: string) => value !== id);
      }
  state.deletedItems ??= [];
  state.deletedItems.push({
    uid: crypto.randomUUID(),
    at: new Date().toISOString(),
    type: 'feature',
    record: clone(feature),
    links,
    routing: clone(state.featureRouting?.[id] || {}),
  });
  state.featureCatalog = items.filter((item) => item.id !== id);
  if (state.featureRouting) delete state.featureRouting[id];
}
