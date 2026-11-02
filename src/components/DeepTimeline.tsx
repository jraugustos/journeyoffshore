'use client';
import { useState } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { RELEASES, type RecordData, type WorkspaceData } from '@/lib/domain';
import { deepTimeline } from '@/lib/deepTimeline';
import { phaseStyle } from '@/lib/presentation';
import { Phase, People } from './Visuals';
const positions: Record<string, number> = {
  '': 0,
  'Day-1': 28,
  'Release A': 42.4,
  'Release B': 56.8,
  'Release C': 71.2,
  'Release D': 85.6,
};
export default function DeepTimeline({
  state,
  matrix,
  editFeature,
  editStep,
  openFront,
}: {
  state: WorkspaceData;
  matrix: RecordData;
  editFeature: (id: string) => void;
  editStep: (boardId: string, caseId: string, id: string) => void;
  openFront: (id: string) => void;
}) {
  const [filter, setFilter] = useState('all'),
    [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const groups = deepTimeline(state, matrix);
  const rows = groups.flatMap((g) => g.contexts.flatMap((c) => c.rows));
  const visibleGroups = groups.filter((g) =>
    g.contexts.some((c) =>
      c.rows.some((row) => filter === 'all' || row.phases.some((p) => p.phase === filter)),
    ),
  );
  return (
    <div className="lt-page oj-launch-page oj-deep-timeline">
      <section className="lt-hero">
        <h1>
          Timeline <em>Aprofundada</em>
        </h1>
        <p>
          Casos de uso da blueprint, organizados por macroprocesso e contexto/produto. Os marcos
          refletem as etapas de cada caso e acompanham suas alterações.
        </p>
      </section>
      <div className="lt-section-hd">
        <h2>Roadmap dos casos de uso</h2>
        <div className="lt-actions">
          <label>
            Marco{' '}
            <select
              aria-label="Marco da timeline aprofundada"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos os marcos</option>
              <option value="">A definir</option>
              {RELEASES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <button
            className="btn tiny"
            onClick={() => setExpanded(Object.fromEntries(rows.map((r) => [r.item.uid, true])))}
          >
            Expandir tudo
          </button>
          <button className="btn tiny" onClick={() => setExpanded({})}>
            Recolher tudo
          </button>
        </div>
      </div>
      {!visibleGroups.length ? (
        <div className="oj-empty-panel">
          <h3>
            {rows.length ? 'Nenhum caso neste marco' : 'A blueprint ainda não possui casos de uso'}
          </h3>
          <p>
            {rows.length
              ? 'Escolha outro marco para consultar os casos da blueprint.'
              : 'Crie um contexto/produto e seus casos para construir esta timeline.'}
          </p>
        </div>
      ) : (
        <section className="lt-timeline-card">
          <div
            className="lt-scroll"
            role="region"
            aria-label="Timeline aprofundada com rolagem horizontal"
            tabIndex={0}
          >
            <div className="lt-rail">
              <div className="lt-phase-head">
                <div className="lt-labelhead">Contexto / caso de uso</div>
                <div className="lt-phases">
                  {['A definir', ...RELEASES].map((p, i) => (
                    <div
                      key={p}
                      className={
                        'lt-phase ' +
                        (i ? 'future phase-' + ['day', 'a', 'b', 'c', 'd'][i - 1] : '')
                      }
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              {visibleGroups.map(({ macro, contexts }) => (
                <section key={macro.id} className="oj-roadmap-macro">
                  <h3>{macro.name}</h3>
                  {contexts.map(({ board, rows }) => {
                    const visible = rows.filter(
                      (row) => filter === 'all' || row.phases.some((p) => p.phase === filter),
                    );
                    if (!visible.length) return null;
                    return (
                      <section key={board.id} className="oj-roadmap-context">
                        <div className="oj-roadmap-context-head">
                          <button onClick={() => openFront(board.id)}>{board.name}</button>
                          <People people={state.people} ids={board.ownerIds} />
                        </div>
                        {visible.map(({ item, phases }) => (
                          <details
                            key={item.uid}
                            data-study-case={item.uid}
                            className="lt-entry"
                            open={!!expanded[item.uid]}
                            onToggle={(e) => {
                              const open = e.currentTarget.open;
                              setExpanded((prev) =>
                                prev[item.uid] === open ? prev : { ...prev, [item.uid]: open },
                              );
                            }}
                          >
                            <summary>
                              <div className="lt-namebox">
                                <div className="lt-nameinfo">
                                  <strong>
                                    {item.title === 'Padrão' ? 'Caso padrão' : item.title}
                                  </strong>
                                  <small>
                                    {item.steps.length}{' '}
                                    {item.steps.length === 1 ? 'etapa' : 'etapas'}
                                    {item.isDefault ? ' · Caso padrão' : ''}
                                  </small>
                                </div>
                                <ChevronDown size={16} />
                              </div>
                              <div className="lt-track">
                                {[0, 28, 42.4, 56.8, 71.2, 85.6, 100].map((n) => (
                                  <i key={n} className="lt-vline" style={{ left: n + '%' }} />
                                ))}
                                {phases
                                  .filter((p) => filter === 'all' || p.phase === filter)
                                  .map((p) => (
                                    <span
                                      key={p.phase}
                                      className="lt-marker oj-study-marker"
                                      data-study-phase={p.phase || 'none'}
                                      style={{
                                        ...phaseStyle(p.phase),
                                        left: `calc(${positions[p.phase]}% + 3px)`,
                                        width: `calc(${p.phase ? 14.4 : 28}% - 8px)`,
                                      }}
                                      title={p.steps.map((s) => s.name).join(', ')}
                                    >
                                      {p.steps.length
                                        ? p.steps.length +
                                          ' etapa' +
                                          (p.steps.length > 1 ? 's' : '')
                                        : 'Sem etapas'}
                                    </span>
                                  ))}
                              </div>
                            </summary>
                            <div className="lt-expand">
                              {phases
                                .filter((p) => filter === 'all' || p.phase === filter)
                                .map((p) => (
                                  <section key={p.phase} className="oj-study-phase">
                                    <Phase value={p.phase} />
                                    {!p.steps.length && (
                                      <p>Adicione as etapas deste caso na blueprint.</p>
                                    )}
                                    {p.steps.map((step) => (
                                      <div key={step.uid} className="oj-study-step">
                                        <button
                                          className="oj-study-step-title"
                                          onClick={() => editStep(board.id, item.uid, step.uid)}
                                        >
                                          {step.name}
                                          <Pencil size={14} />
                                        </button>
                                        {step.objective && <p>{step.objective}</p>}
                                        <div className="lt-features">
                                          {step.features.map((f: RecordData) => (
                                            <button
                                              key={f.id}
                                              disabled={!!f.missing}
                                              className="lt-feature"
                                              onClick={() => editFeature(f.id)}
                                            >
                                              <span className="lt-feature-id">{f.id}</span>
                                              <span className="lt-feature-body">
                                                <strong>{f.funcionalidade}</strong>
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </section>
                                ))}
                              <button className="btn tiny" onClick={() => openFront(board.id)}>
                                Abrir blueprint de {board.name}
                              </button>
                            </div>
                          </details>
                        ))}
                      </section>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        </section>
      )}
      <p className="oj-context">
        Cada linha representa um caso de uso. Uma linha pode ocupar vários marcos, conforme as
        etapas foram tagueadas. A definir reúne etapas sem marco e casos ainda sem etapas. As
        posições são indicativas e não representam datas ou duração.
      </p>
    </div>
  );
}
