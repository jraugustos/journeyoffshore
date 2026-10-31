'use strict';

// Validate before legacy migrations can fill defaults or filter malformed records.
// Unknown fields stay in the imported object for forward-compatible preservation.
function validateStateInput(input) {
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(input)) return 'O arquivo precisa conter um objeto de sessão.';
  if (![1, 2, 3, 4].includes(input.schema)) return 'A versão de estrutura do arquivo não é suportada.';
  if (!Array.isArray(input.boards) || !input.boards.length) return 'Nenhuma frente válida foi encontrada.';
  if (input.schema === 4 && (!Array.isArray(input.macros) || !input.macros.length)) {
    return 'A sessão precisa conter macroprocessos.';
  }
  if (input.session !== undefined && !object(input.session)) return 'A configuração da sessão é inválida.';
  if (input.featureRouting !== undefined && !object(input.featureRouting)) return 'A classificação das funcionalidades é inválida.';

  function checkRecords(records, label, idField, required = false) {
    if (records === undefined && !required) return '';
    if (!Array.isArray(records)) return label + ' precisa ser uma lista.';
    const seen = new Set();
    for (const record of records) {
      if (!object(record)) return label + ' contém um registro inválido.';
      const id = idField && record[idField];
      if (idField && (typeof id !== 'string' || !id.trim())) return label + ' contém um identificador vazio ou inválido.';
      if (idField && seen.has(id)) return label + ' contém um identificador duplicado: ' + id + '.';
      if (idField) seen.add(id);
    }
    return '';
  }

  let error = checkRecords(input.boards, 'Frentes', 'id', true);
  if (error) return error;
  if (input.schema === 4) {
    for (const kind of ['macros', 'people', 'actors', 'channels', 'systems', 'operations', 'capabilities']) {
      error = checkRecords(input[kind], 'Cadastro ' + kind, 'id', kind === 'macros');
      if (error) return error;
    }
    for (const kind of ['responsibilities', 'sharedRecords']) {
      error = checkRecords(input[kind], 'Registros ' + kind);
      if (error) return error;
    }
  }

  const caseIds = new Set();
  for (const board of input.boards) {
    if (input.schema === 4 && !input.macros.some(macro => macro.id === board.macroId)) {
      return 'A frente ' + board.id + ' referencia um macroprocesso inexistente.';
    }
    if (board.scope !== undefined && !object(board.scope)) return 'O recorte da frente ' + board.id + ' é inválido.';
    for (const kind of ['cases', 'offers', 'asis', 'profiles', 'blueprint', 'csd', 'notes', 'decisions', 'decisionHistory', 'actionPlan']) {
      error = checkRecords(board[kind], 'Registros ' + kind + ' da frente ' + board.id, input.schema === 4 && kind === 'cases' ? 'uid' : null);
      if (error) return error;
    }
    for (const kind of ['owners', 'ownerIds', 'progress']) {
      if (board[kind] !== undefined && !Array.isArray(board[kind])) return 'O campo ' + kind + ' da frente ' + board.id + ' precisa ser uma lista.';
    }
    if (input.schema !== 4) continue;
    if ((board.cases || []).filter(item => item.isDefault).length > 1) return 'A frente ' + board.id + ' contém mais de um caso padrão.';
    for (const useCase of board.cases || []) {
      if (caseIds.has(useCase.uid)) return 'Identificador de caso repetido entre frentes: ' + useCase.uid + '.';
      caseIds.add(useCase.uid);
      error = checkRecords(useCase.steps, 'Etapas do caso ' + useCase.uid, 'uid');
      if (error) return error;
      if (useCase.profiles !== undefined && !Array.isArray(useCase.profiles)) return 'Os perfis do caso precisam ser uma lista.';
      for (const step of useCase.steps || []) {
        for (const field of ['actorIds', 'channelIds', 'systemIds', 'capabilityIds', 'featureIds']) {
          if (step[field] !== undefined && (!Array.isArray(step[field]) || step[field].some(id => typeof id !== 'string'))) {
            return 'O campo ' + field + ' da etapa ' + step.uid + ' precisa ser uma lista de identificadores.';
          }
        }
        for (const field of ['operationLinks', 'dataRequirements']) {
          error = checkRecords(step[field], 'Registros ' + field + ' da etapa ' + step.uid);
          if (error) return error;
        }
      }
    }
  }
  return '';
}
