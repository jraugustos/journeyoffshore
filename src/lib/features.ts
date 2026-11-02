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
      ...[...source.items, ...items].map(
        (item: RecordData) => Number(/^F(\d+)$/.exec(item.id)?.[1]) || 0,
      ),
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
