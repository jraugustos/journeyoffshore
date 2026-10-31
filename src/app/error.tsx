'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="setup-page">
      <h1>Não foi possível abrir o projeto.</h1>
      <p>
        Verifique se o banco e o serviço estão disponíveis. Os dados salvos permanecem no banco.
      </p>
      <button className="btn dark" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
