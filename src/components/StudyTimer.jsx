function formatTime(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export default function StudyTimer({ elapsed, isRunning, onStart, onPause, onReset }) {
  const hasTime = elapsed > 0

  return (
    <div className="mx-4 bg-rpg-card rounded-2xl border border-rpg-border shadow-lg p-5">
      <h2 className="text-xs font-semibold text-rpg-muted uppercase tracking-widest mb-4">
        공부 타이머
      </h2>

      <div className="flex flex-col items-center gap-4">
        <span
          className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
            isRunning ? 'text-rpg-gold' : hasTime ? 'text-rpg-text' : 'text-rpg-muted'
          }`}
        >
          {formatTime(elapsed)}
        </span>

        <div className="flex gap-2 w-full">
          <button
            onClick={isRunning ? onPause : onStart}
            className={`flex-1 min-h-[44px] rounded-xl font-medium transition-colors text-white ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rpg-purple hover:bg-purple-700'
            }`}
          >
            {isRunning ? '일시정지' : hasTime ? '재개' : '시작'}
          </button>
          <button
            onClick={onReset}
            disabled={!hasTime && !isRunning}
            className="min-h-[44px] px-5 rounded-xl bg-rpg-border text-rpg-text font-medium hover:bg-rpg-border/70 transition-colors disabled:opacity-40"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}
