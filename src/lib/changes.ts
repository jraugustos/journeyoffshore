import { clone, type RecordData, type WorkspaceData } from './domain';

export type Change = {
  collection: 'state' | 'macros' | 'boards';
  id?: string;
  field: string;
  before?: any;
  value?: any;
  remove?: boolean;
};
export class ConflictError extends Error {
  constructor(public conflicts: Change[]) {
    super('O mesmo conteúdo foi alterado em outra sessão.');
  }
}
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export const equal = (a: any, b: any) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

export function diffState(before: WorkspaceData, after: WorkspaceData): Change[] {
  const changes: Change[] = [];
  const keys = (a: RecordData, b: RecordData) =>
    [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => !forbidden.has(key));
  for (const key of keys(before, after)) {
    if (['macros', 'boards', 'updatedAt'].includes(key)) continue;
    if (!equal(before[key], after[key]))
      changes.push({
        collection: 'state',
        field: key,
        before: before[key],
        value: after[key],
        remove: !(key in after),
      });
  }
  for (const collection of ['macros', 'boards'] as const) {
    const old = new Map(before[collection].map((item) => [item.id, item]));
    const next = new Map(after[collection].map((item) => [item.id, item]));
    for (const [id, record] of next) {
      if (!old.has(id)) {
        changes.push({ collection, id, field: '$record', value: record });
        continue;
      }
      for (const field of keys(old.get(id)!, record)) {
        if (['id', 'updatedAt'].includes(field) || (collection === 'macros' && field === 'boards'))
          continue;
        if (!equal(old.get(id)![field], record[field]))
          changes.push({
            collection,
            id,
            field,
            before: old.get(id)![field],
            value: record[field],
            remove: !(field in record),
          });
      }
    }
    for (const [id, record] of old)
      if (!next.has(id))
        changes.push({ collection, id, field: '$record', before: record, remove: true });
    if (!equal([...old.keys()], [...next.keys()]))
      changes.push({
        collection,
        field: '$order',
        before: [...old.keys()],
        value: [...next.keys()],
      });
  }
  return changes;
}

export function applyChanges(source: WorkspaceData, changes: Change[]): WorkspaceData {
  const valueAt = (change: Change) => {
    if (change.collection === 'state') return source[change.field];
    if (change.field === '$order') return source[change.collection].map((item) => item.id);
    const record = source[change.collection].find((item) => item.id === change.id);
    return change.field === '$record' ? record : record?.[change.field];
  };
  const conflicts = changes.filter((change) => {
    if (forbidden.has(change.field) || forbidden.has(change.id || ''))
      throw new Error('Campo inválido.');
    if (change.collection === 'state' && ['macros', 'boards', 'schema'].includes(change.field))
      throw new Error('Alteração estrutural inválida.');
    return (
      !equal(valueAt(change), change.before) &&
      !equal(valueAt(change), change.remove ? undefined : change.value)
    );
  });
  if (conflicts.length) throw new ConflictError(conflicts);
  const result = clone(source);
  for (const change of changes.filter((item) => item.field !== '$order')) {
    let target: RecordData = result;
    if (change.collection !== 'state') {
      const items = result[change.collection];
      if (change.field === '$record') {
        if (change.remove)
          result[change.collection] = items.filter((item) => item.id !== change.id);
        else {
          const index = items.findIndex((item) => item.id === change.id);
          if (index < 0) items.push(clone(change.value));
          else items[index] = clone(change.value);
        }
        continue;
      }
      target = items.find((item) => item.id === change.id)!;
      if (!target) throw new ConflictError([change]);
    }
    if (change.remove) delete target[change.field];
    else target[change.field] = clone(change.value);
  }
  for (const change of changes.filter((item) => item.field === '$order')) {
    if (change.collection === 'state') throw new Error('Ordem inválida.');
    const items = result[change.collection];
    const order = change.value as string[];
    result[change.collection] = [
      ...order
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is RecordData => !!item),
      ...items.filter((item) => !order.includes(item.id)),
    ];
  }
  for (const macro of result.macros)
    macro.boards = result.boards
      .filter((board) => board.macroId === macro.id)
      .map((board) => board.id);
  return result;
}
