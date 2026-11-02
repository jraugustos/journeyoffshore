'use client';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';

export default function AccessForm({ onSuccess }: { onSuccess?: () => void }) {
  const [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPassword('');
      if (onSuccess) onSuccess();
      else window.location.assign('/');
    } catch (cause: any) {
      setError(cause.message || 'Não foi possível acessar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="access-page">
      <section className="access-panel">
        <LockKeyhole size={28} strokeWidth={1.5} />
        <h1>Acessar Workspace</h1>
        <form onSubmit={submit}>
          <label htmlFor="project-password">Senha</label>
          <div className="access-password">
            <input
              id="project-password"
              name="password"
              autoComplete="current-password"
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              maxLength={1024}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {visible ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}
          <button className="access-submit" type="submit" disabled={busy}>
            {busy ? 'Verificando…' : 'Login'}
            <ArrowRight size={19} />
          </button>
        </form>
      </section>
    </main>
  );
}
