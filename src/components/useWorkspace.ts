'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clone, validateWorkspace, type WorkspaceData, type RecordData } from '@/lib/domain';
import { diffState, applyChanges } from '@/lib/changes';

export type SaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'error' | 'conflict';
export function useWorkspace() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [refs, setRefs] = useState<{ matrix: RecordData; launch: RecordData } | null>(null);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const state = useRef<WorkspaceData | null>(null),
    baseline = useRef<WorkspaceData | null>(null),
    revision = useRef(0);
  const saving = useRef<Promise<boolean> | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    paused = useRef(false);
  const publish = useCallback((next: WorkspaceData) => {
    state.current = next;
    setData(next);
  }, []);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/workspace', { cache: 'no-store' });
      if (response.status === 401) {
        setLocked(true);
        return;
      }
      if (!response.ok) throw new Error('Não foi possível abrir o projeto. Tente novamente.');
      const result = await response.json();
      baseline.current = clone(result.data);
      revision.current = result.revision;
      publish(result.data);
      setRefs({ matrix: result.matrix, launch: result.launch });
      paused.current = false;
      setStatus('saved');
      setError('');
    } catch (cause: any) {
      setError(cause.message);
      setStatus('error');
    }
  }, [publish]);
  const flush = useCallback(
    async function persist(): Promise<boolean> {
      if (timer.current) clearTimeout(timer.current);
      if (paused.current || !state.current || !baseline.current) return false;
      if (saving.current) {
        const success = await saving.current;
        return success ? persist() : false;
      }
      const snapshot = clone(state.current),
        changes = diffState(baseline.current, snapshot);
      if (!changes.length) {
        setStatus('saved');
        return true;
      }
      try {
        validateWorkspace(snapshot);
      } catch (cause: any) {
        setStatus('pending');
        setError(cause.message);
        return false;
      }
      setStatus('saving');
      setError('');
      const promise = (async () => {
        try {
          const response = await fetch('/api/workspace', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes }),
          });
          const result = await response
            .json()
            .catch(() => ({ error: 'O serviço não respondeu corretamente. Tente novamente.' }));
          if (response.status === 401) {
            setLocked(true);
            throw new Error('Sua sessão terminou. Informe a senha para continuar.');
          }
          if (response.status === 409) {
            paused.current = true;
            setStatus('conflict');
            setError(result.error);
            return false;
          }
          if (!response.ok) throw new Error(result.error || 'Não foi possível salvar.');
          const pending = diffState(snapshot, state.current!);
          let merged: WorkspaceData;
          try {
            merged = pending.length ? applyChanges(result.data, pending) : result.data;
          } catch {
            paused.current = true;
            setStatus('conflict');
            setError('Outra sessão alterou um campo que você está editando.');
            return false;
          }
          baseline.current = clone(result.data);
          revision.current = result.revision;
          publish(merged);
          setStatus(pending.length ? 'pending' : 'saved');
          if (pending.length) timer.current = setTimeout(() => void persist(), 100);
          return true;
        } catch (cause: any) {
          setStatus('error');
          setError(
            cause instanceof TypeError
              ? 'Sem conexão. Suas alterações continuam nesta tela e serão reenviadas.'
              : cause.message || 'Não foi possível salvar. Suas alterações continuam nesta tela.',
          );
          if (!paused.current) timer.current = setTimeout(() => void persist(), 5000);
          return false;
        } finally {
          saving.current = null;
        }
      })();
      saving.current = promise;
      return promise;
    },
    [publish],
  );
  const change = useCallback(
    (recipe: (draft: WorkspaceData) => void, immediate = false) => {
      if (!state.current) return;
      const next = clone(state.current);
      recipe(next);
      next.updatedAt = new Date().toISOString();
      publish(next);
      if (paused.current) return;
      setStatus('pending');
      setError('');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), immediate ? 0 : 700);
    },
    [flush, publish],
  );
  const importData = useCallback(
    async (input: unknown) => {
      if (!(await flush())) throw new Error('Resolva as alterações pendentes antes de importar.');
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: input, revision: revision.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      baseline.current = clone(result.data);
      revision.current = result.revision;
      publish(result.data);
      setStatus('saved');
      setError('');
    },
    [flush, publish],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (state.current && baseline.current && diffState(baseline.current, state.current).length) {
        event.preventDefault();
      }
    };
    const refresh = () => {
      if (
        state.current &&
        baseline.current &&
        !diffState(baseline.current, state.current).length &&
        !saving.current &&
        !paused.current
      )
        void load();
      else if (!paused.current) void flush();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('online', refresh);
      window.removeEventListener('focus', refresh);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load, flush]);
  return {
    data,
    references: refs,
    status,
    error,
    locked,
    unlock: () => {
      setLocked(false);
      void flush();
    },
    change,
    flush,
    load,
    importData,
  };
}
