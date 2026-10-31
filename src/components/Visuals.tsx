import type { CSSProperties } from 'react';
import type { RecordData } from '@/lib/domain';
import {
  canonicalPhase,
  countryCode,
  countryName,
  phaseStyle,
  RECORD_ICONS,
  validPhoto,
  VISUAL_DEFAULTS,
} from '@/lib/presentation';

export function Phase({ value }: { value?: string }) {
  const label = canonicalPhase(value);
  return (
    <span className="v10-phase oj-phase" style={phaseStyle(label)}>
      <i aria-hidden="true" />
      {!label || label === 'Sem fase definida' ? 'Marco a definir' : label}
    </span>
  );
}
export function PhaseLegend() {
  return (
    <div className="oj-phase-legend" aria-label="Legenda dos horizontes">
      {['Day-1', 'Release A', 'Release B', 'Release C', 'Release D'].map((value) => (
        <Phase key={value} value={value} />
      ))}
    </div>
  );
}
export function Avatar({ person, size = 'md' }: { person: RecordData; size?: string }) {
  const initials =
    String(person.name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toLocaleUpperCase('pt-BR') || '?';
  return (
    <span className={'v15-avatar ' + size}>
      {validPhoto(person.photo) ? (
        <img src={person.photo} alt={'Foto de ' + person.name} loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}
export function PersonLabel({ person }: { person: RecordData }) {
  return (
    <span className="v15-owner">
      <Avatar person={person} size="xs" />
      <span className="v15-owner-name">{person.name}</span>
    </span>
  );
}
export function People({ people, ids = [] }: { people: RecordData[]; ids?: string[] }) {
  const selected = ids.map((id) => people.find((p) => p.id === id)).filter(Boolean) as RecordData[];
  return selected.length ? (
    <span className="v15-owner-group">
      {selected.map((person) => (
        <PersonLabel key={person.id} person={person} />
      ))}
    </span>
  ) : (
    <span>A definir</span>
  );
}
export function Flag({ country = '' }: { country?: string }) {
  const code = countryCode(country);
  if (!['BR', 'US', 'PT'].includes(code))
    return (
      <span className="v11-country-unset" aria-hidden="true">
        ?
      </span>
    );
  return (
    <svg
      className="v11-flag"
      viewBox="0 0 24 16"
      width="24"
      height="16"
      role="img"
      aria-label={countryName(country)}
    >
      {code === 'BR' && (
        <>
          <rect width="24" height="16" rx="2" fill="#169447" />
          <path d="M12 2 22 8 12 14 2 8Z" fill="#ffdf35" />
          <circle cx="12" cy="8" r="3.6" fill="#245397" />
          <path d="M8.6 7.2q3.7-1 6.9 1.8" fill="none" stroke="#fff" strokeWidth=".8" />
        </>
      )}
      {code === 'US' && (
        <>
          <rect width="24" height="16" rx="2" fill="#fff" />
          <path
            d="M0 1.1H24M0 3.6H24M0 6.1H24M0 8.6H24M0 11.1H24M0 13.6H24M0 15.7H24"
            stroke="#c43b46"
            strokeWidth="1.25"
          />
          <path d="M2 0H10V8.7H0V2Q0 0 2 0" fill="#294677" />
          <path
            d="M2 2h.4m2 0h.4m2 0h.4M3 3.8h.4m2 0h.4m2 0h.4M2 5.6h.4m2 0h.4m2 0h.4M3 7.3h.4m2 0h.4m2 0h.4"
            stroke="#fff"
            strokeWidth="1"
          />
        </>
      )}
      {code === 'PT' && (
        <>
          <rect width="24" height="16" rx="2" fill="#d5393c" />
          <path d="M2 0h7.6v16H2Q0 16 0 14V2Q0 0 2 0" fill="#187144" />
          <circle cx="9.6" cy="8" r="3.4" fill="#e9c948" />
          <path d="M7.9 5.8h3.4v3q-1.7 2.3-3.4 0Z" fill="#fff" stroke="#bb3435" strokeWidth=".8" />
          <path d="M8.8 7.2h1.5v1.6H8.8z" fill="#33598d" />
        </>
      )}
    </svg>
  );
}
export function Country({ value = '' }: { value?: string }) {
  return (
    <span className="v11-country">
      <Flag country={value} />
      {countryName(value)}
    </span>
  );
}
export function RecordIcon({ icon }: { icon?: string }) {
  // SVG paths come exclusively from the original, static icon whitelist.
  return (
    <svg
      className="v11-type-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: (RECORD_ICONS[icon || ''] || RECORD_ICONS.layers)[1] }}
    />
  );
}
export function RecordTag({ record, kind }: { record: RecordData; kind: string }) {
  const fallback = VISUAL_DEFAULTS[kind] || VISUAL_DEFAULTS.capabilities;
  return (
    <span
      className="v11-tag"
      style={
        {
          '--v12-color': /^#[a-f0-9]{6}$/i.test(record.color) ? record.color : fallback.color,
        } as CSSProperties
      }
      title={record.description || record.name}
    >
      <RecordIcon icon={record.icon || fallback.icon} />
      <span>{record.name || 'Vínculo a revisar'}</span>
      {record.status === 'Inativo' && <small>Inativo</small>}
    </span>
  );
}

export function OperationCard({ record, role = '' }: { record: RecordData; role?: string }) {
  const fallback = VISUAL_DEFAULTS.operations;
  return (
    <span
      className="v11-operation-card oj-operation-card"
      style={
        {
          '--v12-color': /^#[a-f0-9]{6}$/i.test(record.color) ? record.color : fallback.color,
        } as CSSProperties
      }
    >
      <span className="v12-area-heading">
        <RecordIcon icon={record.icon || fallback.icon} />
        <strong className="v11-area-name">{record.name || 'Vínculo a revisar'}</strong>
      </span>
      <span className="oj-operation-country">
        <Country value={record.country} />
        {['Inativo', 'Desativado'].includes(record.status) && <span>· Inativa</span>}
      </span>
      {role.trim() ? (
        <span className="oj-operation-role">{role}</span>
      ) : (
        <span className="v11-role-empty">Papel a definir nesta etapa</span>
      )}
    </span>
  );
}
