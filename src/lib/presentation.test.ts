import { describe, expect, it } from 'vitest';
import {
  canonicalPhase,
  countryCode,
  countryName,
  featurePhase,
  PHASES,
  validPhoto,
} from './presentation';
import { normalizeImported, type WorkspaceData } from './domain';
import { htmlExport } from './exports';
import seed from '../data/seed.json';
import matrix from '../data/matrix.json';

describe('Fidelidade dos cadastros e horizontes', () => {
  it('mantém o mesmo horizonte para os nomes legados do Day-1 e distingue uma revisão vazia da fonte', () => {
    for (const value of ['Legal Day One', 'Atual / Day-1', 'Atual + Day-1', 'Atual → Day-1'])
      expect(canonicalPhase(value)).toBe('Day-1');
    expect(featurePhase({ marco_produto: 'Release A' }, {})).toBe('Release A');
    expect(featurePhase({ marco_produto: 'Release A' }, { release: '' })).toBe('');
    expect(new Set(Object.values(PHASES).map((p) => p.tone)).size).toBe(5);
  });
  it('reconhece países antigos sem apagar países personalizados', () => {
    expect(countryCode('Brasil')).toBe('BR');
    expect(countryName('US')).toBe('EUA');
    expect(countryCode('Canadá')).toBe('Canadá');
  });
  it('preserva fotos, ícones, cores e país em importação e exportação', () => {
    const state = normalizeImported(seed, seed as WorkspaceData);
    state.people.push({
      id: 'photo-person',
      name: 'Pessoa com foto',
      photo: 'data:image/jpeg;base64,/9j/2Q==',
      status: 'Ativo',
    });
    state.systems.push({
      id: 'icon-system',
      name: 'Sistema visual',
      icon: 'database',
      color: '#7547a4',
      status: 'Ativo',
    });
    state.operations.push({
      id: 'country-operation',
      name: 'Operação BR',
      country: 'BR',
      status: 'Ativo',
    });
    const roundTrip = normalizeImported(JSON.parse(JSON.stringify(state)), state);
    expect(roundTrip.people.at(-1)?.photo).toBe(state.people.at(-1)?.photo);
    expect(roundTrip.systems.at(-1)).toMatchObject({ icon: 'database', color: '#7547a4' });
    expect(roundTrip.operations.at(-1)?.country).toBe('BR');
    expect(htmlExport(roundTrip, matrix)).toContain('photo-person');
  });
  it('renderiza apenas fotos locais nos formatos suportados', () => {
    expect(validPhoto('data:image/png;base64,aGVsbG8=')).toBe(true);
    for (const value of [
      'https://example.com/foto.png',
      'data:image/svg+xml;base64,aGVsbG8=',
      'javascript:alert(1)',
      null,
    ])
      expect(validPhoto(value)).toBe(false);
  });
});
