import { RELEASES, type RecordData, type WorkspaceData } from './domain';
import { canonicalPhase } from './presentation';

export const STUDY_PHASES = ['', ...RELEASES];
export const studyPhase = (step: RecordData) => {
  const phase = canonicalPhase(step.release);
  return RELEASES.includes(phase) ? phase : '';
};

// Each use case is one row. Its markers come exclusively from its blueprint steps.
export type StudyPhase = { phase: string; steps: RecordData[] };
export type StudyRow = { item: RecordData; phases: StudyPhase[] };
export function deepTimeline(
  state: WorkspaceData,
  matrix: RecordData,
): {
  macro: RecordData;
  contexts: { board: RecordData; rows: StudyRow[] }[];
}[] {
  const features = new Map<string, RecordData>(
    matrix.items.map((item: RecordData) => [item.id, item]),
  );
  return state.macros.map((macro) => ({
    macro,
    contexts: state.boards
      .filter((board) => board.macroId === macro.id)
      .map((board) => ({
        board,
        rows: board.cases.map((item: RecordData) => ({
          item,
          phases: STUDY_PHASES.map((phase) => ({
            phase,
            steps: item.steps
              .filter((step: RecordData) => studyPhase(step) === phase)
              .map((step: RecordData) => ({
                ...step,
                features: [...new Set<string>(step.featureIds || [])].map(
                  (id) =>
                    features.get(id) || {
                      id,
                      funcionalidade: 'Vínculo a revisar',
                      missing: true,
                    },
                ),
              })),
          })).filter((phase) => phase.steps.length || (!item.steps.length && !phase.phase)),
        })),
      })),
  }));
}
