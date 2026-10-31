'use client';
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RecordData } from '@/lib/domain';
import { Country, PersonLabel, RecordTag } from './Visuals';
import FieldPopover, { fieldAnchor, type FieldAnchor } from './FieldPopover';
export default function RecordPicker({
  label,
  records,
  selected,
  onChange,
  kind,
  onCreate,
  inline = false,
}: {
  label: string;
  records: RecordData[];
  selected: string[];
  onChange: (ids: string[]) => void;
  kind?: string;
  onCreate?: (name: string) => void;
  inline?: boolean;
}) {
  const panelId = useId();
  const [query, setQuery] = useState(''),
    [anchor, setAnchor] = useState<FieldAnchor | null>(null);
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
  const picked = selected
    .map((id) => records.find((r) => r.id === id))
    .filter(Boolean) as RecordData[];
  const choices = (
    <div className="oj-record-options">
      <input
        type="search"
        aria-label={'Buscar em ' + label}
        placeholder="Buscar ou cadastrar…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.currentTarget.parentElement
              ?.querySelector<HTMLInputElement>('input[type=checkbox]')
              ?.focus();
          }
        }}
      />
      <div className="oj-record-list">
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
      {!visible.length && <p className="oj-picker-empty">Nenhum registro encontrado.</p>}
      {onCreate &&
        query.trim() &&
        !records.some(
          (r) => r.name.trim().toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
        ) && (
          <button
            type="button"
            className="oj-picker-create"
            onClick={() => {
              onCreate(query.trim());
              setQuery('');
            }}
          >
            Cadastrar “{query.trim()}” e selecionar
          </button>
        )}
    </div>
  );
  if (inline) return choices;
  return (
    <div className="oj-record-picker" role="group" aria-label={label}>
      <span className="oj-picker-label">{label}</span>
      <button
        type="button"
        className="oj-picker-trigger"
        role="combobox"
        aria-label={label}
        aria-controls={anchor ? panelId : undefined}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        onClick={(e) => {
          setQuery('');
          setAnchor(fieldAnchor(e.currentTarget));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setQuery('');
            setAnchor(fieldAnchor(e.currentTarget));
          }
        }}
      >
        <span className="oj-picker-value">
          {picked.length ? (
            <>
              {picked.slice(0, 2).map((item) => (
                <span key={item.id}>{visual(item)}</span>
              ))}
              {picked.length > 2 && <span>+{picked.length - 2}</span>}
            </>
          ) : (
            <span className="oj-picker-placeholder">Selecionar…</span>
          )}
        </span>
        <ChevronDown size={15} />
      </button>
      {anchor && (
        <FieldPopover id={panelId} label={label} anchor={anchor} onClose={() => setAnchor(null)}>
          {choices}
        </FieldPopover>
      )}
    </div>
  );
}
