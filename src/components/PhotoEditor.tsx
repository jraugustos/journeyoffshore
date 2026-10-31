'use client';
import { useEffect, useRef, useState } from 'react';
import type { RecordData } from '@/lib/domain';
import { Avatar } from './Visuals';
import { validPhoto } from '@/lib/presentation';

export default function PhotoEditor({
  person,
  onChange,
}: {
  person: RecordData;
  onChange: (photo: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter até 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 176;
        canvas.height = 176;
        const context = canvas.getContext('2d');
        if (!context) throw new Error();
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 176, 176);
        const side = Math.min(bitmap.width, bitmap.height);
        context.drawImage(
          bitmap,
          (bitmap.width - side) / 2,
          (bitmap.height - side) / 2,
          side,
          side,
          0,
          0,
          176,
          176,
        );
        if (active.current) onChange(canvas.toDataURL('image/jpeg', 0.78));
      } finally {
        bitmap.close();
      }
    } catch {
      if (active.current) setError('Não foi possível ler a imagem. Escolha outro arquivo.');
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <fieldset className="oj-photo-editor full">
      <legend>Foto da pessoa</legend>
      <div className="v15-photo-box">
        <Avatar person={person} size="lg" />
        <label className="oj-field">
          <span>{busy ? 'Preparando foto…' : 'Adicionar ou trocar foto'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        {validPhoto(person.photo) && (
          <button type="button" className="btn tiny" disabled={busy} onClick={() => onChange('')}>
            Remover foto
          </button>
        )}
      </div>
      <small>JPG, PNG ou WebP, até 5 MB. A foto é ajustada automaticamente para o cadastro.</small>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
