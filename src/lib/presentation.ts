import type { CSSProperties } from 'react';

export const VISUAL_DEFAULTS: Record<string, { color: string; icon: string }> = {
  actors: { color: '#257a75', icon: 'user' },
  channels: { color: '#7547a4', icon: 'smartphone' },
  systems: { color: '#286b9e', icon: 'server' },
  operations: { color: '#535b68', icon: 'building' },
  capabilities: { color: '#626c7c', icon: 'shield' },
};
export const SWATCHES = [
  '#bb4038',
  '#da7924',
  '#d4a42a',
  '#37845c',
  '#257a75',
  '#2f76b7',
  '#7547a4',
  '#535b68',
];
export const COUNTRIES = [
  ['', 'País a definir'],
  ['BR', 'Brasil'],
  ['US', 'EUA'],
  ['PT', 'Portugal'],
];
export function countryCode(value = '') {
  const code = value.trim().toLocaleLowerCase('pt-BR');
  return (
    (
      {
        br: 'BR',
        brasil: 'BR',
        brazil: 'BR',
        us: 'US',
        usa: 'US',
        eua: 'US',
        'estados unidos': 'US',
        'united states': 'US',
        pt: 'PT',
        portugal: 'PT',
      } as Record<string, string>
    )[code] || value
  );
}
export const countryName = (value = '') =>
  COUNTRIES.find(([code]) => code === countryCode(value))?.[1] || value || 'País a definir';
export const validPhoto = (photo: unknown): photo is string =>
  typeof photo === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo);
export function canonicalPhase(value = '') {
  return ['Legal Day One', 'Atual / Day-1', 'Atual + Day-1', 'Atual → Day-1'].includes(value)
    ? 'Day-1'
    : value;
}
export const PHASES: Record<string, { tone: string; light: string; ink: string; text: string }> = {
  'Day-1': { tone: '#c43c32', light: '#fbece9', ink: '#a12d25', text: '#ffffff' },
  'Release A': { tone: '#e5b52f', light: '#fff6d9', ink: '#755400', text: '#352900' },
  'Release B': { tone: '#428357', light: '#eaf4ed', ink: '#28623b', text: '#ffffff' },
  'Release C': { tone: '#2f76b7', light: '#eaf2fd', ink: '#225a93', text: '#ffffff' },
  'Release D': { tone: '#7b56b4', light: '#f2ebfa', ink: '#5c3d89', text: '#ffffff' },
};
export function phaseStyle(value = ''): CSSProperties {
  const p = PHASES[canonicalPhase(value)] || {
    tone: '#c9cbd0',
    light: '#f3f3f5',
    ink: '#5b6069',
    text: '#484d56',
  };
  return {
    '--phase-tone': p.tone,
    '--phase-bg': p.light,
    '--phase-ink': p.ink,
    '--phase-text': p.text,
    '--tone': p.tone,
    '--light': p.light,
    '--darktone': p.ink,
    '--marker-text': p.text,
  } as CSSProperties;
}
export const featurePhase = (feature: Record<string, any>, routing: Record<string, any> = {}) =>
  Object.hasOwn(routing, 'release') ? routing.release : feature.marco_produto;

export const RECORD_ICONS: Record<string, [string, string]> = {
  user: ['Pessoa', '<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>'],
  users: [
    'Pessoas',
    '<path d="M16 21v-2a5 5 0 0 0-10 0v2"/><circle cx="11" cy="8" r="3"/><path d="M19 21v-2a5 5 0 0 0-3-4.6M17 5a3 3 0 0 1 0 6"/>',
  ],
  briefcase: [
    'Comercial',
    '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18"/>',
  ],
  smartphone: [
    'Aplicativo',
    '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  ],
  monitor: ['Web', '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8M12 17v5"/>'],
  globe: [
    'Internacional',
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
  ],
  building: [
    'Backoffice',
    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-4h4v4"/>',
  ],
  landmark: ['Banco', '<path d="m2 9 10-6 10 6M3 9h18M5 9v10m5-10v10m4-10v10m5-10v10M2 21h20"/>'],
  server: [
    'Servidor',
    '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h7M11 17h7"/>',
  ],
  database: [
    'Dados',
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  ],
  network: [
    'Integração',
    '<circle cx="12" cy="4" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 6v6M5 17l7-5 7 5"/>',
  ],
  layers: ['Camadas', '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>'],
  shield: [
    'Controle',
    '<path d="M12 2 21 6v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
  ],
  'credit-card': [
    'Cartão',
    '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  ],
  'file-check': ['Documento', '<path d="M6 2h8l5 5v15H6zM14 2v5h5M9 15l2 2 4-4"/>'],
  headphones: [
    'Atendimento',
    '<path d="M3 15v-4a9 9 0 0 1 18 0v4M3 14h3v6H3zM18 14h3v6h-3zM18 20c0 2-3 3-6 3"/>',
  ],
  mail: ['Mensagem', '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m2 7 10 7 10-7"/>'],
  settings: [
    'Configuração',
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2M19.1 4.9l-2.2 2.2m-9.8 9.8-2.2 2.2"/>',
  ],
  wallet: [
    'Carteira',
    '<rect x="2" y="6" width="20" height="15" rx="2"/><path d="M2 8V5a2 2 0 0 1 2-2h14M15 13h7v5h-7z"/>',
  ],
  send: ['Transferência', '<path d="m2 12 20-9-7 19-3-8-10-2ZM12 14l10-11"/>'],
  check: ['Conferência', '<path d="m4 12 5 5L20 6"/>'],
  workflow: [
    'Orquestração',
    '<rect x="2" y="3" width="8" height="6" rx="1"/><rect x="14" y="15" width="8" height="6" rx="1"/><path d="M10 6h7a3 3 0 0 1 3 3v6M17 9l3 3 3-3"/>',
  ],
};
