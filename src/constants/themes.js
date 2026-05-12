export const THEME_PRICE = 50;

export const BG_THEMES = [
  { id: '#f8f9fa', card: '#ffffff', label: '기본',     free: true,  dark: false },
  { id: '#f0faf5', card: '#ffffff', label: '민트',     free: false, dark: false },
  { id: '#fff0f5', card: '#ffffff', label: '핑크',     free: false, dark: false },
  { id: '#fff5f0', card: '#ffffff', label: '피치',     free: false, dark: false },
  { id: '#fffbeb', card: '#ffffff', label: '선샤인',   free: false, dark: false },
  { id: '#f5f0ff', card: '#ffffff', label: '라벤더',   free: false, dark: false },
  { id: '#fdf8ee', card: '#ffffff', label: '파피루스', free: false, dark: false },
  { id: '#1a1a2e', card: '#16213e', label: '미드나잇', free: false, dark: true  },
  { id: '#0f2027', card: '#0a3040', label: '딥오션',   free: false, dark: true  },
  { id: '#1a2e1a', card: '#1e3a1e', label: '포레스트', free: false, dark: true  },
];

export const ACCENT_THEMES = [
  { id: '#6366f1', label: '인디고',   free: true  },
  { id: '#10b981', label: '민트그린', free: false },
  { id: '#7c3aed', label: '보라',     free: false },
  { id: '#ec4899', label: '핑크',     free: false },
  { id: '#f97316', label: '오렌지',   free: false },
  { id: '#f59e0b', label: '앰버',     free: false },
  { id: '#00b4d8', label: '스카이블루', free: false },
  { id: '#4ade80', label: '라임',     free: false },
  { id: '#c084fc', label: '라벤더',   free: false },
  { id: '#f0a500', label: '골드',     free: false },
];

export function applyTheme(character) {
  const bgTheme = BG_THEMES.find(t => t.id === character?.themeBg) ?? BG_THEMES[0];
  const accent  = character?.themeAccent ?? ACCENT_THEMES[0].id;
  const root    = document.documentElement.style;

  root.setProperty('--rpg-bg',     bgTheme.id);
  root.setProperty('--rpg-card',   bgTheme.card);
  root.setProperty('--rpg-purple', accent);
  root.setProperty('--rpg-green',  accent);

  if (bgTheme.dark) {
    root.setProperty('--rpg-text',   '#e9ecef');
    root.setProperty('--rpg-muted',  '#adb5bd');
    root.setProperty('--rpg-border', '#2d3748');
  } else {
    root.setProperty('--rpg-text',   '#212529');
    root.setProperty('--rpg-muted',  '#6c757d');
    root.setProperty('--rpg-border', '#e9ecef');
  }
}
