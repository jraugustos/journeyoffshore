'use client';
import { useRef, useState } from 'react';
import {
  LayoutGrid,
  ChartNoAxesCombined,
  ArrowUpRight,
  List,
  Users,
  Plus,
  Pencil,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Download,
  Upload,
  X,
  Trash2,
  Copy,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useWorkspace } from './useWorkspace';
import Editor, { type EditorTarget } from './Editor';
import Blueprint, { Phase, Status, RecordTags } from './Blueprint';
import FrontBlocks from './FrontBlocks';
import { removeHierarchy } from '@/lib/hierarchy';
import AccessForm from './AccessForm';
import LaunchTimeline from './LaunchTimeline';
import { Avatar, People, Country, RecordTag, PhaseLegend } from './Visuals';
import { VISUAL_DEFAULTS, featurePhase, canonicalPhase } from '@/lib/presentation';
import {
  type WorkspaceData,
  type RecordData,
  defaultCase,
  clone,
  uid,
  newFront,
  newStep,
  newCase,
  copyCase,
  coverage,
  REGISTRIES,
  REGISTRY_LABELS,
  STATUSES,
  PROFILES,
  RELEASES,
  normalizeImported,
} from '@/lib/domain';

type Page = 'overview' | 'board' | 'tracker' | 'catalog' | 'launch' | 'registry';
const PAGE_LINKS = [
  { id: 'overview' as Page, label: 'Visão geral', icon: LayoutGrid },
  { id: 'tracker' as Page, label: 'Acompanhamento', icon: ChartNoAxesCombined },
  { id: 'launch' as Page, label: 'Launch Timeline', icon: ArrowUpRight },
  { id: 'catalog' as Page, label: 'Funcionalidades', icon: List },
  { id: 'registry' as Page, label: 'Cadastros e responsáveis', icon: Users },
];
const BLOCKS = [
  ['blueprint', 'Blueprint', -1],
  ['scope', 'Oferta e recorte', 0],
  ['asis', 'AS-IS', 1],
  ['csd', 'CSD e decisões', 4],
  ['actions', 'Plano de ação', 5],
] as const;
const SAVE_LABELS: Record<string, string> = {
  loading: 'Abrindo projeto…',
  saved: 'Todas as alterações salvas',
  pending: 'Alterações pendentes',
  saving: 'Salvando…',
  error: 'Gravação pendente',
  conflict: 'Revisão necessária',
};

export default function Workspace() {
  const api = useWorkspace();
  const [page, setPage] = useState<Page>('overview'),
    [frontId, setFrontId] = useState('onboarding'),
    [block, setBlock] = useState('blueprint');
  const [editor, setEditor] = useState<EditorTarget | null>(null),
    [collapsed, setCollapsed] = useState(false),
    [focus, setFocus] = useState(false);
  const [macroFilter, setMacroFilter] = useState('all'),
    [profileFilter, setProfileFilter] = useState('all'),
    [releaseFilter, setReleaseFilter] = useState('all'),
    [statusFilter, setStatusFilter] = useState('all');
  const [cases, setCases] = useState<Record<string, string>>({}),
    [query, setQuery] = useState(''),
    [registry, setRegistry] = useState('people'),
    [message, setMessage] = useState('');
  const file = useRef<HTMLInputElement>(null);
  if (api.locked) return <AccessForm onSuccess={api.unlock} />;
  if (!api.data || !api.references)
    return (
      <main className="setup-page">
        <h1>
          {api.status === 'error' ? 'Não foi possível abrir o projeto.' : 'Abrindo o projeto…'}
        </h1>
        {api.error && (
          <>
            <p role="alert">{api.error}</p>
            <button className="btn dark" onClick={() => void api.load()}>
              Tentar novamente
            </button>
          </>
        )}
      </main>
    );
  const data = api.data,
    { matrix, launch } = api.references;
  const board =
    data.boards.find((item) => item.id === frontId) ||
    data.boards[0] ||
    newFront(data.macros[0]?.id || '');
  const selectedCase =
    board.cases.find((item: RecordData) => item.uid === cases[board.id]) || defaultCase(board);
  const mutate = api.change;
  const navigate = (next: Page) => {
    setPage(next);
    setQuery('');
    window.scrollTo({ top: 0 });
  };
  const openFront = (id: string) => {
    setFrontId(id);
    setBlock('blueprint');
    setPage('board');
    window.scrollTo({ top: 0 });
  };
  async function closeEditor() {
    await api.flush();
    setEditor(null);
  }
  const ownerNames = (ids: string[] = []) => <People people={data.people} ids={ids} />;
  const ownersFor = (front: RecordData) => ownerNames(front.ownerIds);
  function addMacro() {
    const id = uid();
    mutate((draft) => {
      draft.macros.push({
        id,
        name: 'Novo macroprocesso',
        short: 'Novo macroprocesso',
        status: 'Em definição',
        ownerIds: [],
        boards: [],
      });
    }, true);
    setEditor({ type: 'macro', id });
  }
  function addFront(macroId: string) {
    const next = newFront(macroId);
    mutate((draft) => {
      draft.boards.push(next);
      draft.macros.find((item) => item.id === macroId)!.boards.push(next.id);
    }, true);
    setEditor({ type: 'front', boardId: next.id });
  }
  function addCase() {
    const item = copyCase(defaultCase(board), board);
    item.title = 'Novo caso de uso';
    item.ref = '';
    item.profiles = [PROFILES[0]];
    mutate((draft) => draft.boards.find((front) => front.id === board.id)!.cases.push(item), true);
    setCases((current) => ({ ...current, [board.id]: item.uid }));
    setEditor({ type: 'case', boardId: board.id, caseId: item.uid });
  }
  function addStep(boardId: string, caseId: string) {
    const step = newStep();
    mutate(
      (draft) =>
        draft.boards
          .find((front) => front.id === boardId)!
          .cases.find((item: RecordData) => item.uid === caseId)
          .steps.push(step),
      true,
    );
    setEditor({ type: 'step', boardId, caseId, id: step.uid });
  }
  function moveStep(boardId: string, caseId: string, id: string, direction: number) {
    mutate((draft) => {
      const steps = draft.boards
        .find((front) => front.id === boardId)!
        .cases.find((item: RecordData) => item.uid === caseId).steps;
      const index = steps.findIndex((item: RecordData) => item.uid === id),
        next = index + direction;
      if (next < 0 || next >= steps.length) return;
      const [item] = steps.splice(index, 1);
      steps.splice(next, 0, item);
    }, true);
  }
  function addRecord(type: string, defaults: RecordData = {}) {
    const id = uid();
    const item = {
      uid: id,
      title:
        type === 'offers'
          ? 'Novo produto ou serviço'
          : type === 'actionPlan'
            ? 'Nova ação'
            : type === 'decisions'
              ? 'Nova decisão'
              : type === 'asis'
                ? undefined
                : 'Novo registro',
      ...(type === 'asis' ? { step: 'Nova etapa atual', where: '', who: '' } : {}),
      status:
        type === 'actionPlan'
          ? 'Não iniciada'
          : type === 'decisions' || type === 'offers'
            ? 'Em discussão'
            : 'Aberta',
      horizon: 'A definir',
      priority: 'Média',
      ...(type === 'csd' ? { type: 'Dúvida' } : {}),
      ...defaults,
    };
    mutate((draft) => {
      const front = draft.boards.find((item) => item.id === board.id)!;
      front[type] ??= [];
      front[type].push(item);
    }, true);
    setEditor({ type, boardId: board.id, id });
  }
  function removeRecord(type: string, id: string, title: string) {
    if (!confirm('Excluir “' + title + '”?')) return;
    mutate((draft) => {
      const front = draft.boards.find((item) => item.id === board.id)!;
      front[type] = front[type].filter((item: RecordData) => item.uid !== id);
    }, true);
  }
  function addRegistry() {
    const id = uid();
    mutate(
      (draft) =>
        draft[registry].push({
          id,
          name: 'Novo cadastro',
          description: '',
          status: 'Ativo',
          ...(VISUAL_DEFAULTS[registry] || {}),
        }),
      true,
    );
    setEditor({ type: 'registry', id, registry });
  }
  function backupPending() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'offshore-alteracoes-pendentes.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportData(format: string, kind = 'progress') {
    if (!(await api.flush())) {
      setMessage(
        'A exportação aguarda a gravação das alterações. Você pode baixar uma cópia das alterações pendentes.',
      );
      return;
    }
    const response = await fetch(`/api/export?format=${format}&kind=${kind}`);
    if (!response.ok) {
      setMessage('Não foi possível exportar. Verifique o acesso e tente novamente.');
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `offshore-${format === 'csv' ? kind : 'projeto'}.${format}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      const raw = JSON.parse(await selected.text());
      if (
        !confirm(
          'Substituir o projeto pelo arquivo “' +
            selected.name +
            '”? Exporte um backup antes de continuar.',
        )
      )
        return;
      await api.importData(raw);
      setMessage('Projeto importado e persistido.');
      setCases({});
      setEditor(null);
      navigate('overview');
    } catch (cause: any) {
      setMessage(cause.message || 'Arquivo inválido. O projeto não foi alterado.');
    } finally {
      event.target.value = '';
    }
  }
  async function logout() {
    if (
      !(await api.flush()) &&
      !confirm(
        'Há alterações pendentes. Sair pode perder o que ainda não foi gravado. Deseja sair?',
      )
    )
      return;
    const response = await fetch('/api/access', { method: 'DELETE' });
    if (response.ok) window.location.assign('/login');
    else setMessage('Não foi possível encerrar o acesso. Tente novamente.');
  }
  const toolbar = (
    <div className="bp-toolbar">
      <div className="bp-filters">
        {page !== 'board' && (
          <label>
            Macroprocesso
            <select value={macroFilter} onChange={(event) => setMacroFilter(event.target.value)}>
              <option value="all">Todos os macroprocessos</option>
              {data.macros.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {page === 'board' && (
          <label>
            Caso de uso
            <select
              value={selectedCase.uid}
              onChange={(event) =>
                setCases((current) => ({ ...current, [board.id]: event.target.value }))
              }
            >
              {board.cases.map((item: RecordData) => (
                <option key={item.uid} value={item.uid}>
                  {item.isDefault ? 'Caso padrão' : item.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Perfil
          <select value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)}>
            <option value="all">Todos os perfis</option>
            {PROFILES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Marco da etapa
          <select value={releaseFilter} onChange={(event) => setReleaseFilter(event.target.value)}>
            <option value="all">Todos os marcos</option>
            {RELEASES.map((item) => (
              <option key={item}>{item}</option>
            ))}
            <option value="none">Sem marco atribuído</option>
          </select>
        </label>
        {page !== 'board' && (
          <label>
            Status da frente
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Todos os status</option>
              {STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="bp-filter-actions">
        <button
          className="btn tiny"
          onClick={() => {
            setMacroFilter('all');
            setProfileFilter('all');
            setReleaseFilter('all');
            setStatusFilter('all');
          }}
        >
          Limpar filtros
        </button>
        {page === 'board' ? (
          <button className="btn dark" onClick={addCase}>
            <Plus size={14} />
            Caso de uso
          </button>
        ) : (
          <button className="btn dark" onClick={addMacro}>
            <Plus size={14} />
            Macroprocesso
          </button>
        )}
      </div>
    </div>
  );
  const blueprint = (
    <Blueprint
      state={data}
      matrix={matrix}
      boardId={page === 'board' ? board.id : undefined}
      macroFilter={page === 'board' ? 'all' : macroFilter}
      profileFilter={profileFilter}
      releaseFilter={releaseFilter}
      statusFilter={page === 'board' ? 'all' : statusFilter}
      selectedCases={cases}
      setCase={(id, value) => setCases((current) => ({ ...current, [id]: value }))}
      edit={setEditor}
      openFront={openFront}
      addFront={addFront}
      addStep={addStep}
      moveStep={moveStep}
    />
  );
  const recordList = (type: string, title: string) => (
    <section className="oj-record-section">
      <div className="oj-section-heading">
        <h2>{title}</h2>
        <button className="btn" onClick={() => addRecord(type)}>
          <Plus size={15} />
          Adicionar
        </button>
      </div>
      {!(board[type] || []).length && (
        <div className="oj-empty-panel">
          Nenhum registro ainda. Adicione o primeiro para começar.
        </div>
      )}
      {(board[type] || []).map((item: RecordData) => (
        <article className="oj-record-row" key={item.uid}>
          <div>
            <div className="tags">
              {item.type && <span className="oj-status">{item.type}</span>}
              <Status value={item.status} />
              {item.horizon && <Phase value={item.horizon} />}
            </div>
            <h3>{item.title || item.step}</h3>
            <p>{item.detail || item.rules || item.where || item.rationale || item.acceptance}</p>
            {item.who && <small>Quem faz: {item.who}</small>}
            {item.owner && (
              <small>
                Responsável: {item.owner}
                {item.deadline ? ' · Prazo: ' + item.deadline : ''}
              </small>
            )}
            {type === 'offers' && (
              <div className="tags">
                {PROFILES.map((profile) => (
                  <span className="oj-status" key={profile}>
                    {profile}: {item.eligibility?.[profile] || 'A definir'}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="oj-row-actions">
            <button
              className="btn tiny"
              onClick={() => setEditor({ type, boardId: board.id, id: item.uid })}
            >
              <Pencil size={14} />
              Editar
            </button>
            {type === 'csd' && (
              <button
                className="btn tiny"
                onClick={() =>
                  addRecord('actionPlan', {
                    title: item.action || 'Resolver: ' + item.title,
                    detail: item.detail,
                    owner: item.owner,
                    deadline: item.deadline,
                    source: 'CSD: ' + item.title,
                  })
                }
              >
                Criar ação
              </button>
            )}
            <button
              className="oj-icon"
              aria-label={'Excluir ' + (item.title || item.step)}
              onClick={() => removeRecord(type, item.uid, item.title || item.step)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </article>
      ))}
    </section>
  );
  let content: React.ReactNode;
  if (page === 'overview') {
    content = (
      <>
        <section className="bp-hero">
          <div className="eyebrow">Itaú Private Bank · De Novo</div>
          <h1>
            Novas jornadas <em>Offshore</em>
          </h1>
        </section>
        <div className="bp-section-title">
          <h2>Blueprint do Offshore</h2>
          <button
            className="btn"
            onClick={() =>
              setMessage(
                'Clique nos cards pretos para editar os macroprocessos. Clique em uma frente para detalhar, ou em uma célula para preencher. Todas as alterações são salvas automaticamente.',
              )
            }
          >
            Como preencher
          </button>
        </div>
        {toolbar}
        <div className="oj-quick-links">
          {data.macros.map((macro) => (
            <button className="btn tiny" key={macro.id} onClick={() => setMacroFilter(macro.id)}>
              {macro.short || macro.name}
            </button>
          ))}
        </div>
        {blueprint}
        <div className="oj-context">
          Clique no nome de um macroprocesso para editá-lo. A visão geral e as frentes mostram os
          mesmos registros.
        </div>
        <div className="oj-front-links">
          {data.macros.map((macro) => (
            <div key={macro.id}>
              <strong>{macro.name}</strong>
              {data.boards
                .filter((front) => front.macroId === macro.id)
                .map((front) => (
                  <button className="btn tiny" key={front.id} onClick={() => openFront(front.id)}>
                    {front.name}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              <button className="btn tiny" onClick={() => addFront(macro.id)}>
                <Plus size={13} />
                Frente
              </button>
            </div>
          ))}
        </div>
      </>
    );
  } else if (page === 'board') {
    const progress = coverage(board, data),
      macro = data.macros.find((item) => item.id === board.macroId)!;
    const currentBlock = BLOCKS.find((item) => item[0] === block) || BLOCKS[0];
    const validation =
      block === 'blueprint' ? board.blueprintProgress || 0 : board.progress?.[currentBlock[2]] || 0;
    content = (
      <>
        <div className="crumb">
          <button onClick={() => navigate('overview')}>Visão geral</button>
          <span>›</span>
          <button onClick={() => setEditor({ type: 'macro', id: macro.id })}>{macro.name}</button>
          <span>›</span>
          <span>{board.name}</span>
        </div>
        <section className="board-hero">
          <div className="board-head">
            <div>
              <h1>{board.name}</h1>
              <div className="board-meta">
                <Status value={board.status} />
                <span>Responsáveis: {ownersFor(board)}</span>
                <button
                  className="btn tiny"
                  onClick={() => setEditor({ type: 'front', boardId: board.id })}
                >
                  <Pencil size={14} />
                  Editar frente
                </button>
                <button
                  className="btn tiny"
                  onClick={() => {
                    const id = uid();
                    mutate((draft) => {
                      draft.responsibilities ??= [];
                      draft.responsibilities.push({
                        uid: id,
                        capabilityId: draft.capabilities[0]?.id || '',
                        context: 'board:' + board.id,
                        personIds: [],
                        role: '',
                      });
                    }, true);
                    setEditor({ type: 'assignment', id });
                  }}
                >
                  Responsáveis por capacidade
                </button>
              </div>
            </div>
            <div className="board-summary">
              <strong className="oj-large-progress">{progress.ratio}%</strong>
              <span>
                {progress.done}/{progress.total} campos preenchidos
              </span>
            </div>
          </div>
        </section>
        <div className="oj-board-tabs">
          {BLOCKS.map(([id, title]) => (
            <button
              className={block === id ? 'is-selected' : ''}
              key={id}
              onClick={() => setBlock(id)}
            >
              {title}
            </button>
          ))}
        </div>
        <label className="oj-validation">
          Validação do bloco
          <select
            value={validation}
            onChange={(event) =>
              mutate((draft) => {
                const target = draft.boards.find((item) => item.id === board.id)!;
                if (block === 'blueprint') target.blueprintProgress = Number(event.target.value);
                else {
                  target.progress ??= [0, 0, 0, 0, 0, 0];
                  target.progress[currentBlock[2]] = Number(event.target.value);
                }
              }, true)
            }
          >
            <option value={0}>A iniciar</option>
            <option value={1}>Em construção</option>
            <option value={2}>Validado</option>
          </select>
        </label>
        {(data.responsibilities || []).some(
          (r: RecordData) => r.context === 'board:' + board.id,
        ) && (
          <section className="oj-context-responsibilities">
            <h3>Responsabilidades por capacidade neste contexto</h3>
            {(data.responsibilities || [])
              .filter((r: RecordData) => r.context === 'board:' + board.id)
              .map((r: RecordData) => (
                <div className="oj-simple-row" key={r.uid}>
                  <div>
                    <strong>
                      {data.capabilities.find((c: RecordData) => c.id === r.capabilityId)?.name ||
                        'Capacidade a definir'}
                    </strong>
                    <People people={data.people} ids={r.personIds} />
                    <small>{r.role}</small>
                  </div>
                  <button
                    className="btn tiny"
                    onClick={() => setEditor({ type: 'assignment', id: r.uid })}
                  >
                    Editar responsáveis
                  </button>
                </div>
              ))}
          </section>
        )}
        {block === 'blueprint' ? (
          <>
            {toolbar}
            <div className="oj-section-heading">
              <div>
                <h2>{selectedCase.isDefault ? 'Blueprint padrão' : selectedCase.title}</h2>
                <p>{selectedCase.need}</p>
              </div>
              <div className="oj-row-actions">
                <button
                  className="btn"
                  onClick={() =>
                    setEditor({ type: 'case', boardId: board.id, caseId: selectedCase.uid })
                  }
                >
                  <Pencil size={14} />
                  Editar caso
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    const next = copyCase(selectedCase, board);
                    mutate(
                      (draft) =>
                        draft.boards.find((item) => item.id === board.id)!.cases.push(next),
                      true,
                    );
                    setCases((current) => ({ ...current, [board.id]: next.uid }));
                    setEditor({ type: 'case', boardId: board.id, caseId: next.uid });
                  }}
                >
                  <Copy size={14} />
                  Duplicar caso
                </button>
                <button className="btn dark" onClick={() => addStep(board.id, selectedCase.uid)}>
                  <Plus size={14} />
                  Etapa
                </button>
              </div>
            </div>
            {blueprint}
            <div className="oj-record-section">
              <h2>Casos de uso da frente</h2>
              {board.cases.map((item: RecordData) => (
                <div className="oj-simple-row" key={item.uid}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.steps.length} etapas · {item.profiles.join(' / ')}
                    </small>
                  </div>
                  <button
                    className="btn tiny"
                    onClick={() => {
                      setCases((current) => ({ ...current, [board.id]: item.uid }));
                      setEditor({ type: 'case', boardId: board.id, caseId: item.uid });
                    }}
                  >
                    Editar
                  </button>
                  {!item.isDefault && (
                    <button
                      className="oj-icon"
                      aria-label={'Excluir caso ' + item.title}
                      onClick={() => removeRecord('cases', item.uid, item.title)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="oj-record-section">
              <h2>Etapas deste caso</h2>
              {selectedCase.steps.map((step: RecordData) => (
                <div className="oj-simple-row" key={step.uid}>
                  <strong>{step.name}</strong>
                  <button
                    className="btn tiny"
                    onClick={() =>
                      setEditor({
                        type: 'step',
                        boardId: board.id,
                        caseId: selectedCase.uid,
                        id: step.uid,
                      })
                    }
                  >
                    Editar
                  </button>
                  <button
                    className="oj-icon"
                    aria-label={'Excluir etapa ' + step.name}
                    onClick={() => {
                      if (
                        confirm(
                          'Excluir a etapa “' +
                            step.name +
                            '”? As funcionalidades permanecem no catálogo.',
                        )
                      )
                        mutate(
                          (draft) =>
                            removeHierarchy(draft, {
                              type: 'step',
                              boardId: board.id,
                              caseId: selectedCase.uid,
                              id: step.uid,
                            }),
                          true,
                        );
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : block === 'scope' ? (
          <>
            <div className="oj-section-heading">
              <h2>Oferta e recorte</h2>
              <button
                className="btn"
                onClick={() => setEditor({ type: 'scope', boardId: board.id })}
              >
                <Pencil size={14} />
                Editar recorte
              </button>
            </div>
            <dl className="oj-scope">
              {[
                ['problem', 'Problema (o que queremos resolver)'],
                ['offerDefinition', 'Oferta'],
                ['within', 'Recorte'],
                ['outside', 'Fora do recorte'],
                ['value', 'Resultado esperado'],
              ].map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{board.scope?.[key] || 'A definir'}</dd>
                </div>
              ))}
            </dl>
            {recordList('offers', 'Produtos e serviços')}
            <section className="oj-record-section">
              <h2>Perfis e condições</h2>
              {PROFILES.map((profile) => {
                const item = board.profiles?.find((row: RecordData) => row.group === profile);
                const updateProfile = (key: string, value: string) =>
                  mutate((draft) => {
                    const front = draft.boards.find((row) => row.id === board.id)!;
                    front.profiles ??= [];
                    let row = front.profiles.find((row: RecordData) => row.group === profile);
                    if (!row) {
                      row = { uid: uid(), group: profile, needs: '', conditions: '' };
                      front.profiles.push(row);
                    }
                    row[key] = value;
                  });
                return (
                  <details className="oj-launch-item" key={profile}>
                    <summary>{profile}</summary>
                    <div>
                      <label className="oj-field">
                        <span>O que esse grupo precisa</span>
                        <textarea
                          value={item?.needs || ''}
                          onChange={(event) => updateProfile('needs', event.target.value)}
                        />
                      </label>
                      <label className="oj-field">
                        <span>Condições e elegibilidade</span>
                        <textarea
                          value={item?.conditions || ''}
                          onChange={(event) => updateProfile('conditions', event.target.value)}
                        />
                      </label>
                    </div>
                  </details>
                );
              })}
            </section>
          </>
        ) : (
          <FrontBlocks
            block={block}
            board={board}
            add={addRecord}
            edit={(type, id) => setEditor({ type, boardId: board.id, id })}
            remove={removeRecord}
            update={(type, id, key, value) =>
              mutate((draft) => {
                draft.boards
                  .find((b) => b.id === board.id)!
                  [type].find((r: RecordData) => r.uid === id)[key] = value;
              }, true)
            }
            move={(type, id, direction) =>
              mutate((draft) => {
                const rows = draft.boards.find((b) => b.id === board.id)![type];
                const from = rows.findIndex((r: RecordData) => r.uid === id),
                  to = from + direction;
                if (to < 0 || to >= rows.length) return;
                const [item] = rows.splice(from, 1);
                rows.splice(to, 0, item);
              }, true)
            }
          />
        )}
        <section className="oj-record-section">
          <div className="oj-section-heading">
            <h2>Anotações</h2>
            <button
              className="btn tiny"
              onClick={() =>
                mutate((draft) => {
                  const front = draft.boards.find((item) => item.id === board.id)!;
                  front.notes ??= [];
                  front.notes.push({
                    uid: uid(),
                    text: '',
                    stage: currentBlock[2],
                    ts: new Date().toISOString(),
                  });
                }, true)
              }
            >
              <Plus size={14} />
              Anotação
            </button>
          </div>
          {(board.notes || [])
            .filter((item: RecordData) => String(item.stage) === String(currentBlock[2]))
            .map((item: RecordData) => (
              <label className="oj-field" key={item.uid}>
                <span>Anotação do bloco</span>
                <textarea
                  value={item.text}
                  onChange={(event) =>
                    mutate((draft) => {
                      draft.boards
                        .find((front) => front.id === board.id)!
                        .notes.find((row: RecordData) => row.uid === item.uid).text =
                        event.target.value;
                    })
                  }
                />
              </label>
            ))}
        </section>
      </>
    );
  } else if (page === 'tracker') {
    const active = data.boards.filter(
      (front) =>
        !['Não priorizado', 'Desativado'].includes(front.status) &&
        !['Não priorizado', 'Desativado'].includes(
          data.macros.find((macro) => macro.id === front.macroId)!.status,
        ),
    );
    const all = active.map((front) => coverage(front, data)),
      done = all.reduce((n, item) => n + item.done, 0),
      total = all.reduce((n, item) => n + item.total, 0);
    content = (
      <>
        <section className="bp-hero">
          <h1>Acompanhamento</h1>
        </section>
        <div className="bp-stat-grid">
          <div>
            <strong>{total ? Math.round((done / total) * 100) : 0}%</strong>
            <span>blueprint padrão preenchida</span>
            <small>
              {done}/{total} campos nas frentes no ciclo
            </small>
          </div>
          <div>
            <strong>
              {active.length}/{data.boards.length}
            </strong>
            <span>frentes no ciclo</span>
          </div>
          <div>
            <strong>
              {active.reduce(
                (n, front) =>
                  n +
                  (front.decisions || []).filter(
                    (item: RecordData) => item.status === 'Decisão final',
                  ).length,
                0,
              )}
            </strong>
            <span>decisões finais</span>
          </div>
          <div>
            <strong>
              {active.reduce(
                (n, front) =>
                  n +
                  (front.csd || []).filter(
                    (item: RecordData) => item.type === 'Dúvida' && item.status !== 'Resolvida',
                  ).length,
                0,
              )}
            </strong>
            <span>dúvidas abertas</span>
          </div>
        </div>
        <div className="oj-section-heading">
          <h2>Avanço por frente</h2>
          <button className="btn" onClick={() => void exportData('csv', 'progress')}>
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
        <p className="oj-context">
          Sete dimensões e o objetivo do processo: oito verificações por etapa. A validação dos
          cinco blocos é uma decisão manual.
        </p>
        <div className="bp-table-scroll">
          <table className="bp-track-table">
            <thead>
              <tr>
                {[
                  'Macroprocesso / frente',
                  'Responsáveis',
                  'Status',
                  'Blueprint padrão',
                  'Casos específicos',
                  'Blocos validados',
                  'Ações concluídas',
                ].map((title) => (
                  <th key={title}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.boards.map((front) => {
                const progress = coverage(front, data);
                return (
                  <tr key={front.id}>
                    <td>
                      <small>{data.macros.find((macro) => macro.id === front.macroId)?.name}</small>
                      <button onClick={() => openFront(front.id)}>
                        {front.name}
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                    <td>{ownersFor(front)}</td>
                    <td>
                      <Status value={front.status} />
                    </td>
                    <td>
                      <strong>{progress.ratio}%</strong>
                      <small>
                        {progress.done}/{progress.total} campos
                      </small>
                    </td>
                    <td>{front.cases.filter((item: RecordData) => !item.isDefault).length}</td>
                    <td>
                      {
                        [
                          front.blueprintProgress,
                          ...[0, 1, 4, 5].map((index) => front.progress?.[index]),
                        ].filter((value) => value === 2).length
                      }
                      /5
                    </td>
                    <td>
                      {
                        (front.actionPlan || []).filter(
                          (item: RecordData) => item.status === 'Concluída',
                        ).length
                      }
                      /{front.actionPlan?.length || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (page === 'catalog') {
    const filtered = matrix.items.filter(
      (item: RecordData) =>
        (!query ||
          [item.id, item.funcionalidade, item.rfi_ids]
            .join(' ')
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())) &&
        (macroFilter === 'all' || data.featureRouting?.[item.id]?.macroId === macroFilter) &&
        (releaseFilter === 'all' ||
          canonicalPhase(featurePhase(item, data.featureRouting?.[item.id])) === releaseFilter),
    );
    content = (
      <>
        <section className="bp-hero">
          <h1>Funcionalidades</h1>
        </section>
        <div className="oj-section-heading">
          <label className="oj-search">
            Buscar por nome, ID ou RFI
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: F001 ou abertura"
            />
          </label>
          <label className="oj-search">
            Macroprocesso
            <select value={macroFilter} onChange={(event) => setMacroFilter(event.target.value)}>
              <option value="all">Todos</option>
              {data.macros.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="oj-filter">
            Horizonte
            <select
              aria-label="Horizonte das funcionalidades"
              value={releaseFilter}
              onChange={(event) => setReleaseFilter(event.target.value)}
            >
              <option value="all">Todos os horizontes</option>
              {RELEASES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={() => void exportData('csv', 'features')}>
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
        <p className="oj-context">
          {filtered.length} de {matrix.items.length} funcionalidades. As referências originais
          permanecem preservadas.
        </p>
        <PhaseLegend />
        <div className="bp-catalog-list">
          {filtered.map((item: RecordData) => (
            <button
              className="bp-catalog-row"
              key={item.id}
              onClick={() => setEditor({ type: 'feature', id: item.id })}
            >
              <span className="bp-fid">{item.id}</span>
              <div className="bp-catalog-body">
                <small>
                  {data.boards.find((front) => front.id === data.featureRouting?.[item.id]?.boardId)
                    ?.name || item.jornada}
                </small>
                <h3>{item.funcionalidade}</h3>
                <p>
                  {item.publico} · {item.status_vendor}
                </p>
                <Phase value={featurePhase(item, data.featureRouting?.[item.id])} />
              </div>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </>
    );
  } else if (page === 'launch') {
    content = (
      <LaunchTimeline
        launch={launch}
        matrix={matrix}
        state={data}
        editFeature={(id) => setEditor({ type: 'feature', id })}
        openFront={openFront}
        openCatalog={(phase) => {
          setReleaseFilter(phase);
          setMacroFilter('all');
          navigate('catalog');
        }}
      />
    );
  } else if (page === 'registry') {
    content = (
      <>
        <section className="bp-hero">
          <h1>Cadastros e responsáveis</h1>
        </section>
        <div className="oj-registry-tabs">
          {[...REGISTRIES, 'processes', 'assignments'].map((kind) => (
            <button
              className={'btn ' + (registry === kind ? 'dark' : '')}
              key={kind}
              onClick={() => setRegistry(kind)}
            >
              {kind === 'processes'
                ? 'Macroprocessos e frentes'
                : kind === 'assignments'
                  ? 'Responsabilidades'
                  : REGISTRY_LABELS[kind]}
            </button>
          ))}
        </div>
        {registry === 'assignments' ? (
          <>
            <div className="oj-section-heading">
              <h2>Responsabilidades por capacidade</h2>
              <button
                className="btn dark"
                onClick={() => {
                  const id = uid();
                  mutate((draft) => {
                    draft.responsibilities ??= [];
                    draft.responsibilities.push({
                      uid: id,
                      capabilityId: draft.capabilities[0]?.id || '',
                      context: 'board:' + board.id,
                      personIds: [],
                      role: '',
                    });
                  }, true);
                  setEditor({ type: 'assignment', id });
                }}
              >
                <Plus size={14} />
                Vínculo
              </button>
            </div>
            {(data.responsibilities || []).map((item: RecordData) => (
              <div className="oj-simple-row" key={item.uid}>
                <div>
                  <strong>
                    {data.capabilities.find((record: RecordData) => record.id === item.capabilityId)
                      ?.name || 'Capacidade a definir'}
                  </strong>
                  <small>
                    {ownerNames(item.personIds)} ·{' '}
                    {item.context?.startsWith('macro:')
                      ? data.macros.find((record) => record.id === item.context.slice(6))?.name
                      : data.boards.find((record) => record.id === item.context?.slice(6))
                          ?.name}{' '}
                    · {item.role || 'Papel a definir'}
                  </small>
                </div>
                <button
                  className="btn tiny"
                  onClick={() => setEditor({ type: 'assignment', id: item.uid })}
                >
                  Editar vínculo
                </button>
                <button
                  className="oj-icon"
                  aria-label="Excluir vínculo"
                  onClick={() => {
                    if (confirm('Excluir este vínculo de responsabilidade?'))
                      mutate((draft) => {
                        draft.responsibilities = draft.responsibilities.filter(
                          (record: RecordData) => record.uid !== item.uid,
                        );
                      }, true);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!data.responsibilities?.length && (
              <div className="oj-empty-panel">
                Associe pessoas e capacidades ao contexto de uma frente ou macroprocesso.
              </div>
            )}
          </>
        ) : registry === 'processes' ? (
          <>
            <div className="oj-section-heading">
              <h2>Macroprocessos e frentes</h2>
              <button className="btn dark" onClick={addMacro}>
                <Plus size={14} />
                Macroprocesso
              </button>
            </div>
            {data.macros.map((macro) => (
              <section className="oj-record-section" key={macro.id}>
                <div className="oj-section-heading">
                  <h3>{macro.name}</h3>
                  <div className="oj-row-actions">
                    <button
                      className="btn"
                      onClick={() => setEditor({ type: 'macro', id: macro.id })}
                    >
                      <Pencil size={14} />
                      Editar macroprocesso
                    </button>
                    <button className="btn" onClick={() => addFront(macro.id)}>
                      <Plus size={14} />
                      Frente
                    </button>
                  </div>
                </div>
                {data.boards
                  .filter((front) => front.macroId === macro.id)
                  .map((front) => (
                    <div className="oj-simple-row" key={front.id}>
                      <div>
                        <strong>{front.name}</strong>
                        <small>{ownersFor(front)}</small>
                      </div>
                      <Status value={front.status} />
                      <button
                        className="btn tiny"
                        onClick={() => setEditor({ type: 'front', boardId: front.id })}
                      >
                        Editar frente
                      </button>
                    </div>
                  ))}
              </section>
            ))}
          </>
        ) : (
          <>
            <div className="oj-section-heading">
              <h2>{REGISTRY_LABELS[registry]}</h2>
              <button className="btn dark" onClick={addRegistry}>
                <Plus size={14} />
                Adicionar
              </button>
            </div>
            {!(data[registry] || []).length && (
              <div className="oj-empty-panel">
                Nenhum registro cadastrado. Adicione um para vincular às etapas.
              </div>
            )}
            {(data[registry] || []).map((item: RecordData) => (
              <div className="oj-simple-row" key={item.id}>
                <div>
                  {registry === 'people' ? (
                    <div className="oj-person-card">
                      <Avatar person={item} size="lg" />
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.role || item.description}</small>
                        {item.email && <small>{item.email}</small>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <RecordTag kind={registry} record={item} />
                      {registry === 'operations' && <Country value={item.country} />}
                      <small>{item.description}</small>
                    </>
                  )}
                </div>
                <Status value={item.status} />
                <button
                  className="btn tiny"
                  onClick={() => setEditor({ type: 'registry', registry, id: item.id })}
                >
                  Editar
                </button>
              </div>
            ))}
          </>
        )}
      </>
    );
  }
  return (
    <div id="app" className={(collapsed ? 'sidebar-collapsed ' : '') + (focus ? 'focus' : '')}>
      <a className="skip-link" href="#workspace-main">
        Ir para o conteúdo
      </a>
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/brand.svg" alt="Itaú" />
          <div>
            <div className="brand-name">Novas jornadas Offshore</div>
            <div className="brand-caption">New Bank · Workshop de definição</div>
          </div>
        </div>
        <div className="toptools">
          <div
            className={'saved ' + (api.status !== 'saved' ? 'unsaved' : '')}
            role="status"
            aria-live="polite"
            data-testid="save-status"
          >
            <i />
            <span>{SAVE_LABELS[api.status]}</span>
          </div>
          <button
            className="btn ghost v13-toolbar-icon"
            aria-label="Modo apresentação"
            title="Modo apresentação"
            onClick={() => setFocus(!focus)}
          >
            <Presentation size={19} />
          </button>
          <button
            className="btn ghost v13-toolbar-icon"
            aria-label="Importar JSON"
            title="Importar JSON"
            onClick={() => file.current?.click()}
          >
            <Upload size={19} />
          </button>
          <details className="dropdown">
            <summary className="btn dark">Exportar</summary>
            <div className="dropdown-panel">
              <button onClick={() => void exportData('json')}>JSON completo</button>
              <button onClick={() => void exportData('html')}>HTML preenchido para consulta</button>
              {[
                ['cases', 'Casos de uso'],
                ['csd', 'CSD e pendências'],
                ['decisions', 'Decisões'],
                ['actions', 'Plano de ação'],
                ['progress', 'Acompanhamento'],
                ['features', 'Funcionalidades'],
              ].map(([kind, title]) => (
                <button key={kind} onClick={() => void exportData('csv', kind)}>
                  {title} (CSV)
                </button>
              ))}
              <button onClick={() => window.print()}>Imprimir tela atual</button>
            </div>
          </details>
          <button
            className="oj-icon"
            title="Encerrar acesso"
            aria-label="Encerrar acesso"
            onClick={() => void logout()}
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="oj-mobile-save" role="status" aria-live="polite">
          <i className={api.status === 'saved' ? 'is-saved' : ''} />
          {SAVE_LABELS[api.status]}
        </div>
      </header>
      {(api.error || message) && (
        <div
          className={'oj-notice ' + (api.status === 'conflict' ? 'is-conflict' : '')}
          role="alert"
        >
          <span>{message || api.error}</span>
          {api.status !== 'saved' && (
            <button className="btn tiny" onClick={backupPending}>
              Baixar alterações pendentes
            </button>
          )}
          {api.status === 'conflict' ? (
            <button
              className="btn tiny"
              onClick={() => {
                if (
                  confirm(
                    'Recarregar a versão do servidor? Baixe antes uma cópia das alterações pendentes que deseja preservar.',
                  )
                ) {
                  setEditor(null);
                  void api.load();
                }
              }}
            >
              Recarregar versão do servidor
            </button>
          ) : (
            api.status === 'error' && (
              <button className="btn tiny" onClick={() => void api.flush()}>
                Tentar novamente
              </button>
            )
          )}
          {message && (
            <button className="oj-icon" aria-label="Fechar mensagem" onClick={() => setMessage('')}>
              <X size={17} />
            </button>
          )}
        </div>
      )}
      <div className="shell">
        <aside className="sidebar">
          <div className="v13-side-header">
            <button
              className="v13-collapse"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
          <div className="nav-caption">Workspace</div>
          {PAGE_LINKS.map((link) => (
            <button
              className={'nav-btn ' + (page === link.id ? 'active' : '')}
              key={link.id}
              title={link.label}
              onClick={() => navigate(link.id)}
            >
              <link.icon size={17} />
              <span className="navtxt">{link.label}</span>
            </button>
          ))}
          <div className="nav-caption">Frentes de trabalho</div>
          {data.macros.map((macro, index) => (
            <div className="bp-nav-group" key={macro.id}>
              <button
                className="nav-btn oj-macro-nav"
                title={'Editar macroprocesso ' + macro.name}
                onClick={() => setEditor({ type: 'macro', id: macro.id })}
              >
                <span className="num">{String(index + 1).padStart(2, '0')}</span>
                <span className="navtxt">
                  {macro.short || macro.name}
                  <span className="tinyline">{macro.status}</span>
                </span>
              </button>
              <div className="bp-nav-children">
                {data.boards
                  .filter((front) => front.macroId === macro.id)
                  .map((front) => (
                    <button
                      className={
                        'nav-btn ' + (page === 'board' && board.id === front.id ? 'active' : '')
                      }
                      key={front.id}
                      onClick={() => openFront(front.id)}
                    >
                      <span className="bp-nav-dot" />
                      <span className="navtxt">
                        {front.name}
                        <span className="tinyline">{front.status}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </aside>
        <main className="main" id="workspace-main" tabIndex={-1}>
          <div className="workspace bp-wide oj-workspace">{content}</div>
        </main>
      </div>
      <input
        type="file"
        ref={file}
        accept="application/json,.json"
        hidden
        aria-label="Arquivo JSON para importar"
        onChange={(event) => void importFile(event)}
      />
      {editor && (
        <Editor
          onDelete={(target) => {
            const count =
              target.type === 'macro'
                ? data.boards.filter((b) => b.macroId === target.id).length
                : 0;
            if (
              !confirm(
                target.type === 'macro'
                  ? `Excluir este macroprocesso e seus ${count} contextos/produtos? Seus casos, etapas e registros serão removidos da área ativa e preservados no backup JSON.`
                  : target.type === 'front'
                    ? 'Excluir este contexto/produto e todos os seus casos e etapas? O conteúdo será preservado no backup JSON.'
                    : 'Excluir esta etapa? As funcionalidades permanecem no catálogo e o conteúdo no backup JSON.',
              )
            )
              return;
            try {
              mutate((draft) => removeHierarchy(draft, target), true);
              setEditor(null);
              navigate('overview');
              setMessage(
                'Registro excluído. O conteúdo removido continua disponível na exportação JSON.',
              );
            } catch (error: any) {
              setMessage(error.message);
            }
          }}
          key={[editor.type, editor.id, editor.boardId, editor.caseId].join(':')}
          state={data}
          matrix={matrix}
          target={editor}
          change={mutate}
          close={() => void closeEditor()}
          status={api.status}
          error={api.error}
        />
      )}
    </div>
  );
}
