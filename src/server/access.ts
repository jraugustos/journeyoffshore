import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import { database } from './db';
import { configuration, configured } from './config';

export const COOKIE = 'offshore_access';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const configVersion = () => hash(configuration().secret + configuration().passwordHash);
export async function hasAccess() {
  if (!configured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{96}$/.test(token)) return false;
  const session = await database().accessSession.findUnique({ where: { tokenHash: hash(token) } });
  return !!session && session.expiresAt > new Date() && session.configVersion === configVersion();
}
export function sameOrigin(request: Request) {
  const expected = new URL(configuration().appUrl).origin;
  return request.headers.get('origin') === expected;
}
export const privateJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function guard(request?: Request) {
  if (!(await hasAccess())) return privateJson({ error: 'Informe a senha para continuar.' }, 401);
  if (request && !sameOrigin(request))
    return privateJson({ error: 'Origem da solicitação não permitida.' }, 403);
  return null;
}
export async function login(password: string) {
  if (!configured())
    return privateJson({ error: 'Execute a configuração inicial antes de acessar.' }, 503);
  const db = database(),
    now = new Date(),
    key = 'project-password';
  const attempt = await db.loginAttempt.findUnique({ where: { key } });
  if (attempt?.blockedUntil && attempt.blockedUntil > now)
    return privateJson(
      { error: 'Muitas tentativas. Aguarde dois minutos e tente novamente.' },
      429,
    );
  const valid =
    password.length <= 1024 && (await argon2.verify(configuration().passwordHash, password));
  if (!valid) {
    const recent = attempt && now.getTime() - attempt.windowStart.getTime() < 600_000;
    const record = await db.loginAttempt.upsert({
      where: { key },
      create: { key, failures: 1, windowStart: now },
      update: recent
        ? { failures: { increment: 1 } }
        : { failures: 1, windowStart: now, blockedUntil: null },
    });
    if (record.failures >= 10)
      await db.loginAttempt.update({
        where: { key },
        data: { blockedUntil: new Date(Date.now() + 120_000) },
      });
    return privateJson({ error: 'Senha incorreta. Tente novamente.' }, 401);
  }
  await db.loginAttempt.deleteMany({ where: { key } });
  await db.accessSession.deleteMany({ where: { expiresAt: { lt: now } } });
  const token = randomBytes(48).toString('hex'),
    seconds = configuration().sessionHours * 3600;
  await db.accessSession.create({
    data: {
      tokenHash: hash(token),
      configVersion: configVersion(),
      expiresAt: new Date(Date.now() + seconds * 1000),
    },
  });
  const response = privateJson({ ok: true });
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: new URL(configuration().appUrl).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: seconds,
  });
  return response;
}
export async function logout() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await database().accessSession.deleteMany({ where: { tokenHash: hash(token) } });
  const response = privateJson({ ok: true });
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: new URL(configuration().appUrl).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
