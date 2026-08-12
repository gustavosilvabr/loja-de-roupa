import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../admin/store/AdminProvider';
import { estaNoEditor } from '../editor/protocolo';
import { uid } from '../admin/store/persist';
import type { VisitorSession } from '../admin/types';

const SESSION_KEY = 'xingsun:session';
const SESSION_TTL = 30 * 60 * 1000; // 30 min de inatividade encerra a sessão

interface StoredSession {
  id: string;
  startedAt: number;
  lastSeenAt: number;
  referrer: string;
  device: VisitorSession['device'];
  pageViews: number;
  addedToCart: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
}

function detectDevice(): VisitorSession['device'] {
  const w = window.innerWidth;
  if (w < 750) return 'mobile';
  if (w < 1100) return 'tablet';
  return 'desktop';
}

function readSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (Date.now() - s.lastSeenAt > SESSION_TTL) return null;
    return s;
  } catch {
    return null;
  }
}

function writeSession(s: StoredSession) {
  try {
    const raw = JSON.stringify(s);
    sessionStorage.setItem(SESSION_KEY, raw);
    localStorage.setItem(SESSION_KEY, raw);
  } catch {
    /* storage bloqueado */
  }
}

export function getSessionId(): string {
  return readSession()?.id ?? '';
}

/** Marca um marco na sessão atual (carrinho, checkout, compra). */
export function markSession(flag: 'addedToCart' | 'reachedCheckout' | 'purchased') {
  const s = readSession();
  if (!s) return;
  writeSession({ ...s, [flag]: true, lastSeenAt: Date.now() });
}

/**
 * Registra visitas, sessões e saída. Fica montado dentro do layout da loja.
 * Não roda no /admin — senão o dono da loja polui as próprias métricas.
 */
export function Tracker() {
  const { pathname, search } = useLocation();
  const { track, upsertSession } = useAdmin();
  const started = useRef(false);

  useEffect(() => {
    // O preview do editor não é visita de cliente.
    if (pathname.startsWith('/admin') || estaNoEditor()) return;

    const now = Date.now();
    const existing = readSession();

    const session: StoredSession = existing ?? {
      id: uid('s'),
      startedAt: now,
      lastSeenAt: now,
      referrer: document.referrer || 'direto',
      device: detectDevice(),
      pageViews: 0,
      addedToCart: false,
      reachedCheckout: false,
      purchased: false,
    };

    session.lastSeenAt = now;
    session.pageViews += 1;
    writeSession(session);

    if (!existing && !started.current) {
      started.current = true;
      track({ type: 'session_start', sessionId: session.id, path: pathname });
    }

    track({ type: 'page_view', sessionId: session.id, path: pathname + search });

    upsertSession({
      id: session.id,
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      referrer: session.referrer,
      device: session.device,
      pageViews: session.pageViews,
      addedToCart: session.addedToCart,
      reachedCheckout: session.reachedCheckout,
      purchased: session.purchased,
      exitPath: pathname,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return null;
}
