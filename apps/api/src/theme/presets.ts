export type ThemeTokens = {
  [key: string]: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  layout_type: 'portal' | 'brand' | 'tech';
  tokens: ThemeTokens;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'type-a-portal',
    name: 'Type A / Portal',
    description: '뉴스룸형 레이아웃으로 밀도 높은 정보 구조를 제공합니다.',
    layout_type: 'portal',
    tokens: {
      '--bg': '#f8fafc',
      '--fg': '#0f172a',
      '--muted': '#64748b',
      '--accent': '#0f172a',
      '--border': '#e2e8f0',
      '--radius': '0px',
      '--header-height': '80px',
      '--font-title': 'Merriweather, serif',
      '--font-body': "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', Arial, sans-serif",
      '--card-shadow': '0 8px 16px rgba(15, 23, 42, 0.08)',
    },
  },
  {
    id: 'type-b-brand',
    name: 'Type B / Brand',
    description: '브랜드형 카드 레이아웃으로 여백과 이미지 중심의 스타일을 제공합니다.',
    layout_type: 'brand',
    tokens: {
      '--bg': '#ffffff',
      '--fg': '#111827',
      '--muted': '#6b7280',
      '--accent': '#2563eb',
      '--border': '#e5e7eb',
      '--radius': '24px',
      '--header-height': '72px',
      '--font-title': 'Pretendard, sans-serif',
      '--font-body': 'Pretendard, sans-serif',
      '--card-shadow': '0 20px 40px rgba(0,0,0,0.1)',
    },
  },
  {
    id: 'type-c-tech',
    name: 'Type C / Tech',
    description: '텍스트 중심의 다크 모드 테크 레이아웃을 제공합니다.',
    layout_type: 'tech',
    tokens: {
      '--bg': '#111111',
      '--fg': '#ffffff',
      '--muted': '#9ca3af',
      '--accent': '#ff6f0f',
      '--border': '#1f2937',
      '--radius': '12px',
      '--header-height': '64px',
      '--font-title': "IBM Plex Sans, 'Noto Sans KR', sans-serif",
      '--font-body': "IBM Plex Sans, 'Noto Sans KR', sans-serif",
      '--card-shadow': '0 14px 30px rgba(0,0,0,0.35)',
    },
  },
];
