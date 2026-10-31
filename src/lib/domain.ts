import { z } from 'zod';

export type RecordData = Record<string, any>;
export type WorkspaceData = RecordData & {
  schema: 4;
  session: RecordData;
  macros: RecordData[];
  boards: RecordData[];
};
export const STATUSES = ['Em definição', 'Priorizado', 'Não priorizado', 'Desativado'];
export const PROFILES = ['Private Offshore', 'Private Onshore', 'Special e Person', 'US Person'];
export const RELEASES = ['Day-1', 'Release A', 'Release B', 'Release C', 'Release D'];
export const OBJECTIVES = [
  'Contratar',
  'Consultar',
  'Gerenciar',
  'Resgatar',
  'Transacionar',
  'Cancelar',
];
export const REGISTRIES = [
  'people',
  'actors',
  'channels',
  'operations',
  'systems',
  'capabilities',
] as const;
export const REGISTRY_LABELS: Record<string, string> = {
  people: 'Pessoas',
  actors: 'Atores',
  channels: 'Canais',
  operations: 'Áreas operacionais',
  systems: 'Sistemas',
  capabilities: 'Capacidades',
};
export const uid = () => crypto.randomUUID();
export const clone = <T>(data: T): T => structuredClone(data);
export const meaningful = (value: unknown) =>
  typeof value === 'string' &&
  !!value.trim() &&
  !/^(a definir|a detalhar|a validar|pendente|[-—])\.?$/i.test(value.trim());
export const defaultCase = (board: RecordData) =>
  board.cases?.find((item: RecordData) => item.isDefault);

const recordSchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().trim().min(1, 'Informe o nome antes de continuar.').max(500),
  })
  .passthrough();
const stepSchema = z
  .object({
    uid: z.string().min(1),
    name: z.string().min(1, 'Informe o nome da etapa.').max(2000),
    actorIds: z.array(z.string()).optional(),
    channelIds: z.array(z.string()).optional(),
    systemIds: z.array(z.string()).optional(),
    capabilityIds: z.array(z.string()).optional(),
    featureIds: z.array(z.string()).optional(),
    operationLinks: z
      .array(z.object({ areaId: z.string(), role: z.string() }).passthrough())
      .optional(),
    dataRequirements: z
      .array(
        z
          .object({
            uid: z.string(),
            name: z.string(),
            providerKind: z.enum(['', 'systems', 'capabilities']),
            providerId: z.string(),
            note: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
const caseSchema = z
  .object({
    uid: z.string().min(1),
    title: z.string().min(1, 'Informe o nome do caso de uso.'),
    isDefault: z.boolean(),
    profiles: z.array(z.string()),
    steps: z.array(stepSchema),
  })
  .passthrough();
const boardSchema = recordSchema.extend({ macroId: z.string().min(1), cases: z.array(caseSchema) });
export const workspaceSchema = z
  .object({
    schema: z.literal(4),
    session: z.record(z.string(), z.unknown()),
    macros: z.array(recordSchema),
    boards: z.array(boardSchema),
    people: z.array(recordSchema),
    actors: z.array(recordSchema),
    channels: z.array(recordSchema),
    operations: z.array(recordSchema),
    systems: z.array(recordSchema),
    capabilities: z.array(recordSchema),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    const error = (message: string) => ctx.addIssue({ code: 'custom', message });
    for (const kind of ['macros', 'boards', ...REGISTRIES] as const) {
      const ids = data[kind].map((item) => item.id);
      if (new Set(ids).size !== ids.length) error('Há identificadores duplicados em ' + kind + '.');
    }
    const caseIds = new Set<string>();
    for (const board of data.boards) {
      if (!data.macros.some((macro) => macro.id === board.macroId))
        error('A frente ' + board.name + ' não possui macroprocesso válido.');
      if (board.cases.filter((item) => item.isDefault).length !== 1)
        error('Cada frente precisa ter exatamente um caso padrão.');
      for (const decision of (board.decisions || []) as RecordData[]) {
        if (
          decision.status === 'Decisão final' &&
          (!decision.owner?.trim() || !decision.rationale?.trim())
        )
          error('Decisões finais precisam de responsável e justificativa.');
      }
      for (const item of board.cases) {
        if (caseIds.has(item.uid)) error('Há casos com identificador duplicado.');
        caseIds.add(item.uid);
        if (new Set(item.steps.map((step) => step.uid)).size !== item.steps.length)
          error('Há etapas com identificador duplicado.');
        for (const step of item.steps) {
          if (step.dataNotApplicable && step.dataRequirements?.length)
            error('Uma etapa não pode dispensar dados e manter dados cadastrados.');
        }
      }
    }
  });

export function validateWorkspace(input: unknown): WorkspaceData {
  const result = workspaceSchema.safeParse(input);
  if (!result.success)
    throw new Error(result.error.issues[0]?.message || 'Estrutura de dados inválida.');
  return result.data as WorkspaceData;
}

export function newStep(name = 'Nova etapa'): RecordData {
  return {
    uid: uid(),
    name,
    objective: '',
    release: '',
    status: 'Em definição',
    actorIds: [],
    channelIds: [],
    systemIds: [],
    operationLinks: [],
    capabilityIds: [],
    featureIds: [],
    dataRequirements: [],
    dataNotApplicable: false,
    support: '',
    capabilityNotes: '',
    notes: '',
    nature: 'Preenchimento do workshop',
  };
}
export function newCase(board: RecordData, standard = false): RecordData {
  return {
    uid: uid(),
    boardId: board.id,
    macroId: board.macroId,
    title: standard ? 'Padrão' : 'Novo caso de uso',
    ref: standard ? 'PADRÃO' : '',
    isDefault: standard,
    profiles: standard ? [...PROFILES] : [PROFILES[0]],
    status: 'Em definição',
    need: '',
    trigger: '',
    result: '',
    exception: '',
    steps: [],
  };
}
export function newFront(macroId: string, name = 'Nova frente'): RecordData {
  const board: RecordData = {
    id: uid(),
    macroId,
    name,
    short: name,
    status: 'Em definição',
    ownerIds: [],
    owners: [],
    summary: '',
    scope: { offerDefinition: '', problem: '', within: '', outside: '', value: '' },
    offers: [],
    asis: [],
    profiles: [],
    cases: [],
    csd: [],
    notes: [],
    decisions: [],
    decisionHistory: [],
    actionPlan: [],
    progress: [0, 0, 0, 0, 0, 0],
    blueprintProgress: 0,
  };
  board.cases = [newCase(board, true)];
  return board;
}
export function copyCase(source: RecordData, board: RecordData): RecordData {
  const result: RecordData = {
    ...clone(source),
    uid: uid(),
    isDefault: false,
    ref: '',
    boardId: board.id,
    macroId: board.macroId,
    title: source.title + ' — cópia',
    copiedFrom: source.uid,
  };
  result.steps = source.steps.map((step: RecordData) => ({
    ...clone(step),
    uid: uid(),
    copiedFrom: { caseId: source.uid, stepId: step.uid },
    dataRequirements: (step.dataRequirements || []).map((data: RecordData) => ({
      ...data,
      uid: uid(),
    })),
  }));
  return result;
}
export function coverage(board: RecordData, state: WorkspaceData) {
  const steps = (defaultCase(board)?.steps || []).filter(
    (step: RecordData) => step.status !== 'Desativado',
  );
  const exists = (kind: string, id: string) =>
    (state[kind] || []).some((record: RecordData) => record.id === id);
  let done = 0;
  for (const step of steps) {
    const linked = (key: string, kind: string) => step[key]?.some((id: string) => exists(kind, id));
    const data =
      step.dataNotApplicable ||
      (step.dataRequirements?.length &&
        step.dataRequirements.every(
          (item: RecordData) =>
            meaningful(item.name) &&
            ['systems', 'capabilities'].includes(item.providerKind) &&
            exists(item.providerKind, item.providerId),
        ));
    done += [
      linked('actorIds', 'actors'),
      linked('channelIds', 'channels'),
      step.operationLinks?.length &&
        step.operationLinks.every(
          (link: RecordData) => exists('operations', link.areaId) && meaningful(link.role),
        ),
      linked('systemIds', 'systems'),
      linked('capabilityIds', 'capabilities') || meaningful(step.capabilityNotes),
      data,
      meaningful(step.support),
      OBJECTIVES.includes(step.objective),
    ].filter(Boolean).length;
  }
  const total = steps.length * 8;
  return { done, total, steps: steps.length, ratio: total ? Math.round((done / total) * 100) : 0 };
}

export function normalizeImported(input: RecordData, template: WorkspaceData): WorkspaceData {
  if (!input || !Array.isArray(input.boards))
    throw new Error('O arquivo não contém uma sessão válida.');
  let output = clone(input);
  if ([1, 2, 3].includes(input.schema)) {
    output = clone(template);
    output.session = { ...output.session, ...input.session };
    output.migrationArchive = clone(input);
    const aliases: Record<string, string> = {
      accounts: 'banking',
      payments: 'banking',
      onboarding: 'onboarding',
      wealth: 'wealth',
      cards: 'cards',
    };
    const initialized = new Set<string>();
    for (const old of input.boards) {
      const board = output.boards.find((item: RecordData) => item.id === aliases[old.id]);
      if (!board) {
        output.sharedRecords = [...(output.sharedRecords || []), old];
        continue;
      }
      if (!initialized.has(board.id)) {
        for (const key of [
          'offers',
          'asis',
          'csd',
          'decisions',
          'decisionHistory',
          'actionPlan',
          'notes',
        ])
          board[key] = [];
        board.cases = [newCase(board, true)];
        initialized.add(board.id);
      }
      for (const key of [
        'offers',
        'asis',
        'csd',
        'decisions',
        'decisionHistory',
        'actionPlan',
        'notes',
      ])
        board[key].push(...(old[key] || []));
      if (old.scope) board.scope = { ...board.scope, ...old.scope };
      for (const previous of old.cases || []) {
        const item = {
          ...clone(previous),
          uid: previous.uid || uid(),
          isDefault: false,
          profiles: previous.profiles || [],
          boardId: board.id,
          macroId: board.macroId,
          title: previous.title || 'Caso importado',
          steps: (previous.flow || '')
            .split('→')
            .map((name: string) => name.trim())
            .filter(Boolean)
            .map(newStep),
        };
        board.cases.push(item);
      }
    }
  }
  if (output.schema !== 4) throw new Error('Versão de dados não suportada.');
  for (const kind of REGISTRIES) output[kind] ??= [];
  for (const board of output.boards) {
    board.cases ??= [];
    if (!board.cases.some((item: RecordData) => item.isDefault))
      board.cases.unshift(newCase(board, true));
    for (const item of board.cases) {
      item.steps ??= [];
      item.profiles ??= [];
      item.boardId = board.id;
      item.macroId = board.macroId;
      for (const step of item.steps) Object.assign(step, { ...newStep(step.name), ...step });
    }
    for (const key of [
      'offers',
      'asis',
      'csd',
      'decisions',
      'decisionHistory',
      'actionPlan',
      'notes',
      'ownerIds',
    ])
      board[key] ??= [];
    board.scope ??= {};
  }
  output.formatVersion = '19.0';
  return validateWorkspace(output);
}
