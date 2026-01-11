const systemSans =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', Arial, sans-serif";
const serifStack = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";
const monoAccentSans =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter, 'Noto Sans KR', Arial, sans-serif";

export type ThemeTokens = {
  [key: string]: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  tokens: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'minimal-clean',
    name: 'Minimal / Clean',
    tokens: {
      light: {
        '--bg': '#ffffff',
        '--fg': '#111827',
        '--muted': '#6b7280',
        '--primary': '#111827',
        '--link': '#2563eb',
        '--border': '#e5e7eb',
        '--radius': '12px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#0b1220',
        '--fg': '#e5e7eb',
        '--muted': '#94a3b8',
        '--primary': '#e5e7eb',
        '--link': '#60a5fa',
        '--border': '#243044',
        '--radius': '12px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'newspaper-editorial',
    name: 'Newspaper / Editorial',
    tokens: {
      light: {
        '--bg': '#fbfbf8',
        '--fg': '#1f2937',
        '--muted': '#6b7280',
        '--primary': '#7c2d12',
        '--link': '#7c2d12',
        '--border': '#e7e5e4',
        '--radius': '10px',
        '--font-sans': serifStack,
      },
      dark: {
        '--bg': '#121212',
        '--fg': '#f5f5f4',
        '--muted': '#a8a29e',
        '--primary': '#f59e0b',
        '--link': '#f59e0b',
        '--border': '#292524',
        '--radius': '10px',
        '--font-sans': serifStack,
      },
    },
  },
  {
    id: 'magazine-cards',
    name: 'Magazine / Card-heavy',
    tokens: {
      light: {
        '--bg': '#f8fafc',
        '--fg': '#0f172a',
        '--muted': '#475569',
        '--primary': '#7c3aed',
        '--link': '#7c3aed',
        '--border': '#e2e8f0',
        '--radius': '16px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#0b1020',
        '--fg': '#e2e8f0',
        '--muted': '#94a3b8',
        '--primary': '#a78bfa',
        '--link': '#a78bfa',
        '--border': '#1f2a44',
        '--radius': '16px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'tech-mono',
    name: 'Tech / Mono accents',
    tokens: {
      light: {
        '--bg': '#0b1020',
        '--fg': '#e2e8f0',
        '--muted': '#94a3b8',
        '--primary': '#22c55e',
        '--link': '#22c55e',
        '--border': '#243044',
        '--radius': '12px',
        '--font-sans': monoAccentSans,
      },
      dark: {
        '--bg': '#050814',
        '--fg': '#e2e8f0',
        '--muted': '#94a3b8',
        '--primary': '#22c55e',
        '--link': '#22c55e',
        '--border': '#1b2436',
        '--radius': '12px',
        '--font-sans': monoAccentSans,
      },
    },
  },
  {
    id: 'pastel-soft',
    name: 'Pastel / Soft',
    tokens: {
      light: {
        '--bg': '#fff7ed',
        '--fg': '#1f2937',
        '--muted': '#6b7280',
        '--primary': '#fb7185',
        '--link': '#fb7185',
        '--border': '#fed7aa',
        '--radius': '16px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#1b1220',
        '--fg': '#fce7f3',
        '--muted': '#fbcfe8',
        '--primary': '#fb7185',
        '--link': '#fb7185',
        '--border': '#3b1f2f',
        '--radius': '16px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'high-contrast',
    name: 'High-contrast / Bold',
    tokens: {
      light: {
        '--bg': '#ffffff',
        '--fg': '#000000',
        '--muted': '#111827',
        '--primary': '#dc2626',
        '--link': '#dc2626',
        '--border': '#000000',
        '--radius': '8px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#000000',
        '--fg': '#ffffff',
        '--muted': '#e5e7eb',
        '--primary': '#f97316',
        '--link': '#f97316',
        '--border': '#ffffff',
        '--radius': '8px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'serif-classic',
    name: 'Serif classic',
    tokens: {
      light: {
        '--bg': '#fffdf8',
        '--fg': '#1c1917',
        '--muted': '#78716c',
        '--primary': '#0f766e',
        '--link': '#0f766e',
        '--border': '#e7e5e4',
        '--radius': '12px',
        '--font-sans': serifStack,
      },
      dark: {
        '--bg': '#111111',
        '--fg': '#f5f5f4',
        '--muted': '#a8a29e',
        '--primary': '#5eead4',
        '--link': '#5eead4',
        '--border': '#292524',
        '--radius': '12px',
        '--font-sans': serifStack,
      },
    },
  },
  {
    id: 'sans-modern',
    name: 'Sans modern',
    tokens: {
      light: {
        '--bg': '#f3f4f6',
        '--fg': '#111827',
        '--muted': '#4b5563',
        '--primary': '#0ea5e9',
        '--link': '#0ea5e9',
        '--border': '#d1d5db',
        '--radius': '14px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#0f172a',
        '--fg': '#e5e7eb',
        '--muted': '#94a3b8',
        '--primary': '#38bdf8',
        '--link': '#38bdf8',
        '--border': '#1f2a44',
        '--radius': '14px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'warm-sand',
    name: 'Warm / Sand',
    tokens: {
      light: {
        '--bg': '#fffbeb',
        '--fg': '#1f2937',
        '--muted': '#6b7280',
        '--primary': '#b45309',
        '--link': '#b45309',
        '--border': '#fde68a',
        '--radius': '14px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#1a1408',
        '--fg': '#fef3c7',
        '--muted': '#fcd34d',
        '--primary': '#f59e0b',
        '--link': '#f59e0b',
        '--border': '#3a2a10',
        '--radius': '14px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'dark-pro',
    name: 'Dark pro',
    tokens: {
      light: {
        '--bg': '#111827',
        '--fg': '#f9fafb',
        '--muted': '#9ca3af',
        '--primary': '#a78bfa',
        '--link': '#60a5fa',
        '--border': '#374151',
        '--radius': '12px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#0b0f1a',
        '--fg': '#f3f4f6',
        '--muted': '#9ca3af',
        '--primary': '#a78bfa',
        '--link': '#60a5fa',
        '--border': '#1f2937',
        '--radius': '12px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'photo-first',
    name: 'Photo-first',
    tokens: {
      light: {
        '--bg': '#0b1220',
        '--fg': '#f8fafc',
        '--muted': '#cbd5e1',
        '--primary': '#f97316',
        '--link': '#f97316',
        '--border': '#334155',
        '--radius': '18px',
        '--font-sans': systemSans,
      },
      dark: {
        '--bg': '#050814',
        '--fg': '#f8fafc',
        '--muted': '#cbd5e1',
        '--primary': '#fb923c',
        '--link': '#fb923c',
        '--border': '#1e293b',
        '--radius': '18px',
        '--font-sans': systemSans,
      },
    },
  },
  {
    id: 'newsletter',
    name: 'Newsletter-like',
    tokens: {
      light: {
        '--bg': '#ffffff',
        '--fg': '#111827',
        '--muted': '#6b7280',
        '--primary': '#2563eb',
        '--link': '#2563eb',
        '--border': '#e5e7eb',
        '--radius': '10px',
        '--font-sans': 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      },
      dark: {
        '--bg': '#0f172a',
        '--fg': '#e5e7eb',
        '--muted': '#94a3b8',
        '--primary': '#60a5fa',
        '--link': '#60a5fa',
        '--border': '#1f2a44',
        '--radius': '10px',
        '--font-sans': 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      },
    },
  },
];
