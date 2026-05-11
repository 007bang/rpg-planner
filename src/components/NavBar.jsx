const NAV_ITEMS = [
  { label: '상태',   icon: '🏆', id: 'section-status'    },
  { label: '캘린더', icon: '📅', id: 'section-calendar'  },
  { label: '퀘스트', icon: '📜', id: 'section-quest'     },
  { label: '스탯',   icon: '💪', id: 'section-char-stat' },
  { label: '설정',   icon: '⚙️', id: 'section-settings'  },
  { label: '통계',   icon: '📊', id: 'section-charts'    },
];

function formatNavTime(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function NavBar({ timerElapsed = 0, timerRunning = false }) {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="sticky top-0 z-40 bg-rpg-card border-b border-rpg-border shadow-lg">
      {timerRunning && (
        <div className="bg-rpg-purple text-white text-xs font-bold font-mono text-center py-1 tracking-wide">
          ⏱ {formatNavTime(timerElapsed)} 학습 중
        </div>
      )}
      <div className="max-w-2xl mx-auto flex justify-around px-2 py-1.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-rpg-border active:bg-rpg-border/70 transition-colors"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] text-rpg-muted font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
