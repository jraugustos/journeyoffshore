'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Pencil, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { defaultCase, type RecordData, type WorkspaceData } from '@/lib/domain';
import type { EditorTarget } from './Editor';
import FieldPopover, { fieldAnchor, fieldPanelId, type FieldAnchor } from './FieldPopover';
import RecordPicker from './RecordPicker';
import { canonicalPhase, featurePhase } from '@/lib/presentation';

export { Phase } from './Visuals';
import { Phase, People, RecordTag, OperationCard } from './Visuals';
export function Status({ value }: { value?: string }) {
  return (
    <span
      className={
        'oj-status ' +
        (value === 'Priorizado' || value === 'Validado' || value === 'Concluída'
          ? 'is-positive'
          : '')
      }
    >
      {value || 'Em definição'}
    </span>
  );
}
export function RecordTags({
  state,
  kind,
  ids = [],
}: {
  state: WorkspaceData;
  kind: string;
  ids?: string[];
}) {
  return (
    <>
      {ids.map((id) => {
        const record = (state[kind] || []).find((item: RecordData) => item.id === id);
        return <RecordTag key={id} kind={kind} record={record || { name: 'Vínculo a revisar' }} />;
      })}
    </>
  );
}
const LANES = [
  ['actor', 'Ator', 'Quem executa esta etapa?'],
  ['channel', 'Canal', 'Por onde o ator executa?'],
  ['operation', 'Operação', 'Qual operação responde e qual é seu papel?'],
  ['system', 'Sistema', 'Qual sistema executa o processo?'],
  ['capabilities', 'Capacidades', 'O que precisa existir ou ser ativado?'],
  ['data', 'Dados', 'Dados necessários e suas fontes.'],
  ['support', 'Atendimento', 'Como acontece o suporte?'],
];

function Lane({ lane, step, state }: { lane: string; step: RecordData; state: WorkspaceData }) {
  const empty = <span className="oj-empty-cell">A preencher</span>;
  if (step.placeholder) return empty;
  if (lane === 'actor')
    return step.actorIds?.length ? (
      <RecordTags state={state} kind="actors" ids={step.actorIds} />
    ) : (
      empty
    );
  if (lane === 'channel')
    return step.channelIds?.length ? (
      <RecordTags state={state} kind="channels" ids={step.channelIds} />
    ) : (
      empty
    );
  if (lane === 'system')
    return step.systemIds?.length ? (
      <RecordTags state={state} kind="systems" ids={step.systemIds} />
    ) : (
      empty
    );
  if (lane === 'operation')
    return step.operationLinks?.length ? (
      <>
        {step.operationLinks.map((item: RecordData) => (
          <OperationCard
            key={item.areaId}
            record={
              state.operations.find((record: RecordData) => record.id === item.areaId) || {
                name: 'Vínculo a revisar',
              }
            }
            role={item.role}
          />
        ))}
      </>
    ) : (
      empty
    );
  if (lane === 'capabilities')
    return step.capabilityIds?.length || step.capabilityNotes ? (
      <>
        {(step.capabilityIds || []).map((id: string) => {
          const capability = state.capabilities.find((c: RecordData) => c.id === id);
          const front = state.boards.find((b) =>
            b.cases.some((c: RecordData) => c.steps.some((s: RecordData) => s.uid === step.uid)),
          );
          const assignment = state.responsibilities?.find(
            (r: RecordData) => r.capabilityId === id && r.context === 'board:' + front?.id,
          );
          return (
            <span className="oj-capability-responsibility" key={id}>
              <RecordTags state={state} kind="capabilities" ids={[id]} />
              <People
                people={state.people}
                ids={assignment ? assignment.personIds : capability?.ownerIds}
              />
            </span>
          );
        })}
        {step.capabilityNotes && <span>{step.capabilityNotes}</span>}
      </>
    ) : (
      empty
    );
  if (lane === 'data')
    return step.dataNotApplicable ? (
      <span>Sem dados adicionais</span>
    ) : step.dataRequirements?.length ? (
      <>
        {step.dataRequirements.map((item: RecordData) => (
          <span className="oj-operation-tag" key={item.uid}>
            <strong>{item.name || 'Dado a definir'}</strong>
            {item.providerId ? (
              <RecordTags state={state} kind={item.providerKind} ids={[item.providerId]} />
            ) : (
              <small>Fonte a definir</small>
            )}
            {item.note && <small>{item.note}</small>}
          </span>
        ))}
      </>
    ) : (
      empty
    );
  return step.support || empty;
}

function InsertControl({
  label,
  onClick,
  start = false,
  alternative,
}: {
  label: string;
  onClick: () => void;
  start?: boolean;
  alternative?: { label: string; onClick: () => void };
}) {
  const [anchor, setAnchor] = useState<FieldAnchor | null>(null);
  const panelId = useId();
  return (
    <div className={'oj-bp-insert' + (start ? ' is-start' : '')}>
      <button
        type="button"
        aria-label={label}
        data-insert-alternative={alternative?.label}
        aria-haspopup={alternative ? 'dialog' : undefined}
        aria-expanded={alternative ? !!anchor : undefined}
        aria-controls={anchor ? panelId : undefined}
        onClick={(event) => (alternative ? setAnchor(fieldAnchor(event.currentTarget)) : onClick())}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
      <span className="oj-bp-insert-label" aria-hidden="true">
        {label}
      </span>
      {anchor && alternative && (
        <FieldPopover
          id={panelId}
          label="Posição do novo item"
          anchor={anchor}
          onClose={() => setAnchor(null)}
        >
          <div className="oj-insert-options">
            {[{ label, onClick }, alternative].map((action) => (
              <button
                type="button"
                key={action.label}
                onClick={() => {
                  setAnchor(null);
                  action.onClick();
                }}
              >
                <Plus size={14} aria-hidden="true" />
                {action.label}
              </button>
            ))}
          </div>
        </FieldPopover>
      )}
    </div>
  );
}

export default function Blueprint({
  state,
  matrix,
  boardId,
  macroFilter,
  profileFilter,
  releaseFilter,
  statusFilter,
  selectedCases,
  setCase,
  edit,
  openFront,
  addMacro,
  addFront,
  addStep,
  moveStep,
  activeEditor,
}: {
  activeEditor?: EditorTarget | null;
  state: WorkspaceData;
  matrix: RecordData;
  boardId?: string;
  macroFilter: string;
  profileFilter: string;
  releaseFilter: string;
  statusFilter: string;
  selectedCases: Record<string, string>;
  setCase: (boardId: string, id: string) => void;
  edit: (target: EditorTarget) => void;
  openFront: (id: string) => void;
  addMacro: (beforeId?: string) => void;
  addFront: (macroId: string, beforeId?: string) => void;
  addStep: (boardId: string, caseId: string, beforeId?: string) => void;
  moveStep: (boardId: string, caseId: string, id: string, direction: number) => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeEditor || activeEditor.section) return;
    const id = activeEditor.type === 'front' ? activeEditor.boardId : activeEditor.id;
    if (!id || !['macro', 'front', 'step'].includes(activeEditor.type)) return;
    grid.current
      ?.querySelector(`[data-structure-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeEditor?.type, activeEditor?.id, activeEditor?.boardId, activeEditor?.section]);
  const groups = state.macros
    .filter(
      (macro) =>
        (!boardId || state.boards.find((board) => board.id === boardId)?.macroId === macro.id) &&
        (macroFilter === 'all' || macro.id === macroFilter),
    )
    .map((macro) => {
      const fronts = state.boards
        .filter(
          (board) =>
            board.macroId === macro.id &&
            (!boardId || board.id === boardId) &&
            (statusFilter === 'all' || board.status === statusFilter),
        )
        .map((board) => {
          const item =
            board.cases.find((row: RecordData) => row.uid === selectedCases[board.id]) ||
            defaultCase(board);
          if (profileFilter !== 'all' && !item.profiles.includes(profileFilter)) return null;
          const filtered = item.steps.filter(
            (step: RecordData) =>
              releaseFilter === 'all' ||
              (releaseFilter === 'none'
                ? !step.release
                : canonicalPhase(step.release) === releaseFilter),
          );
          if (releaseFilter !== 'all' && !filtered.length) return null;
          return {
            board,
            item,
            steps: filtered.length
              ? filtered
              : [{ uid: 'empty-' + board.id, name: 'Etapas a definir', placeholder: true }],
          };
        })
        .filter(Boolean) as { board: RecordData; item: RecordData; steps: RecordData[] }[];
      return {
        macro,
        fronts,
        count: Math.max(
          1,
          fronts.reduce((n, front) => n + front.steps.length, 0),
        ),
      };
    })
    .filter(
      (group) =>
        group.fronts.length ||
        (!boardId &&
          !state.boards.some((board) => board.macroId === group.macro.id) &&
          statusFilter === 'all' &&
          releaseFilter === 'all' &&
          profileFilter === 'all'),
    );
  if (!groups.length)
    return (
      <div className="oj-empty-panel">
        <h3>{state.macros.length ? 'Nenhuma etapa neste recorte' : 'Comece sua blueprint'}</h3>
        <p>
          {state.macros.length
            ? 'Altere os filtros para consultar outras partes do blueprint.'
            : 'Adicione um macroprocesso e organize seus contextos/produtos e etapas.'}
        </p>
        {!state.macros.length && (
          <button className="btn dark" onClick={() => addMacro()}>
            <Plus size={16} /> Adicionar macroprocesso
          </button>
        )}
      </div>
    );
  const flat = groups.flatMap((group) =>
    group.fronts.flatMap((front) => front.steps.map((step) => ({ ...front, step }))),
  );
  const columns = groups.reduce((count, group) => count + group.count, 0);
  const visibleFronts = groups.flatMap((group) => group.fronts);
  let macroColumn = 2;
  let frontColumn = 2;
  const cells: React.ReactNode[] = [];
  for (const [groupIndex, group] of groups.entries()) {
    const macroIndex = state.macros.findIndex((macro) => macro.id === group.macro.id);
    const siblings = state.boards.filter((front) => front.macroId === group.macro.id);
    cells.push(
      <div
        className={
          'bp-cell bp-macro oj-macro oj-structure-cell ' +
          (['Não priorizado', 'Desativado'].includes(group.macro.status) ? 'is-muted' : '')
        }
        key={'macro-' + group.macro.id}
        style={{ gridColumn: `${macroColumn} / span ${group.count}`, gridRow: 1 }}
        data-testid={'macro-' + group.macro.id}
        data-structure-id={group.macro.id}
      >
        <button
          type="button"
          aria-label={'Editar macroprocesso ' + group.macro.name}
          onClick={() => edit({ type: 'macro', id: group.macro.id })}
        >
          <span>{group.macro.name}</span>
          <Pencil size={15} />
        </button>
        <div className="oj-macro-meta">
          <Status value={group.macro.status} />
        </div>
        {groupIndex === 0 && (
          <InsertControl
            start
            label={'Adicionar macroprocesso antes de ' + group.macro.name}
            onClick={() => addMacro(group.macro.id)}
          />
        )}
        <InsertControl
          label={'Adicionar macroprocesso depois de ' + group.macro.name}
          onClick={() => addMacro(state.macros[macroIndex + 1]?.id)}
        />
      </div>,
    );
    macroColumn += group.count;
    if (!group.fronts.length) {
      cells.push(
        <div
          className="bp-cell oj-empty-macro"
          key={'empty-' + group.macro.id}
          style={{ gridColumn: frontColumn++, gridRow: boardId ? '2 / span 10' : '2 / span 9' }}
        >
          <button className="btn" onClick={() => addFront(group.macro.id)}>
            <Plus size={15} />
            Adicionar contexto / produto
          </button>
          <p>Crie um contexto/produto para começar a desenhar este macroprocesso.</p>
        </div>,
      );
      continue;
    }
    for (const [frontIndex, front] of group.fronts.entries()) {
      const siblingIndex = siblings.findIndex((board) => board.id === front.board.id);
      const nextGroup = groups[groupIndex + 1];
      const nextFront =
        visibleFronts[visibleFronts.findIndex((row) => row.board.id === front.board.id) + 1];
      const startsSection =
        frontIndex === 0 && (groupIndex === 0 || !groups[groupIndex - 1].fronts.length);
      cells.push(
        <div
          className="bp-cell bp-product oj-product oj-structure-cell"
          key={'front-' + front.board.id}
          style={{ gridColumn: `${frontColumn} / span ${front.steps.length}`, gridRow: 2 }}
          data-structure-id={front.board.id}
        >
          <div className="oj-product-heading">
            <button onClick={() => openFront(front.board.id)} className="bp-product-title">
              {front.board.name}
              <ArrowUpRight size={16} />
            </button>
            <button
              className="oj-icon"
              type="button"
              aria-label={'Editar contexto / produto ' + front.board.name}
              title="Editar contexto / produto"
              onClick={() => edit({ type: 'front', boardId: front.board.id })}
            >
              <Pencil size={15} />
            </button>
          </div>
          <button
            className="oj-context-select"
            aria-label={'Responsáveis de ' + front.board.name}
            aria-expanded={
              activeEditor?.type === 'front' &&
              activeEditor.boardId === front.board.id &&
              activeEditor.section === 'owners'
            }
            aria-controls={
              activeEditor?.type === 'front' &&
              activeEditor.boardId === front.board.id &&
              activeEditor.section === 'owners'
                ? fieldPanelId('front', front.board.id, 'owners')
                : undefined
            }
            aria-haspopup="dialog"
            onClick={(event) =>
              edit({
                type: 'front',
                boardId: front.board.id,
                section: 'owners',
                anchor: fieldAnchor(event.currentTarget),
              })
            }
          >
            <span>
              {(front.board.ownerIds || [])
                .slice(0, 2)
                .map(
                  (id: string) => state.people.find((person: RecordData) => person.id === id)?.name,
                )
                .filter(Boolean)
                .join(', ') || 'A definir'}
              {front.board.ownerIds?.length > 2 ? ' +' + (front.board.ownerIds.length - 2) : ''}
            </span>
            <ChevronDown size={14} />
          </button>
          <RecordPicker
            label={'Caso de uso de ' + front.board.name}
            records={front.board.cases.map((item: RecordData) => ({
              id: item.uid,
              name: item.isDefault ? 'Caso padrão' : item.title,
            }))}
            selected={[front.item.uid]}
            onChange={(ids) => setCase(front.board.id, ids[0])}
            multiple={false}
            variant="context"
            hideLabel
          />
          {startsSection && (
            <InsertControl
              start
              label={'Adicionar contexto / produto antes de ' + front.board.name}
              onClick={() => addFront(group.macro.id, front.board.id)}
            />
          )}
          <InsertControl
            label={'Adicionar contexto / produto depois de ' + front.board.name}
            onClick={() => addFront(group.macro.id, siblings[siblingIndex + 1]?.id)}
            alternative={
              frontIndex === group.fronts.length - 1 && nextGroup?.fronts.length
                ? {
                    label:
                      'Adicionar contexto / produto antes de ' + nextGroup.fronts[0].board.name,
                    onClick: () => addFront(nextGroup.macro.id, nextGroup.fronts[0].board.id),
                  }
                : undefined
            }
          />
        </div>,
      );
      for (const [index, step] of front.steps.entries()) {
        const column = frontColumn + index;
        const stepIndex = front.item.steps.findIndex((item: RecordData) => item.uid === step.uid);
        cells.push(
          <div
            className="bp-cell bp-step-head oj-step oj-structure-cell"
            key={'step-' + step.uid}
            style={{ gridColumn: column, gridRow: 3 }}
            data-structure-id={step.uid}
          >
            <div className="bp-step-count">
              <span>{String(step.placeholder ? 1 : stepIndex + 1).padStart(2, '0')}</span>
              {!step.placeholder && (
                <span className="oj-step-order">
                  <button
                    className="oj-icon"
                    disabled={stepIndex === 0}
                    aria-label={'Mover ' + step.name + ' para antes'}
                    onClick={() => moveStep(front.board.id, front.item.uid, step.uid, -1)}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    className="oj-icon"
                    disabled={stepIndex === front.item.steps.length - 1}
                    aria-label={'Mover ' + step.name + ' para depois'}
                    onClick={() => moveStep(front.board.id, front.item.uid, step.uid, 1)}
                  >
                    <ChevronRight size={13} />
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                step.placeholder
                  ? addStep(front.board.id, front.item.uid)
                  : edit({
                      type: 'step',
                      boardId: front.board.id,
                      caseId: front.item.uid,
                      id: step.uid,
                    })
              }
            >
              {step.name}
            </button>
            {!step.placeholder && (
              <>
                <div className="oj-step-flags">
                  <button
                    className="oj-inline-flag"
                    aria-label={'Alterar status de ' + step.name}
                    onClick={(event) =>
                      edit({
                        type: 'step',
                        boardId: front.board.id,
                        caseId: front.item.uid,
                        id: step.uid,
                        section: 'status',
                        anchor: fieldAnchor(event.currentTarget),
                      })
                    }
                  >
                    <Status value={step.status} />
                  </button>
                  <button
                    className="oj-inline-flag"
                    aria-label={'Alterar marco de ' + step.name}
                    onClick={(event) =>
                      edit({
                        type: 'step',
                        boardId: front.board.id,
                        caseId: front.item.uid,
                        id: step.uid,
                        section: 'release',
                        anchor: fieldAnchor(event.currentTarget),
                      })
                    }
                  >
                    <Phase value={step.release} />
                  </button>
                </div>
                <button
                  className="v17-purpose-tag"
                  onClick={(event) =>
                    edit({
                      type: 'step',
                      boardId: front.board.id,
                      caseId: front.item.uid,
                      id: step.uid,
                      section: 'objective',
                      anchor: fieldAnchor(event.currentTarget),
                    })
                  }
                >
                  {step.objective || '+ Objetivo'}
                </button>
              </>
            )}
            {!step.placeholder && index === 0 && startsSection && (
              <InsertControl
                start
                label={'Adicionar etapa antes de ' + step.name}
                onClick={() => addStep(front.board.id, front.item.uid, step.uid)}
              />
            )}
            <InsertControl
              label={
                step.placeholder
                  ? 'Adicionar primeira etapa em ' + front.board.name
                  : 'Adicionar etapa depois de ' + step.name
              }
              onClick={() =>
                addStep(front.board.id, front.item.uid, front.item.steps[stepIndex + 1]?.uid)
              }
              alternative={
                index === front.steps.length - 1 &&
                nextFront &&
                (frontIndex < group.fronts.length - 1 || nextGroup?.fronts.length)
                  ? {
                      label: nextFront.steps[0].placeholder
                        ? 'Adicionar primeira etapa em ' + nextFront.board.name
                        : 'Adicionar etapa antes de ' + nextFront.steps[0].name,
                      onClick: () =>
                        addStep(
                          nextFront.board.id,
                          nextFront.item.uid,
                          nextFront.steps[0].placeholder ? undefined : nextFront.steps[0].uid,
                        ),
                    }
                  : undefined
              }
            />
          </div>,
        );
        LANES.forEach(([key, label], laneIndex) =>
          cells.push(
            <button
              type="button"
              className="bp-cell bp-value oj-lane"
              key={key + '-' + step.uid}
              style={{ gridColumn: column, gridRow: laneIndex + 4 }}
              aria-label={'Editar ' + label.toLocaleLowerCase() + ' de ' + step.name}
              onClick={(event) =>
                step.placeholder
                  ? addStep(front.board.id, front.item.uid)
                  : edit({
                      type: 'step',
                      boardId: front.board.id,
                      caseId: front.item.uid,
                      id: step.uid,
                      section: key,
                      anchor: fieldAnchor(event.currentTarget),
                    })
              }
            >
              <Lane lane={key} step={step} state={state} />
            </button>,
          ),
        );
        if (boardId)
          cells.push(
            <div
              className="bp-cell bp-functional"
              key={'features-' + step.uid}
              style={{ gridColumn: column, gridRow: 11 }}
            >
              <details>
                <summary>{step.featureIds?.length || 0} funcionalidades</summary>
                {(step.featureIds || []).map((id: string) => (
                  <button
                    key={id}
                    className="bp-fref"
                    onClick={() => edit({ type: 'feature', id })}
                  >
                    <span className="oj-feature-heading">
                      <strong className="oj-feature-code">{id}</strong>
                      <Phase
                        value={featurePhase(
                          matrix.items.find((item: RecordData) => item.id === id) || {},
                          state.featureRouting?.[id],
                        )}
                      />
                    </span>
                    <span className="oj-feature-description">
                      {matrix.items.find((item: RecordData) => item.id === id)?.funcionalidade}
                    </span>
                  </button>
                ))}
              </details>
            </div>,
          );
      }
      frontColumn += front.steps.length;
    }
  }
  return (
    <>
      <div className="bp-scroll-hint">
        <span>Deslize para percorrer as etapas</span>
        <span>{flat.filter((item) => !item.step.placeholder).length} etapas exibidas</span>
      </div>
      <div
        className="bp-scroll oj-blueprint-scroll"
        tabIndex={0}
        aria-label="Blueprint com rolagem horizontal"
      >
        <div
          ref={grid}
          className="bp-grid oj-blueprint"
          style={
            {
              '--bp-cols': columns,
              gridTemplateRows:
                'minmax(96px,auto) minmax(84px,auto) minmax(145px,auto) repeat(7,minmax(88px,auto))' +
                (boardId ? ' auto' : ''),
            } as React.CSSProperties
          }
        >
          <div className="bp-cell bp-label bp-macro-label" style={{ gridColumn: 1, gridRow: 1 }}>
            Macroprocessos
          </div>
          <div className="bp-cell bp-label" style={{ gridColumn: 1, gridRow: 2 }}>
            Contexto / produto
          </div>
          <div className="bp-cell bp-label" style={{ gridColumn: 1, gridRow: 3 }}>
            Etapas do processo
          </div>
          {LANES.map(([key, label, description], index) => (
            <div
              className="bp-cell bp-label"
              key={key}
              style={{ gridColumn: 1, gridRow: index + 4 }}
            >
              {label}
              <small>{description}</small>
            </div>
          ))}
          {boardId && (
            <div className="bp-cell bp-label" style={{ gridColumn: 1, gridRow: 11 }}>
              Funcionalidades
            </div>
          )}
          {cells}
        </div>
      </div>
    </>
  );
}
