'use client';
import { useState } from 'react';
import type { RecordData } from '@/lib/domain';
import { Country, PersonLabel, RecordTag } from './Visuals';
export default function RecordPicker({
  label,
  records,
  selected,
  onChange,
  kind,
  onCreate,
}: {
  label: string;
  records: RecordData[];
  selected: string[];
  onChange: (ids: string[]) => void;
  kind?: string;
  onCreate?: (name: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [open, setOpen] = useState(false);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const visual = (item: RecordData) =>
    kind === 'people' ? (
      <PersonLabel person={item} />
    ) : kind ? (
      <RecordTag kind={kind} record={item} />
    ) : (
      item.name
    );
  const visible = records.filter(
    (r) =>
      (r.status !== 'Inativo' || selected.includes(r.id)) &&
      r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <fieldset className="oj-picker">
      <legend>{label}</legend>
      <div className="oj-selected-records">
        {selected.map((id) => {
          const item = records.find((r) => r.id === id);
          return item ? (
            <button
              type="button"
              className="oj-selected-chip"
              key={id}
              aria-label={'Remover ' + item.name}
              onClick={() => toggle(id)}
            >
              {visual(item)}
              <span aria-hidden="true">×</span>
            </button>
          ) : null;
        })}
        {!selected.length && <span className="oj-context">Nenhum selecionado</span>}
      </div>
      <button
        type="button"
        className="btn tiny"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Fechar seleção' : 'Adicionar / alterar seleção'}
      </button>
      {open && (
        <>
          <input
            type="search"
            aria-label={'Buscar em ' + label}
            placeholder="Buscar ou digitar um novo nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="oj-check-list">
            {visible.map((item) => (
              <label key={item.id} className={selected.includes(item.id) ? 'is-active' : ''}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
                {visual(item)}
                {kind === 'operations' && <Country value={item.country} />}
              </label>
            ))}
          </div>
          {!visible.length && <p>Nenhum registro encontrado.</p>}
          {onCreate &&
            query.trim() &&
            !records.some(
              (r) => r.name.trim().toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
            ) && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onCreate(query.trim());
                  setQuery('');
                }}
              >
                Cadastrar “{query.trim()}” e selecionar
              </button>
            )}
        </>
      )}
    </fieldset>
  );
}
