import { newFront, newStep, uid, type RecordData, type WorkspaceData } from './domain';

// Positions use stable IDs from the complete collection, including items hidden by filters.
function insertBefore(items: RecordData[], record: RecordData, beforeId?: string, key = 'id') {
  const index = beforeId ? items.findIndex((item) => item[key] === beforeId) : items.length;
  if (index < 0) throw new Error('A posição mudou. Atualize a página e tente novamente.');
  items.splice(index, 0, record);
}

function syncFronts(state: WorkspaceData) {
  for (const macro of state.macros)
    macro.boards = state.boards
      .filter((board) => board.macroId === macro.id)
      .map((board) => board.id);
}

export function insertMacro(state: WorkspaceData, beforeId?: string) {
  const macro = {
    id: uid(),
    name: 'Novo macroprocesso',
    short: 'Novo macroprocesso',
    status: 'Em definição',
    ownerIds: [],
    boards: [],
  };
  insertBefore(state.macros, macro, beforeId);
  return macro;
}

export function insertFront(state: WorkspaceData, macroId: string, beforeId?: string) {
  if (!state.macros.some((macro) => macro.id === macroId))
    throw new Error('Macroprocesso não encontrado.');
  if (beforeId && !state.boards.some((board) => board.id === beforeId && board.macroId === macroId))
    throw new Error('A posição não pertence a este macroprocesso.');
  const front = newFront(macroId, 'Novo contexto / produto');
  insertBefore(state.boards, front, beforeId);
  syncFronts(state);
  return front;
}

export function insertStep(
  state: WorkspaceData,
  boardId: string,
  caseId: string,
  beforeId?: string,
) {
  const item = state.boards
    .find((board) => board.id === boardId)
    ?.cases.find((row: RecordData) => row.uid === caseId);
  if (!item) throw new Error('Caso de uso não encontrado.');
  const step = newStep();
  insertBefore(item.steps, step, beforeId, 'uid');
  return step;
}

export function moveFront(
  state: WorkspaceData,
  boardId: string,
  macroId: string,
  beforeId?: string,
) {
  const front = state.boards.find((board) => board.id === boardId);
  if (!front || !state.macros.some((macro) => macro.id === macroId))
    throw new Error('Contexto ou macroprocesso não encontrado.');
  if (beforeId === boardId) return;
  if (beforeId && !state.boards.some((board) => board.id === beforeId && board.macroId === macroId))
    throw new Error('A posição não pertence a este macroprocesso.');
  state.boards = state.boards.filter((board) => board.id !== boardId);
  front.macroId = macroId;
  for (const item of front.cases) item.macroId = macroId;
  for (const routing of Object.values(state.featureRouting || {}) as RecordData[])
    if (routing.boardId === boardId) routing.macroId = macroId;
  insertBefore(state.boards, front, beforeId);
  syncFronts(state);
}
