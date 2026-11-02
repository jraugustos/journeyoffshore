import { type WorkspaceData, type RecordData, defaultCase, coverage } from './domain';
import { workspaceMatrix } from './features';

const text = (value: any) => String(value ?? '');
const escape = (value: any) =>
  text(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export function csvCell(value: any) {
  let result = text(value);
  if (/^[\s]*[=+@-]/.test(result)) result = "'" + result;
  return '"' + result.replace(/"/g, '""') + '"';
}
export function csvExport(state: WorkspaceData, kind: string, matrix: RecordData) {
  matrix = workspaceMatrix(state, matrix);
  let headers: string[], rows: any[][];
  if (kind === 'cases') {
    headers = [
      'Macroprocesso',
      'Frente',
      'ID',
      'Caso',
      'Perfis',
      'Necessidade',
      'Gatilho',
      'Resultado',
      'Exceções',
      'Status',
    ];
    rows = state.boards.flatMap((board) =>
      board.cases.map((item: RecordData) => [
        state.macros.find((m) => m.id === board.macroId)?.name,
        board.name,
        item.ref,
        item.title,
        item.profiles.join(' / '),
        item.need,
        item.trigger,
        item.result,
        item.exception,
        item.status,
      ]),
    );
  } else if (['csd', 'actions', 'decisions'].includes(kind)) {
    const key = kind === 'actions' ? 'actionPlan' : kind;
    headers = [
      'Frente',
      'Tipo',
      'Título',
      'Detalhe',
      'Responsável',
      'Prazo',
      'Status',
      'Prioridade',
      'Marco',
      'Critério ou evidência',
    ];
    rows = state.boards.flatMap((board) =>
      (board[key] || []).map((item: RecordData) => [
        board.name,
        item.type,
        item.title,
        item.detail,
        item.owner,
        item.deadline,
        item.status,
        item.priority,
        item.horizon,
        item.acceptance || item.rationale || item.resolution,
      ]),
    );
  } else if (kind === 'features') {
    headers = [
      'ID',
      'Funcionalidade',
      'Público',
      'Marco original',
      'Marco revisto',
      'Cobertura',
      'RFI',
      'Observação',
    ];
    rows = matrix.items.map((item: RecordData) => [
      item.id,
      item.funcionalidade,
      item.publico,
      item.marco_produto,
      state.featureRouting?.[item.id]?.release,
      item.status_vendor,
      item.rfi_ids,
      item.observacao,
    ]);
  } else {
    headers = [
      'Macroprocesso',
      'Frente',
      'Status',
      'Campos preenchidos',
      'Total de campos',
      'Cobertura (%)',
      'Casos específicos',
      'Dúvidas abertas',
      'Decisões finais',
    ];
    rows = state.boards.map((board) => {
      const progress = coverage(board, state);
      return [
        state.macros.find((m) => m.id === board.macroId)?.name,
        board.name,
        board.status,
        progress.done,
        progress.total,
        progress.ratio,
        board.cases.filter((item: RecordData) => !item.isDefault).length,
        (board.csd || []).filter(
          (item: RecordData) => item.type === 'Dúvida' && item.status !== 'Resolvida',
        ).length,
        (board.decisions || []).filter((item: RecordData) => item.status === 'Decisão final')
          .length,
      ];
    });
  }
  return '\ufeff' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export function htmlExport(state: WorkspaceData, matrix: RecordData) {
  matrix = workspaceMatrix(state, matrix);
  const names = (kind: string, ids: string[] = []) =>
    ids
      .map((id) => (state[kind] || []).find((item: RecordData) => item.id === id)?.name || id)
      .join(', ');
  const pairs = (record: RecordData, keys: string[]) =>
    keys
      .filter((key) => record[key])
      .map(
        (key) =>
          `<dt>${escape(({ need: 'Necessidade', trigger: 'Gatilho', result: 'Resultado', exception: 'Exceções', title: 'Título', detail: 'Descrição', owner: 'Responsável', deadline: 'Prazo', status: 'Status', rationale: 'Justificativa', acceptance: 'Critério de conclusão', source: 'Fonte', resolution: 'Resposta' } as RecordData)[key] || key)}</dt><dd>${escape(record[key])}</dd>`,
      )
      .join('');
  const sections = state.macros
    .map(
      (macro) =>
        `<section><h2>${escape(macro.name)}</h2><p>${escape(macro.status)}</p>${state.boards
          .filter((board) => board.macroId === macro.id)
          .map(
            (board) =>
              `<article><h3>${escape(board.name)}</h3><p>${escape(board.summary)}</p>${board.cases.map((item: RecordData) => `<h4>${escape(item.title)}</h4><dl>${pairs(item, ['need', 'trigger', 'result', 'exception'])}</dl><div class="scroll"><table><thead><tr><th>Etapa</th><th>Objetivo</th><th>Ator</th><th>Canal</th><th>Operação</th><th>Sistema</th><th>Capacidades</th><th>Dados</th><th>Atendimento</th><th>Marco</th><th>Funcionalidades</th></tr></thead><tbody>${item.steps.map((step: RecordData) => `<tr>${[step.name, step.objective, names('actors', step.actorIds), names('channels', step.channelIds), (step.operationLinks || []).map((link: RecordData) => names('operations', [link.areaId]) + ': ' + link.role).join('; '), names('systems', step.systemIds), names('capabilities', step.capabilityIds), step.dataNotApplicable ? 'Sem dados adicionais' : (step.dataRequirements || []).map((data: RecordData) => data.name + ' — ' + names(data.providerKind, [data.providerId])).join('; '), step.support, step.release, (step.featureIds || []).map((id: string) => id + ' ' + (matrix.items.find((feature: RecordData) => feature.id === id)?.funcionalidade || '')).join('; ')].map((value) => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}${[
                ['offers', 'Oferta'],
                ['asis', 'AS-IS'],
                ['csd', 'CSD'],
                ['decisions', 'Decisões'],
                ['actionPlan', 'Plano de ação'],
              ]
                .map(([key, title]) =>
                  (board[key] || []).length
                    ? `<h4>${title}</h4>${board[key].map((record: RecordData) => `<dl>${pairs(record, ['title', 'step', 'detail', 'owner', 'deadline', 'status', 'rationale', 'acceptance', 'resolution', 'source'])}</dl>`).join('')}`
                    : '',
                )
                .join('')}</article>`,
          )
          .join('')}</section>`,
    )
    .join('');
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offshore Journey — exportação</title><style>body{font:15px/1.6 system-ui;color:#202024;margin:40px auto;padding:0 24px;max-width:1440px}h1{font-size:42px}h2{background:#202024;color:white;padding:16px}h3{font-size:27px}article{margin:30px 0}table{border-collapse:collapse;min-width:1100px;font-size:12px}th,td{border:1px solid #ddd;padding:12px;text-align:left;vertical-align:top;min-width:110px}.scroll{overflow:auto}dt{font-weight:600}dd{margin:0 0 10px;white-space:pre-wrap}button{padding:12px 16px;background:#111;color:white;border:0;border-radius:8px;cursor:pointer}@media print{button{display:none}.scroll{overflow:visible}table{min-width:0;font-size:8px}th,td{min-width:0;padding:4px}}</style><h1>Novas jornadas Offshore</h1><p>Cópia de consulta exportada em ${escape(new Date().toISOString())}. Os dados deste arquivo são independentes do projeto hospedado.</p><button id="backup">Baixar os dados desta cópia em JSON</button>${sections}<script type="application/json" id="workspace-data">${JSON.stringify(state).replace(/</g, '\\u003c')}</script><script>document.getElementById('backup').onclick=()=>{const blob=new Blob([document.getElementById('workspace-data').textContent],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='offshore-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};</script></html>`;
}
