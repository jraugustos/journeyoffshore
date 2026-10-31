'use client';
import { useState } from 'react';
import type { RecordData } from '@/lib/domain';
import { Phase, Status } from './Blueprint';
export default function FrontBlocks({
  block,
  board,
  add,
  edit,
  remove,
  update,
  move,
}: {
  block: string;
  board: RecordData;
  add: (type: string, defaults?: RecordData) => void;
  edit: (type: string, id: string) => void;
  remove: (type: string, id: string, title: string) => void;
  update: (type: string, id: string, key: string, value: any) => void;
  move: (type: string, id: string, direction: number) => void;
}) {
  const [filter, setFilter] = useState('Abertas');
  const actions = (type: string, item: RecordData) => (
    <span className="oj-row-actions">
      <button className="btn tiny" onClick={() => edit(type, item.uid)}>
        Editar
      </button>
      <button
        className="btn tiny oj-danger"
        aria-label={'Excluir ' + (item.title || item.step)}
        onClick={() => remove(type, item.uid, item.title || item.step)}
      >
        Excluir
      </button>
    </span>
  );
  const heading = (title: string, type: string, label: string) => (
    <div className="oj-section-heading">
      <h2>{title}</h2>
      <button className="btn dark" onClick={() => add(type)}>
        {label}
      </button>
    </div>
  );
  if (block === 'asis')
    return (
      <section className="canvas-card">
        {heading('Como acontece hoje', 'asis', '+ Etapa atual')}
        <ol className="oj-asis-list">
          {(board.asis || []).map((item: RecordData, index: number) => (
            <li key={item.uid}>
              <span className="oj-asis-number">{index + 1}</span>
              <div>
                <h3>{item.step || 'Etapa a definir'}</h3>
                <dl>
                  <dt>Onde acontece</dt>
                  <dd>{item.where || 'A definir'}</dd>
                  <dt>Quem faz</dt>
                  <dd>{item.who || 'A definir'}</dd>
                  <dt>Referência</dt>
                  <dd>{item.reference || 'A definir'}</dd>
                  {item.source && (
                    <>
                      <dt>Fonte</dt>
                      <dd>{item.source}</dd>
                    </>
                  )}
                </dl>
              </div>
              <div>
                <button
                  className="btn tiny"
                  disabled={!index}
                  aria-label={'Subir etapa atual ' + item.step}
                  onClick={() => move('asis', item.uid, -1)}
                >
                  Subir
                </button>
                <button
                  className="btn tiny"
                  disabled={index === board.asis.length - 1}
                  aria-label={'Descer etapa atual ' + item.step}
                  onClick={() => move('asis', item.uid, 1)}
                >
                  Descer
                </button>
                {actions('asis', item)}
              </div>
            </li>
          ))}
        </ol>
        {!board.asis?.length && (
          <p className="oj-empty-panel">Adicione a primeira etapa do processo atual.</p>
        )}
      </section>
    );
  if (block === 'actions') {
    const rows = board.actionPlan || [];
    return (
      <section className="canvas-card action-plan-section">
        {heading('Plano de ação', 'actionPlan', '+ Nova ação')}
        <div className="plan-summary">
          <Status
            value={
              rows.filter((r: RecordData) => !['Concluída', 'Cancelada'].includes(r.status))
                .length + ' em aberto'
            }
          />
          <Status
            value={
              rows.filter((r: RecordData) => r.status === 'Em andamento').length + ' em andamento'
            }
          />
          <Status
            value={rows.filter((r: RecordData) => r.status === 'Concluída').length + ' concluídas'}
          />
        </div>
        <div className="action-list">
          {rows.map((item: RecordData) => (
            <article
              key={item.uid}
              className={'action-item ' + (item.status === 'Concluída' ? 'completed' : '')}
            >
              <div className="action-top">
                <div className="action-check">
                  <input
                    type="checkbox"
                    checked={item.status === 'Concluída'}
                    aria-label={'Concluir ação ' + item.title}
                    onChange={(e) =>
                      update(
                        'actionPlan',
                        item.uid,
                        'status',
                        e.target.checked ? 'Concluída' : 'Não iniciada',
                      )
                    }
                  />
                </div>
                <div className="action-content">
                  <div className="tags">
                    <Status value={item.status} />
                    <Status value={item.priority} />
                    <Phase value={item.horizon} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.detail || 'A detalhar'}</p>
                  <dl className="oj-action-meta">
                    <dt>Responsável</dt>
                    <dd>{item.owner || 'A definir'}</dd>
                    <dt>Prazo</dt>
                    <dd>{item.deadline || 'A definir'}</dd>
                    <dt>Critério de conclusão</dt>
                    <dd>{item.acceptance || 'A definir'}</dd>
                    {item.dependency && (
                      <>
                        <dt>Dependência</dt>
                        <dd>{item.dependency}</dd>
                      </>
                    )}
                    {item.source && (
                      <>
                        <dt>Origem</dt>
                        <dd>{item.source}</dd>
                      </>
                    )}
                  </dl>
                  {actions('actionPlan', item)}
                </div>
              </div>
            </article>
          ))}
        </div>
        {!rows.length && <p className="oj-empty-panel">Nenhuma ação registrada.</p>}
      </section>
    );
  }
  const csd = board.csd || [],
    decisions = board.decisions || [],
    questions = csd.filter(
      (c: RecordData) =>
        c.type === 'Dúvida' &&
        (filter === 'Todas' ||
          (filter === 'Resolvidas' ? c.status === 'Resolvida' : c.status !== 'Resolvida')),
    );
  return (
    <>
      <section className="canvas-card">
        {heading('Estado das decisões', 'decisions', '+ Registrar decisão')}
        <p className="oj-context">
          Uma certeza na CSD não é, por si só, uma decisão final. Registre responsável e
          justificativa para aprovar.
        </p>
        <div className="decision-overview">
          {[
            [
              decisions.filter((d: RecordData) => d.status === 'Decisão final').length,
              'Decisões finais',
            ],
            [
              decisions.filter((d: RecordData) => !['Decisão final', 'Revogada'].includes(d.status))
                .length,
              'Em discussão / validação',
            ],
            [
              csd.filter((d: RecordData) => d.type === 'Dúvida' && d.status !== 'Resolvida').length,
              'Dúvidas abertas',
            ],
          ].map(([count, label]) => (
            <div className="decision-stat" key={label}>
              <strong>{count}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="decision-list">
          {decisions.map((item: RecordData) => (
            <article
              className={'decision-item ' + (item.status === 'Decisão final' ? 'final' : '')}
              key={item.uid}
            >
              <div className="tags">
                <Status value={item.status} />
                <Phase value={item.horizon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <p>
                <b>Escolha e justificativa:</b> {item.rationale || 'A definir'}
              </p>
              <p>
                <b>Responsável:</b> {item.owner || 'A definir'}
              </p>
              {actions('decisions', item)}
            </article>
          ))}
        </div>
      </section>
      <section className="canvas-card">
        <h2>Matriz CSD</h2>
        <div className="csd-grid">
          {['Certeza', 'Suposição', 'Dúvida'].map((type) => (
            <section className="csd-column" key={type}>
              <div className="oj-section-heading">
                <h3>
                  {type === 'Certeza'
                    ? 'Certezas'
                    : type === 'Suposição'
                      ? 'Suposições'
                      : 'Dúvidas'}
                </h3>
                <span>{csd.filter((r: RecordData) => r.type === type).length}</span>
              </div>
              {csd
                .filter((r: RecordData) => r.type === type)
                .map((item: RecordData) => (
                  <article className="csd-item" key={item.uid}>
                    <h4>{item.title}</h4>
                    <p>{item.detail || 'A detalhar'}</p>
                    <div className="foot">
                      <span>{item.owner || item.source || 'A validar'}</span>
                      {actions('csd', item)}
                    </div>
                  </article>
                ))}
              <button className="btn tiny" onClick={() => add('csd', { type })}>
                + Adicionar {type.toLocaleLowerCase()}
              </button>
            </section>
          ))}
        </div>
      </section>
      <section className="canvas-card">
        <div className="oj-section-heading">
          <h2>Dúvidas e próximos passos</h2>
          <div className="oj-row-actions">
            <label className="oj-filter">
              Filtrar dúvidas
              <select
                aria-label="Filtrar dúvidas"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {['Abertas', 'Todas', 'Resolvidas'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button className="btn dark" onClick={() => add('csd', { type: 'Dúvida' })}>
              + Dúvida
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="list-table todo-table">
            <thead>
              <tr>
                {[
                  'OK',
                  'Pergunta / ação necessária',
                  'Origem',
                  'Responsável',
                  'Prazo',
                  'Prioridade',
                  'Ações',
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((item: RecordData) => (
                <tr key={item.uid} className={item.status === 'Resolvida' ? 'closed' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.status === 'Resolvida'}
                      aria-label={'Resolver dúvida ' + item.title}
                      onChange={(e) =>
                        update('csd', item.uid, 'status', e.target.checked ? 'Resolvida' : 'Aberta')
                      }
                    />
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <p>{item.action || item.detail || 'Definir próximo passo'}</p>
                  </td>
                  <td>{item.source || 'CSD'}</td>
                  <td>{item.owner || 'Sem responsável'}</td>
                  <td>{item.deadline || 'A definir'}</td>
                  <td>{item.priority || 'Média'}</td>
                  <td>
                    {actions('csd', item)}
                    <button
                      className="btn tiny"
                      onClick={() =>
                        add('actionPlan', {
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && <p className="oj-empty-panel">Nenhuma dúvida neste filtro.</p>}
        </div>
      </section>
      <details className="oj-context">
        <summary>Histórico de decisões</summary>
        {(board.decisionHistory || []).map((item: RecordData) => (
          <p key={item.uid}>
            {item.title} · {item.from} → {item.to} · {item.at}
          </p>
        ))}
      </details>
    </>
  );
}
