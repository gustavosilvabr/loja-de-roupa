import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';

/* ============================================================
   Liga a vitrine às configurações do painel: cores, fontes,
   SEO, favicon, pixels e o botão flutuante do WhatsApp.
   ============================================================ */

/** "#8b2fe0" -> "139 47 224" (formato exigido pelo Tailwind com <alpha-value>) */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return '139 47 224';
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Clareia uma cor em direção ao branco — usado nos tons 50/100 da marca. */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex).split(' ').map(Number);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)} ${mix(g)} ${mix(b)}`;
}

const GOOGLE_FONTS = new Set([
  'Inter Tight',
  'Archivo',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Oswald',
  'Bebas Neue',
]);

export function ThemeVars() {
  const { theme } = useSettings();

  useEffect(() => {
    const root = document.documentElement.style;

    root.setProperty('--brand-rgb', hexToRgb(theme.primary));
    root.setProperty('--brand-dark-rgb', hexToRgb(theme.primaryDark));
    root.setProperty('--brand-50-rgb', lighten(theme.primary, 0.94));
    root.setProperty('--brand-100-rgb', lighten(theme.primary, 0.86));
    root.setProperty('--ink-rgb', hexToRgb(theme.ink));
    root.setProperty('--muted-rgb', hexToRgb(theme.muted));
    root.setProperty('--header-bg-rgb', hexToRgb(theme.headerBg));
    root.setProperty('--header-text-rgb', hexToRgb(theme.headerText));
    root.setProperty('--footer-bg-rgb', hexToRgb(theme.footerBg));

    root.setProperty('--font-body', `"${theme.fontBody}"`);
    root.setProperty('--font-heading', `"${theme.fontHeading}"`);
    root.setProperty('--radius-btn', `${theme.radiusButton}px`);
    root.setProperty('--radius-media', `${theme.radiusMedia}px`);
    root.setProperty('--container-width', `${theme.containerWidth}px`);
    root.setProperty('--card-title-size', `${theme.cardTitleSize}px`);
    root.setProperty('--card-price-size', `${theme.cardPriceSize}px`);
    root.setProperty('--btn-transform', theme.buttonUppercase ? 'uppercase' : 'none');
  }, [theme]);

  // Carrega a fonte escolhida sob demanda, sem bloquear o primeiro render
  useEffect(() => {
    const families = [...new Set([theme.fontBody, theme.fontHeading])].filter((f) =>
      GOOGLE_FONTS.has(f)
    );
    if (families.length === 0) return;

    const id = 'fonte-loja';
    const href = `https://fonts.googleapis.com/css2?${families
      .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
      .join('&')}&display=swap`;

    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [theme.fontBody, theme.fontHeading]);

  return null;
}

export function SeoHead() {
  const { seo, brand } = useSettings();
  const { pathname } = useLocation();

  useEffect(() => {
    // Nas páginas internas o título é definido pela própria página
    if (pathname === '/') document.title = seo.title;

    const meta = (selector: string, attr: string, key: string, value: string) => {
      if (!value) return;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    meta('meta[name="description"]', 'name', 'description', seo.description);
    meta('meta[name="keywords"]', 'name', 'keywords', seo.keywords);
    meta('meta[name="robots"]', 'name', 'robots', seo.robots);
    meta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    meta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    meta('meta[property="og:image"]', 'property', 'og:image', seo.ogImage);
    meta('meta[property="og:site_name"]', 'property', 'og:site_name', brand.name);
    meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    meta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    meta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);

    if (seo.gscVerification) {
      meta(
        'meta[name="google-site-verification"]',
        'name',
        'google-site-verification',
        seo.gscVerification
      );
    }

    if (brand.faviconEmoji) {
      let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${encodeURIComponent(
        brand.faviconEmoji
      )}</text></svg>`;
    }
  }, [seo, brand.name, brand.faviconEmoji, pathname]);

  return null;
}

/**
 * Carrega os pixels configurados. Se `requireConsent` estiver ligado, só
 * dispara depois que o visitante aceitar — é o que a LGPD espera.
 */
export function Pixels() {
  const { integrations } = useSettings();

  useEffect(() => {
    const loaded = new Set<string>();

    const inject = (id: string, src: string) => {
      if (loaded.has(id) || document.getElementById(id)) return;
      loaded.add(id);
      const s = document.createElement('script');
      s.id = id;
      s.async = true;
      s.src = src;
      document.head.appendChild(s);
    };

    const start = () => {
      const { facebookPixel, ga4, gtm, tiktokPixel, hotjar } = integrations;

      if (ga4) {
        inject('ga4', `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
        const w = window as unknown as { dataLayer?: unknown[] };
        w.dataLayer = w.dataLayer || [];
        // eslint-disable-next-line prefer-rest-params
        function gtag(...args: unknown[]) {
          w.dataLayer!.push(args);
        }
        gtag('js', new Date());
        gtag('config', ga4);
      }

      if (gtm) inject('gtm', `https://www.googletagmanager.com/gtm.js?id=${gtm}`);
      if (hotjar) inject('hotjar', `https://static.hotjar.com/c/hotjar-${hotjar}.js?sv=6`);
      if (facebookPixel) inject('fbq', 'https://connect.facebook.net/en_US/fbevents.js');
      if (tiktokPixel) inject('ttq', 'https://analytics.tiktok.com/i18n/pixel/events.js');
    };

    const hasAny =
      integrations.facebookPixel ||
      integrations.ga4 ||
      integrations.gtm ||
      integrations.tiktokPixel ||
      integrations.hotjar;

    if (!hasAny) return;

    if (!integrations.requireConsent) {
      start();
      return;
    }

    let granted = false;
    try {
      granted = localStorage.getItem('xingsun:consent') === 'granted';
    } catch {
      /* storage bloqueado */
    }
    if (granted) {
      start();
      return;
    }

    const onConsent = (e: Event) => {
      if ((e as CustomEvent<string>).detail === 'granted') start();
    };
    window.addEventListener('consent', onConsent);
    return () => window.removeEventListener('consent', onConsent);
  }, [integrations]);

  return null;
}

export function WhatsAppButton() {
  const { whatsapp } = useSettings().brand;

  if (!whatsapp.enabled || !whatsapp.number) return null;

  const href = `https://wa.me/${whatsapp.number.replace(/\D/g, '')}?text=${encodeURIComponent(
    whatsapp.message
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={whatsapp.greeting || 'Falar no WhatsApp'}
      className={`group fixed bottom-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-3 text-white shadow-lg transition-all hover:pr-5 hover:shadow-xl ${
        whatsapp.position === 'left' ? 'left-5' : 'right-5'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2m0 18.2c-1.6 0-3.2-.4-4.6-1.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-semibold transition-all duration-300 group-hover:max-w-[200px]">
        {whatsapp.greeting}
      </span>
    </a>
  );
}
