'use client';
import { useState } from 'react';
import type { RecordData, WorkspaceData } from '@/lib/domain';
import { RELEASES } from '@/lib/domain';
import { featurePhase, phaseStyle } from '@/lib/presentation';
import { Phase, PhaseLegend } from './Visuals';
import DeepTimeline from './DeepTimeline';

const POSITIONS: Record<string, number> = {
  'Day-1': 28,
  'Release A': 42.4,
  'Release B': 56.8,
  'Release C': 71.2,
  'Release D': 85.6,
};
function boardFor(item: RecordData) {
  if (/debit/i.test(item.name)) return 'banking';
  if (/mortgage/i.test(item.name)) return 'mortgage';
  if (/other loan/i.test(item.name)) return 'credit';
  return (
    (
      {
        accounts: 'banking',
        payments: 'banking',
        channels: 'banking',
        reporting: 'wealth',
      } as Record<string, string>
    )[item.board] || item.board
  );
}
function ProductTags({ product }: { product: RecordData }) {
  return (
    <>
      {product.outsourced && <span className="tiny-tag outsourced">{product.outsourced}</span>}
      {product.platform && <span className="tiny-tag">{product.platform}</span>}
    </>
  );
}
function Products({ item }: { item: RecordData }) {
  if (item.kind === 'integration')
    return (
      <div className="lt-no-items">
        Este marco corresponde a uma integração, e não a um produto adicional na prateleira. O
        escopo de contas, dados e transações será definido no aprofundamento.
      </div>
    );
  if (!item.products?.length)
    return (
      <div className="lt-no-items">
        O inventário não apresenta uma lista de componentes para este item.
      </div>
    );
  if (item.kind === 'existing')
    return (
      <div className="lt-products">
        {[...new Set<string>(item.products.map((p: RecordData) => p.category))].map((category) => {
          const rows = item.products.filter((p: RecordData) => p.category === category);
          return (
            <details className="lt-cat" key={category}>
              <summary>
                <strong>{category}</strong>
                <span>{rows.length} produtos</span>
              </summary>
              <div className="lt-catalog-body">
                {[...new Set<string>(rows.map((p: RecordData) => p.group))].map((group) => (
                  <div key={group}>
                    <div className="lt-subgroup-name">{group}</div>
                    {rows
                      .filter((p: RecordData) => p.group === group)
                      .map((p: RecordData, index: number) => (
                        <div className="lt-prod-row" key={index}>
                          <span>{p.name}</span>
                          <ProductTags product={p} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    );
  return item.products.map((p: RecordData, index: number) => (
    <div className="lt-single-prod" key={index}>
      <div>
        <strong>{p.name}</strong>
        <p>
          {p.category} · {p.group}
        </p>
      </div>
      <div className="lt-tags">
        <ProductTags product={p} />
      </div>
    </div>
  ));
}
function PlannedTimeline({
  launch,
  matrix,
  state,
  editFeature,
  openFront,
  openCatalog,
}: {
  launch: RecordData;
  matrix: RecordData;
  state: WorkspaceData;
  editFeature: (id: string) => void;
  openFront: (id: string) => void;
  openCatalog: (phase: string) => void;
}) {
  const [filter, setFilter] = useState('all'),
    [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const rows = launch.items.filter((item: RecordData) => filter === 'all' || item.phase === filter);
  const expandAll = (open: boolean) =>
    setExpanded(Object.fromEntries(launch.items.map((item: RecordData) => [item.id, open])));
  return (
    <div className="lt-page oj-launch-page">
      <section className="lt-hero">
        <div className="eyebrow">DeNovo Bank Program · Product Roadmap</div>
        <h1>
          Launch <em>Timeline</em>
        </h1>
        <p>
          Visão indicativa da evolução dos produtos. Abra cada lançamento para consultar o
          inventário e as funcionalidades relacionadas.
        </p>
      </section>
      <div className="lt-metrics">
        <div className="lt-metric">
          <strong>{launch.items.length}</strong>
          <span>marcos e itens na timeline</span>
        </div>
        <div className="lt-metric">
          <strong>
            {launch.clientCurrentCount ||
              launch.items.find((item: RecordData) => item.kind === 'existing')?.products.length}
          </strong>
          <span>produtos da oferta atual no catálogo</span>
        </div>
        <div className="lt-metric">
          <strong>9 + 1</strong>
          <span>novos produtos/serviços + integração Avenue</span>
        </div>
      </div>
      <PhaseLegend />
      <div className="lt-section-hd">
        <div>
          <div className="heading-kicker">EVOLUÇÃO DA OFERTA · INDICATIVA</div>
          <h2>Planejamento de lançamentos</h2>
        </div>
        <div className="lt-actions">
          <label>
            Marco{' '}
            <select
              aria-label="Marco da timeline"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todos os marcos</option>
              {RELEASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase} · {launch.items.filter((item: RecordData) => item.phase === phase).length}
                </option>
              ))}
            </select>
          </label>
          <button className="btn tiny" onClick={() => expandAll(true)}>
            Expandir tudo
          </button>
          <button className="btn tiny" onClick={() => expandAll(false)}>
            Recolher tudo
          </button>
        </div>
      </div>
      <section className="lt-timeline-card">
        <div
          className="lt-scroll"
          role="region"
          aria-label="Timeline de produtos (rolagem horizontal)"
          tabIndex={0}
        >
          <div className="lt-rail">
            <div className="lt-phase-head">
              <div className="lt-labelhead">Produto / Serviço</div>
              <div className="lt-phases">
                {['Today · Now', ...RELEASES].map((phase, index) => (
                  <div
                    key={phase}
                    className={
                      'lt-phase ' +
                      (index ? 'future phase-' + ['day', 'a', 'b', 'c', 'd'][index - 1] : '')
                    }
                  >
                    {phase}
                  </div>
                ))}
              </div>
            </div>
            {rows.map((item: RecordData, index: number) => {
              const at = POSITIONS[item.phase] || 28,
                related = item.featureIds
                  .map((id: string) => matrix.items.find((f: RecordData) => f.id === id))
                  .filter(Boolean),
                frontId = boardFor(item),
                front = state.boards.find((front) => front.id === frontId);
              return (
                <details
                  key={item.id}
                  data-launch-id={item.id}
                  className={
                    'lt-entry ' +
                    (!index || rows[index - 1].phase !== item.phase ? 'break-before' : '')
                  }
                  style={phaseStyle(item.phase)}
                  open={!!expanded[item.id]}
                  onToggle={(event) => {
                    const open = event.currentTarget.open;
                    setExpanded((previous) =>
                      previous[item.id] === open ? previous : { ...previous, [item.id]: open },
                    );
                  }}
                >
                  <summary>
                    <div className="lt-namebox">
                      <span className="lt-dot" />
                      <div className="lt-nameinfo">
                        <strong>{item.name}</strong>
                        <small>
                          {item.kind === 'existing'
                            ? `${item.products.length} produtos na oferta atual`
                            : item.kind === 'integration'
                              ? 'Integração · contas Avenue'
                              : 'Nova oferta prevista'}
                        </small>
                      </div>
                      <span className="lt-openicon" aria-hidden="true">
                        ⌄
                      </span>
                    </div>
                    <div className="lt-track">
                      {[0, 28, 42.4, 56.8, 71.2, 85.6, 100].map((n) => (
                        <i className="lt-vline" key={n} style={{ left: n + '%' }} />
                      ))}
                      <div
                        className={'lt-prep ' + (item.prep === 'tbd' ? 'tbd' : '')}
                        style={{ width: Math.max(at - 1, 5) + '%' }}
                      >
                        {item.prep === 'tbd' ? 'Preparação a definir' : 'Prep Work'}
                      </div>
                      <div
                        className="lt-marker"
                        style={{ left: `calc(${at}% + 3px)`, width: 'calc(14.4% - 8px)' }}
                      >
                        {item.kind === 'existing'
                          ? 'Current Suite'
                          : item.kind === 'integration'
                            ? 'Integração'
                            : 'Launch'}
                      </div>
                    </div>
                  </summary>
                  <div className="lt-expand">
                    <div className="lt-expand-head">
                      <div>
                        <div className="heading-kicker">DETALHE DO MARCO · {item.phase}</div>
                        <h3>O que contempla: {item.name}</h3>
                        <p>{item.note}</p>
                      </div>
                      <div className="lt-tags">
                        <span className="pill outline">
                          {item.kind === 'existing'
                            ? 'Oferta atual'
                            : item.kind === 'integration'
                              ? 'Integração'
                              : 'Novo produto'}
                        </span>
                        {item.products.length > 0 && (
                          <span className="pill outline">{item.products.length} produtos</span>
                        )}
                        <span className="pill orange">
                          {related.length} funcionalidades relacionadas
                        </span>
                      </div>
                    </div>
                    {item.sourceNote && (
                      <div className="lt-no-phase-note">
                        <b>Atenção:</b> {item.sourceNote}
                      </div>
                    )}
                    <div className="lt-section-title">
                      {item.kind === 'integration'
                        ? 'Escopo da integração'
                        : 'Produtos do inventário'}
                    </div>
                    <p className="lt-section-sub">
                      Nomes, classificações e marcos extraídos do documento DeNovo.
                    </p>
                    <Products item={item} />
                    <div className="lt-section-title">Funcionalidades relacionadas na RFI</div>
                    <p className="lt-section-sub">
                      Associação temática à matriz funcional. Não representa confirmação de entrega
                      do canal nem lista homologada de requisitos do lançamento.
                    </p>
                    {related.length ? (
                      [...new Set<string>(related.map((f: RecordData) => f.publico))].map(
                        (audience) => (
                          <div className="lt-feature-group" key={audience}>
                            <div className="lt-feature-label">
                              {audience} ·{' '}
                              {related.filter((f: RecordData) => f.publico === audience).length}{' '}
                              funcionalidades relacionadas
                            </div>
                            <div className="lt-features">
                              {related
                                .filter((f: RecordData) => f.publico === audience)
                                .map((f: RecordData) => {
                                  const phase = featurePhase(f);
                                  return (
                                    <button
                                      className="lt-feature"
                                      key={f.id}
                                      style={phaseStyle(phase)}
                                      onClick={() => editFeature(f.id)}
                                    >
                                      <span className="lt-feature-id">{f.id}</span>
                                      <span className="lt-feature-body">
                                        <strong>{f.funcionalidade}</strong>
                                        <span>
                                          {f.subjornada} · {f.rfi_ids || 'Sem código RFI direto'}
                                        </span>
                                      </span>
                                      <span className="lt-tags">
                                        <Phase value={phase} />
                                        <span className="pill outline">{f.status_vendor}</span>
                                      </span>
                                      <span className="lt-arrow" aria-hidden="true">
                                        ↗
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="lt-no-items">
                        Não há funcionalidades vinculadas a este item na matriz de referência.
                      </div>
                    )}
                    <div className="lt-item-actions">
                      {front && (
                        <button className="btn tiny dark" onClick={() => openFront(front.id)}>
                          Abrir frente relacionada ↗
                        </button>
                      )}
                      <button className="btn tiny" onClick={() => openCatalog(item.phase)}>
                        Ver funcionalidades na matriz
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
        <div className="lt-legend">
          <span>
            <i className="dashed" />
            Preparação indicada no documento
          </span>
          <span>
            <i />
            Lançamento de produto / integração
          </span>
          <span>
            Expandir <b>⌄</b> para ver o que o item contempla
          </span>
        </div>
      </section>
      <div className="lt-note">
        <span aria-hidden="true">ⓘ</span>
        <div>
          <b>Importante sobre os marcos</b>
          <p>
            A timeline é indicativa e não contém datas para Day-1 ou Releases A–D. Os espaçamentos
            são ilustrativos. “Prep Work” e “Preparação a definir” reproduzem o documento, sem
            representar um prazo confirmado. Funcionalidade coberta pela RFI não significa
            experiência pronta no aplicativo.
          </p>
        </div>
      </div>
      <div className="lt-smallprint">
        Fontes: DeNovo_Products_and_Launch_Timeline_v24(1).html ·
        Matriz_Funcionalidades_Offshore_DeNovo_Finxact(3).html. Nenhum marco foi convertido em data
        de calendário.
      </div>
    </div>
  );
}

export default function LaunchTimeline(props: {
  launch: RecordData;
  matrix: RecordData;
  studyMatrix: RecordData;
  state: WorkspaceData;
  editFeature: (id: string) => void;
  openFront: (id: string) => void;
  openCatalog: (phase: string) => void;
  editStep: (boardId: string, caseId: string, id: string) => void;
}) {
  const [view, setView] = useState('planned');
  return (
    <>
      <div className="oj-board-tabs" role="group" aria-label="Visões do Launch Timeline">
        <button
          className={view === 'planned' ? 'is-selected' : ''}
          aria-pressed={view === 'planned'}
          onClick={() => setView('planned')}
        >
          Timeline Planejada
        </button>
        <button
          className={view === 'study' ? 'is-selected' : ''}
          aria-pressed={view === 'study'}
          onClick={() => setView('study')}
        >
          Timeline Aprofundada
        </button>
      </div>
      {view === 'planned' ? (
        <PlannedTimeline {...props} />
      ) : (
        <DeepTimeline {...props} matrix={props.studyMatrix} />
      )}
    </>
  );
}
