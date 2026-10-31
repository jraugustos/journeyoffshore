'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  type RecordData,
  type WorkspaceData,
  STATUSES,
  PROFILES,
  RELEASES,
  OBJECTIVES,
  REGISTRY_LABELS,
  uid,
  defaultCase,
} from '@/lib/domain';

import { Country, PersonLabel, RecordTag, RecordIcon } from './Visuals';
import PhotoEditor from './PhotoEditor';
import FieldPopover, { fieldPanelId, type FieldAnchor } from './FieldPopover';
import {
  countryCode,
  countryName,
  COUNTRIES,
  RECORD_ICONS,
  SWATCHES,
  VISUAL_DEFAULTS,
} from '@/lib/presentation';

export type EditorTarget = {
  type: string;
  id?: string;
  boardId?: string;
  caseId?: string;
  registry?: string;
  section?: string;
  anchor?: FieldAnchor;
};
export function editorRecord(state: WorkspaceData, target: EditorTarget): RecordData | undefined {
  if (target.type === 'session') return state.session;
  if (target.type === 'macro') return state.macros.find((item) => item.id === target.id);
  if (target.type === 'registry')
    return state[target.registry!]?.find((item: RecordData) => item.id === target.id);
  if (target.type === 'assignment')
    return state.responsibilities?.find((item: RecordData) => item.uid === target.id);
  if (target.type === 'feature') return state.featureRouting?.[target.id!] || {};
  const board = state.boards.find((item) => item.id === target.boardId);
  if (!board) return;
  if (target.type === 'front') return board;
  if (target.type === 'scope') return board.scope;
  const item = board.cases.find((row: RecordData) => row.uid === target.caseId);
  if (target.type === 'case') return item;
  if (target.type === 'step') return item?.steps.find((step: RecordData) => step.uid === target.id);
  return board[target.type]?.find((row: RecordData) => row.uid === target.id);
}

export { default as SelectRecords } from './RecordPicker';
import SelectRecords from './RecordPicker';
const DEFINITIONS: Record<
  string,
  { title: string; fields: [string, string, string?, string[]?][] }
> = {
  session: {
    title: 'Configurar workshop',
    fields: [
      ['title', 'Nome do workshop'],
      ['date', 'Data', 'date'],
      ['facilitator', 'Facilitador'],
      ['participants', 'Participantes', 'textarea'],
      ['objective', 'Objetivo', 'textarea'],
    ],
  },
  scope: {
    title: 'Oferta e recorte',
    fields: [
      ['problem', 'Problema (o que queremos resolver)', 'textarea'],
      ['offerDefinition', 'Oferta', 'textarea'],
      ['within', 'Recorte', 'textarea'],
      ['outside', 'Fora do recorte', 'textarea'],
      ['value', 'Resultado esperado', 'textarea'],
    ],
  },
  offers: {
    title: 'Produto ou serviço',
    fields: [
      ['title', 'Produto ou serviço'],
      ['detail', 'O que vamos disponibilizar', 'textarea'],
      ['rules', 'Regras e condições', 'textarea'],
      ['horizon', 'Marco', 'select', ['A definir', ...RELEASES]],
      [
        'nature',
        'Natureza',
        'select',
        [
          'Referência do material',
          'Capacidade mapeada',
          'Hipótese de trabalho',
          'Decisão aprovada',
        ],
      ],
      [
        'status',
        'Situação',
        'select',
        ['Em discussão', 'A validar', 'Definido', 'Fora do recorte'],
      ],
    ],
  },
  asis: {
    title: 'Etapa AS-IS',
    fields: [
      ['step', 'Etapa'],
      ['where', 'Onde acontece'],
      ['who', 'Quem faz'],
      ['reference', 'Referência', 'textarea'],
      ['source', 'Fonte'],
    ],
  },
  csd: {
    title: 'Certeza, suposição ou dúvida',
    fields: [
      ['title', 'Título'],
      ['detail', 'Descrição', 'textarea'],
      ['type', 'Classificação', 'select', ['Certeza', 'Suposição', 'Dúvida']],
      ['priority', 'Prioridade', 'select', ['Alta', 'Média', 'Baixa']],
      [
        'status',
        'Status',
        'select',
        ['Aberta', 'Em validação', 'Em andamento', 'Registrada', 'Resolvida'],
      ],
      ['horizon', 'Marco', 'select', ['A definir', ...RELEASES]],
      ['owner', 'Responsável'],
      ['deadline', 'Prazo', 'date'],
      ['action', 'Próximo passo', 'textarea'],
      ['related', 'Área ou dependência'],
      ['source', 'Fonte'],
      ['resolution', 'Resposta ou evidência', 'textarea'],
    ],
  },
  decisions: {
    title: 'Decisão',
    fields: [
      ['title', 'Título'],
      ['detail', 'Contexto e alternativas', 'textarea'],
      ['owner', 'Responsável'],
      ['rationale', 'Escolha e justificativa', 'textarea'],
      ['horizon', 'Marco', 'select', ['A definir', ...RELEASES]],
      ['linkedQuestion', 'Dúvida relacionada'],
      ['reference', 'Referência'],
    ],
  },
  actionPlan: {
    title: 'Ação do plano',
    fields: [
      ['title', 'Ação ou entrega'],
      ['detail', 'O que será feito', 'textarea'],
      ['acceptance', 'Critério de conclusão', 'textarea'],
      ['owner', 'Responsável'],
      ['deadline', 'Prazo', 'date'],
      [
        'status',
        'Status',
        'select',
        ['Não iniciada', 'Em andamento', 'Aguardando definição', 'Concluída', 'Cancelada'],
      ],
      ['priority', 'Prioridade', 'select', ['Alta', 'Média', 'Baixa']],
      ['horizon', 'Marco', 'select', ['A definir', ...RELEASES]],
      ['source', 'Origem'],
    ],
  },
};

export default function Editor({
  state,
  target,
  matrix,
  change,
  close,
  status,
  error,
  onDelete,
}: {
  onDelete: (target: EditorTarget) => void;
  state: WorkspaceData;
  target: EditorTarget;
  matrix: RecordData;
  change: (recipe: (draft: WorkspaceData) => void, immediate?: boolean) => void;
  close: () => void;
  status: string;
  error: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const record = editorRecord(state, target);
  const board = state.boards.find((item) => item.id === target.boardId);
  const caseData = board?.cases.find((item: RecordData) => item.uid === target.caseId);
  const [localError, setLocalError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    if (!target.anchor) element?.showModal();
    return () => {
      element?.close();
    };
  }, []);
  useEffect(() => {
    const element = dialog.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([type=checkbox]), textarea, select',
    );
    element?.focus();
    if (element instanceof HTMLInputElement && element.type === 'text') element.select();
  }, [target.id, target.type]);
  if (!record) return null;
  function update(key: string, value: any, immediate = false) {
    change((draft) => {
      if (target.type === 'feature') {
        draft.featureRouting ??= {};
        draft.featureRouting[target.id!] ??= {};
      }
      const destination = editorRecord(draft, target)!;
      destination[key] = value;
      if (target.type === 'macro' && key === 'name') destination.short = value;
      if (target.type === 'front' && key === 'name') destination.short = value;
      if (target.type === 'front' && key === 'macroId')
        for (const item of destination.cases) item.macroId = value;
    }, immediate);
  }
  const field = (key: string, label: string, type = 'text', options: string[] = []) => (
    <label
      className={
        'oj-field ' +
        (type === 'textarea' || ['name', 'title', 'step', 'objective'].includes(key) ? 'full' : '')
      }
      key={key}
    >
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea
          name={key}
          value={record[key] || ''}
          rows={3}
          onChange={(event) => update(key, event.target.value)}
        />
      ) : type === 'select' ? (
        <select
          name={key}
          value={record[key] || ''}
          onChange={(event) => update(key, event.target.value, true)}
        >
          {[...new Set(['', ...options, ...(record[key] ? [record[key]] : [])])].map((value) => (
            <option value={value} key={value}>
              {value || 'A definir'}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={key}
          type={type}
          value={record[key] || ''}
          maxLength={type === 'text' ? 2000 : undefined}
          onChange={(event) => update(key, event.target.value)}
        />
      )}
    </label>
  );
  const options = (key: string, label: string, entries: RecordData[]) => (
    <label className="oj-field" key={key}>
      <span>{label}</span>
      <select
        name={key}
        value={record[key] || ''}
        onChange={(event) => update(key, event.target.value, true)}
      >
        <option value="">A definir</option>
        {entries.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
  function createLinked(kind: string, key: string, name: string) {
    change((draft) => {
      const id = uid();
      draft[kind] ??= [];
      draft[kind].push({ id, name, status: 'Ativo', description: '', ...VISUAL_DEFAULTS[kind] });
      const destination = editorRecord(draft, target)!;
      if (key === 'operationLinks')
        destination.operationLinks = [
          ...(destination.operationLinks || []),
          { areaId: id, role: '' },
        ];
      else destination[key] = [...(destination[key] || []), id];
    }, true);
  }
  const picker = (kind: string, key: string, label = REGISTRY_LABELS[kind]) => (
    <SelectRecords
      key={kind}
      inline={!!target.anchor}
      kind={kind}
      label={label}
      records={state[kind] || []}
      selected={record[key] || []}
      onChange={(ids) => update(key, ids, true)}
      onCreate={(name) => createLinked(kind, key, name)}
    />
  );
  let title = DEFINITIONS[target.type]?.title || 'Editar registro';
  let body: React.ReactNode;
  if (target.type === 'macro') {
    title = 'Editar macroprocesso';
    body = (
      <>
        {field('name', 'Nome do macroprocesso')}
        {field('status', 'Status', 'select', STATUSES)}
        <label className="oj-field">
          <span>Posição no blueprint</span>
          <select
            aria-label="Posição no blueprint"
            value={state.macros.findIndex((item) => item.id === record.id)}
            onChange={(event) =>
              change((draft) => {
                const from = draft.macros.findIndex((item) => item.id === record.id);
                const [item] = draft.macros.splice(from, 1);
                draft.macros.splice(Number(event.target.value), 0, item);
              }, true)
            }
          >
            {state.macros.map((item, index) => (
              <option value={index} key={item.id}>
                {index + 1} — {item.name}
              </option>
            ))}
          </select>
        </label>
        {record.ownerIds?.length > 0 && (
          <p className="oj-context">
            Atribuição anterior do macroprocesso preservada no backup. Defina agora os responsáveis
            em cada contexto/produto.
          </p>
        )}
        <div className="oj-context">
          {state.boards.filter((item) => item.macroId === record.id).length} frentes vinculadas.
          Nome e posição são atualizados em todas as visões. Os responsáveis pertencem aos
          contextos/produtos.
        </div>
      </>
    );
  } else if (target.type === 'front') {
    title = 'Editar frente';
    body = (
      <>
        {!target.section && field('name', 'Nome da frente')}
        {!target.section && field('summary', 'Descrição', 'textarea')}
        {!target.section && options('macroId', 'Macroprocesso', state.macros)}
        {!target.section && field('status', 'Status', 'select', STATUSES)}
        {picker('people', 'ownerIds', 'Responsáveis pelo contexto / produto')}
      </>
    );
  } else if (target.type === 'case') {
    title = 'Editar caso de uso';
    body = (
      <>
        {field('title', 'Nome do caso de uso')}
        {field('ref', 'Identificação')}
        {field('status', 'Status', 'select', STATUSES)}
        {!record.isDefault ? (
          <fieldset className="oj-picker">
            <legend>Perfis aplicáveis</legend>
            {PROFILES.map((profile) => (
              <label className="oj-check" key={profile}>
                <input
                  type="checkbox"
                  checked={record.profiles.includes(profile)}
                  onChange={(event) =>
                    update(
                      'profiles',
                      event.target.checked
                        ? [...record.profiles, profile]
                        : record.profiles.filter((item: string) => item !== profile),
                      true,
                    )
                  }
                />
                {profile}
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="oj-context">O caso padrão é a referência comum da frente.</p>
        )}
        {field('need', 'Necessidade do cliente', 'textarea')}
        {field('trigger', 'Gatilho de início', 'textarea')}
        {field('result', 'Resultado esperado', 'textarea')}
        {field('exception', 'Exceções e condições', 'textarea')}
      </>
    );
  } else if (target.type === 'registry') {
    title = 'Editar cadastro — ' + REGISTRY_LABELS[target.registry!];
    body = (
      <>
        {field('name', 'Nome')}
        {field('description', 'Descrição', 'textarea')}
        {target.registry === 'people' && (
          <>
            <PhotoEditor
              key={record.id}
              person={record}
              onChange={(photo) => update('photo', photo, true)}
            />
            {field('role', 'Papel ou área')}
            {field('email', 'E-mail', 'email')}
          </>
        )}
        {target.registry === 'capabilities' &&
          picker('people', 'ownerIds', 'Responsáveis de referência pela capacidade')}
        {target.registry === 'operations' && (
          <fieldset className="oj-picker full">
            <legend>País da operação</legend>
            <div className="oj-country-options">
              {[
                ...COUNTRIES,
                ...(record.country &&
                !COUNTRIES.some(([code]) => code === countryCode(record.country))
                  ? [[record.country, countryName(record.country)]]
                  : []),
              ].map(([code]) => (
                <label className="oj-visual-choice" key={code}>
                  <input
                    type="radio"
                    name="country"
                    value={code}
                    checked={countryCode(record.country || '') === code}
                    onChange={() => update('country', code, true)}
                  />
                  <Country value={code} />
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {field('status', 'Status', 'select', ['Ativo', 'Inativo'])}
        {target.registry !== 'people' && (
          <>
            <fieldset className="oj-picker full">
              <legend>Cor e ícone</legend>
              <div className="oj-swatch-options">
                {SWATCHES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className="oj-swatch"
                    aria-label={'Usar cor ' + color}
                    aria-pressed={
                      (record.color || VISUAL_DEFAULTS[target.registry!]?.color) === color
                    }
                    style={{ backgroundColor: color }}
                    onClick={() => update('color', color, true)}
                  />
                ))}
                <label className="oj-custom-color">
                  Cor personalizada
                  <input
                    type="color"
                    aria-label="Cor personalizada"
                    value={record.color || VISUAL_DEFAULTS[target.registry!]?.color || '#626c7c'}
                    onChange={(event) => update('color', event.target.value, true)}
                  />
                </label>
              </div>
              <div className="oj-icon-options">
                {Object.entries(RECORD_ICONS).map(([icon, [label]]) => (
                  <label key={icon} className="oj-visual-choice" title={label}>
                    <input
                      type="radio"
                      name="icon"
                      value={icon}
                      checked={(record.icon || VISUAL_DEFAULTS[target.registry!]?.icon) === icon}
                      onChange={() => update('icon', icon, true)}
                    />
                    <RecordIcon icon={icon} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="oj-visual-preview">
                <span>Prévia</span>
                <RecordTag kind={target.registry!} record={record} />
              </div>
            </fieldset>
          </>
        )}
      </>
    );
  } else if (target.type === 'assignment') {
    title = 'Responsabilidade por capacidade';
    body = (
      <>
        {options('capabilityId', 'Capacidade', state.capabilities)}
        <label className="oj-field">
          <span>Cadastrar capacidade neste vínculo</span>
          <input
            placeholder="Nome da capacidade; Enter para criar"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                const name = event.currentTarget.value.trim();
                if (!name) return;
                change((draft) => {
                  const id = uid();
                  draft.capabilities.push({
                    id,
                    name,
                    status: 'Ativo',
                    ...VISUAL_DEFAULTS.capabilities,
                  });
                  editorRecord(draft, target)!.capabilityId = id;
                }, true);
                event.currentTarget.value = '';
              }
            }}
          />
        </label>
        <label className="oj-field">
          <span>Contexto</span>
          <select
            value={record.context || ''}
            onChange={(event) => update('context', event.target.value, true)}
          >
            <option value="">A definir</option>
            {state.macros
              .filter((item) => record.context === 'macro:' + item.id)
              .map((item) => (
                <option key={item.id} value={'macro:' + item.id}>
                  Macroprocesso: {item.name}
                </option>
              ))}
            {state.boards.map((item) => (
              <option key={item.id} value={'board:' + item.id}>
                Frente: {item.name}
              </option>
            ))}
          </select>
        </label>
        {picker('people', 'personIds', 'Responsáveis')}
        {field('role', 'Papel ou responsabilidade', 'textarea')}
      </>
    );
  } else if (target.type === 'step') {
    title = 'Editar etapa';
    const show = (...sections: string[]) => !target.section || sections.includes(target.section);
    body = (
      <>
        {show('name') && field('name', 'Etapa do processo')}
        {show('status') && field('status', 'Status', 'select', STATUSES)}
        {show('release') && field('release', 'Marco desta etapa', 'select', RELEASES)}
        {show('objective') && field('objective', 'Objetivo do processo', 'select', OBJECTIVES)}
        {show('actor', 'channel') && (
          <details className="oj-editor-section" open>
            <summary>Ator e canal</summary>
            {show('actor') && picker('actors', 'actorIds', 'Atores')}
            {show('channel') && picker('channels', 'channelIds', 'Canais')}
          </details>
        )}
        {show('operation') && (
          <details className="oj-editor-section" open>
            <summary>Operação</summary>
            <SelectRecords
              inline={!!target.anchor}
              label="Áreas operacionais"
              kind="operations"
              onCreate={(name) => createLinked('operations', 'operationLinks', name)}
              records={state.operations}
              selected={(record.operationLinks || []).map((item: RecordData) => item.areaId)}
              onChange={(ids) =>
                update(
                  'operationLinks',
                  ids.map(
                    (id) =>
                      record.operationLinks?.find((item: RecordData) => item.areaId === id) || {
                        areaId: id,
                        role: '',
                      },
                  ),
                  true,
                )
              }
            />
            {(record.operationLinks || []).map((link: RecordData) => (
              <label className="oj-field" key={link.areaId}>
                <span>
                  Papel de{' '}
                  {state.operations.find((item: RecordData) => item.id === link.areaId)?.name}
                </span>
                <textarea
                  value={link.role}
                  onChange={(event) =>
                    update(
                      'operationLinks',
                      record.operationLinks.map((item: RecordData) =>
                        item.areaId === link.areaId ? { ...item, role: event.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </details>
        )}
        {show('system', 'capabilities') && (
          <details className="oj-editor-section" open>
            <summary>Sistemas e capacidades</summary>
            {show('system') && picker('systems', 'systemIds', 'Sistemas')}
            {show('capabilities') && picker('capabilities', 'capabilityIds', 'Capacidades')}
            {show('capabilities') &&
              (record.capabilityIds || []).map((id: string) => {
                const capability = state.capabilities.find((c: RecordData) => c.id === id);
                const assignment = state.responsibilities?.find(
                  (r: RecordData) =>
                    r.capabilityId === id && r.context === 'board:' + target.boardId,
                );
                return (
                  <SelectRecords
                    key={id}
                    kind="people"
                    label={
                      'Responsáveis por ' + (capability?.name || 'capacidade') + ' neste contexto'
                    }
                    records={state.people}
                    selected={assignment ? assignment.personIds : capability?.ownerIds || []}
                    onCreate={(name) => {
                      change((draft) => {
                        const personId = uid();
                        draft.people.push({ id: personId, name, status: 'Ativo' });
                        draft.responsibilities ??= [];
                        let row = draft.responsibilities.find(
                          (r: RecordData) =>
                            r.capabilityId === id && r.context === 'board:' + target.boardId,
                        );
                        if (!row) {
                          row = {
                            uid: uid(),
                            capabilityId: id,
                            context: 'board:' + target.boardId,
                            personIds: [...(capability?.ownerIds || [])],
                            role: '',
                          };
                          draft.responsibilities.push(row);
                        }
                        row.personIds = [...row.personIds, personId];
                      }, true);
                    }}
                    onChange={(ids) =>
                      change((draft) => {
                        draft.responsibilities ??= [];
                        let row = draft.responsibilities.find(
                          (r: RecordData) =>
                            r.capabilityId === id && r.context === 'board:' + target.boardId,
                        );
                        if (!row) {
                          row = {
                            uid: uid(),
                            capabilityId: id,
                            context: 'board:' + target.boardId,
                            role: '',
                          };
                          draft.responsibilities.push(row);
                        }
                        row.personIds = ids;
                      }, true)
                    }
                  />
                );
              })}
            {show('capabilities') && field('capabilityNotes', 'Papel das capacidades', 'textarea')}
          </details>
        )}
        {show('data') && (
          <details className="oj-editor-section" open>
            <summary>Dados necessários</summary>
            {(record.dataRequirements || []).map((data: RecordData) => (
              <div className="oj-data-row" key={data.uid}>
                <label className="oj-field">
                  <span>Nome do dado</span>
                  <input
                    value={data.name}
                    aria-label="Nome do dado"
                    onChange={(event) =>
                      update(
                        'dataRequirements',
                        record.dataRequirements.map((item: RecordData) =>
                          item.uid === data.uid ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="oj-field">
                  <span>Fornecido por</span>
                  <select
                    value={data.providerKind}
                    aria-label="Tipo de fornecedor"
                    onChange={(event) =>
                      update(
                        'dataRequirements',
                        record.dataRequirements.map((item: RecordData) =>
                          item.uid === data.uid
                            ? { ...item, providerKind: event.target.value, providerId: '' }
                            : item,
                        ),
                        true,
                      )
                    }
                  >
                    <option value="">A definir</option>
                    <option value="systems">Sistema</option>
                    <option value="capabilities">Capacidade</option>
                  </select>
                </label>
                <label className="oj-field">
                  <span>Fonte</span>
                  <select
                    value={data.providerId}
                    aria-label="Fonte do dado"
                    disabled={!data.providerKind}
                    onChange={(event) =>
                      update(
                        'dataRequirements',
                        record.dataRequirements.map((item: RecordData) =>
                          item.uid === data.uid
                            ? { ...item, providerId: event.target.value }
                            : item,
                        ),
                        true,
                      )
                    }
                  >
                    <option value="">A definir</option>
                    {(state[data.providerKind] || []).map((item: RecordData) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {data.providerKind && (
                  <label className="oj-field">
                    <span>Cadastrar nova fonte</span>
                    <input
                      aria-label="Nome da nova fonte"
                      placeholder="Digite o nome e pressione Enter"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const name = event.currentTarget.value.trim();
                          if (!name) return;
                          change((draft) => {
                            const id = uid();
                            draft[data.providerKind].push({
                              id,
                              name,
                              status: 'Ativo',
                              ...VISUAL_DEFAULTS[data.providerKind],
                            });
                            const row = editorRecord(draft, target)!.dataRequirements.find(
                              (r: RecordData) => r.uid === data.uid,
                            );
                            row.providerId = id;
                          }, true);
                          event.currentTarget.value = '';
                        }
                      }}
                    />
                  </label>
                )}
                <label className="oj-field">
                  <span>Observação</span>
                  <input
                    value={data.note || ''}
                    aria-label="Observação do dado"
                    onChange={(event) =>
                      update(
                        'dataRequirements',
                        record.dataRequirements.map((item: RecordData) =>
                          item.uid === data.uid ? { ...item, note: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  aria-label={'Remover dado ' + data.name}
                  onClick={() =>
                    update(
                      'dataRequirements',
                      record.dataRequirements.filter((item: RecordData) => item.uid !== data.uid),
                      true,
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn"
              disabled={record.dataNotApplicable}
              onClick={() =>
                update(
                  'dataRequirements',
                  [
                    ...(record.dataRequirements || []),
                    { uid: uid(), name: 'Novo dado', providerKind: '', providerId: '', note: '' },
                  ],
                  true,
                )
              }
            >
              <Plus size={15} />
              Adicionar dado
            </button>
            <label className="oj-check">
              <input
                name="dataNotApplicable"
                type="checkbox"
                checked={!!record.dataNotApplicable}
                disabled={!!record.dataRequirements?.length}
                onChange={(event) => update('dataNotApplicable', event.target.checked, true)}
              />
              Sem dados adicionais nesta etapa
            </label>
          </details>
        )}
        {show('support') && field('support', 'Atendimento', 'textarea')}
        {show('features') && (
          <details className="oj-editor-section">
            <summary>Funcionalidades vinculadas</summary>
            <SelectRecords
              label="Funcionalidades"
              records={matrix.items.map((item: RecordData) => ({
                id: item.id,
                name: item.id + ' — ' + item.funcionalidade,
              }))}
              selected={record.featureIds || []}
              onChange={(ids) => update('featureIds', ids, true)}
            />
          </details>
        )}
        {!target.section && field('notes', 'Anotações da etapa', 'textarea')}
        {!target.section && (
          <small className="oj-context">
            {board?.name} · {caseData?.title}
          </small>
        )}
      </>
    );
  } else if (target.type === 'feature') {
    const feature = matrix.items.find((item: RecordData) => item.id === target.id)!;
    title = feature.id + ' · ' + feature.funcionalidade;
    const routedBoard = state.boards.find((item) => item.id === record.boardId);
    body = (
      <>
        <dl className="oj-source">
          <dt>Público</dt>
          <dd>{feature.publico}</dd>
          <dt>Marco original</dt>
          <dd>{feature.marco_produto}</dd>
          <dt>Cobertura declarada</dt>
          <dd>{feature.status_vendor}</dd>
          <dt>Contexto</dt>
          <dd>{feature.observacao}</dd>
          <dt>Requisitos RFI</dt>
          <dd>{feature.rfi_ids}</dd>
          <dt>Fontes</dt>
          <dd>
            {feature.fonte_rfi}
            <br />
            {feature.fonte_timeline}
          </dd>
        </dl>
        <label className="oj-field">
          <span>Frente de trabalho</span>
          <select
            value={record.boardId || ''}
            onChange={(event) =>
              change((draft) => {
                const next = draft.boards.find((item) => item.id === event.target.value)!;
                draft.featureRouting ??= {};
                draft.featureRouting[target.id!] = {
                  ...record,
                  boardId: next.id,
                  macroId: next.macroId,
                };
              }, true)
            }
          >
            <option value="">A classificar</option>
            {state.boards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="oj-field">
          <span>Marco revisto no workshop</span>
          <select
            name="release"
            value={Object.hasOwn(record, 'release') ? record.release : '__source'}
            onChange={(event) => {
              if (event.target.value === '__source')
                change((draft) => {
                  if (draft.featureRouting?.[target.id!])
                    delete draft.featureRouting[target.id!].release;
                }, true);
              else update('release', event.target.value, true);
            }}
          >
            <option value="__source">
              Usar marco original ({feature.marco_produto || 'a definir'})
            </option>
            <option value="">Marco a definir</option>
            {RELEASES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {field('releaseReason', 'Justificativa da revisão', 'textarea')}
        {routedBoard && (
          <fieldset className="oj-picker">
            <legend>Etapas do caso padrão de {routedBoard.name}</legend>
            {defaultCase(routedBoard).steps.map((step: RecordData) => (
              <label className="oj-check" key={step.uid}>
                <input
                  type="checkbox"
                  checked={step.featureIds?.includes(feature.id)}
                  onChange={(event) =>
                    change((draft) => {
                      const item = defaultCase(
                        draft.boards.find((b) => b.id === routedBoard.id)!,
                      ).steps.find((s: RecordData) => s.uid === step.uid);
                      item.featureIds = event.target.checked
                        ? [...new Set([...(item.featureIds || []), feature.id])]
                        : (item.featureIds || []).filter((id: string) => id !== feature.id);
                    }, true)
                  }
                />
                {step.name}
              </label>
            ))}
          </fieldset>
        )}
      </>
    );
  } else {
    body = (
      <>
        {(DEFINITIONS[target.type]?.fields || [])
          .filter(([key]) => !target.section || target.section === key)
          .map(([key, label, type, entries]) => field(key, label, type, entries))}
        {target.type === 'offers' && (
          <fieldset className="oj-picker">
            <legend>Elegibilidade por perfil</legend>
            {PROFILES.map((profile) => (
              <label className="oj-field" key={profile}>
                <span>{profile}</span>
                <select
                  value={record.eligibility?.[profile] || 'A definir'}
                  onChange={(event) =>
                    update(
                      'eligibility',
                      { ...record.eligibility, [profile]: event.target.value },
                      true,
                    )
                  }
                >
                  {['A definir', 'Elegível', 'Condicional', 'Não elegível'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <textarea
                  aria-label={'Condições para ' + profile}
                  value={record.eligibilityNotes?.[profile] || ''}
                  placeholder="Condições ou diferenças para este perfil"
                  onChange={(event) =>
                    update('eligibilityNotes', {
                      ...record.eligibilityNotes,
                      [profile]: event.target.value,
                    })
                  }
                />
              </label>
            ))}
          </fieldset>
        )}
        {target.type === 'decisions' && (
          <label className="oj-field">
            <span>Situação da decisão</span>
            <select
              value={record.status || 'Em discussão'}
              onChange={(event) => {
                const next = event.target.value;
                if (
                  next === 'Decisão final' &&
                  (!record.owner?.trim() || !record.rationale?.trim())
                ) {
                  setLocalError(
                    'Informe o responsável e a justificativa antes de registrar uma decisão final.',
                  );
                  return;
                }
                setLocalError('');
                change((draft) => {
                  const destination = editorRecord(draft, target)!;
                  destination.status = next;
                  destination.decidedAt =
                    next === 'Decisão final' ? new Date().toISOString() : destination.decidedAt;
                }, true);
              }}
            >
              {['Em discussão', 'Em validação', 'Decisão final', 'Revogada'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
      </>
    );
  }
  if (target.anchor) {
    const labels: Record<string, string> = {
      owners: 'Responsáveis pelo contexto / produto',
      actor: 'Atores',
      channel: 'Canais',
      system: 'Sistemas',
      operation: 'Operação',
      capabilities: 'Capacidades',
      data: 'Dados necessários',
      support: 'Atendimento',
      objective: 'Objetivo do processo',
      status: 'Status',
      release: 'Marco desta etapa',
    };
    const fieldTitle =
      labels[target.section || ''] ||
      DEFINITIONS[target.type]?.fields.find(([key]) => key === target.section)?.[1] ||
      title;
    return (
      <FieldPopover
        id={fieldPanelId(target.type, target.id || target.boardId, target.section)}
        label={fieldTitle}
        anchor={target.anchor}
        onClose={close}
      >
        <form onSubmit={(event) => event.preventDefault()} className="oj-field-form">
          {body}
        </form>
        {(localError || error) && (
          <p className="oj-editor-error" role="alert">
            {localError || error}
          </p>
        )}
        <div className="oj-field-save" role="status">
          {status === 'saved'
            ? 'Todas as alterações salvas'
            : status === 'saving'
              ? 'Salvando…'
              : 'Alterações pendentes'}
        </div>
      </FieldPopover>
    );
  }
  return (
    <dialog
      ref={dialog}
      className="oj-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-labelledby="editor-title"
    >
      <header>
        <div>
          <h2 id="editor-title">{title}</h2>
          <p>As alterações são salvas automaticamente.</p>
        </div>
        <button type="button" className="oj-icon" onClick={close} aria-label="Fechar editor">
          <X size={21} />
        </button>
      </header>
      <form onSubmit={(event) => event.preventDefault()} className="oj-editor-form">
        {body}
      </form>
      {(localError || error) && (
        <p className="oj-editor-error" role="alert">
          {localError || error}
        </p>
      )}
      <footer>
        {['macro', 'front', 'step', 'assignment'].includes(target.type) && (
          <button type="button" className="btn oj-danger" onClick={() => onDelete(target)}>
            Excluir{' '}
            {target.type === 'macro'
              ? 'macroprocesso'
              : target.type === 'front'
                ? 'contexto / produto'
                : target.type === 'assignment'
                  ? 'vínculo'
                  : 'etapa'}
          </button>
        )}
        <span role="status">
          {status === 'saved'
            ? 'Todas as alterações salvas'
            : status === 'saving'
              ? 'Salvando…'
              : 'Alterações pendentes'}
        </span>
        <button className="btn dark" type="button" onClick={close}>
          Fechar
        </button>
      </footer>
    </dialog>
  );
}
