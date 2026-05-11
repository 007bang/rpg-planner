function formatTime(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export default function StudyTimer({ elapsed, isRunning, onStart, onPause, onReset }) {
  const hasTime = elapsed > 0

  return (
    <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        공부 타이머
      </h2>

      <div className="flex flex-col items-center gap-4">
        <span
          className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
            isRunning ? 'text-indigo-600' : hasTime ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          {formatTime(elapsed)}
        </span>

        <div className="flex gap-2 w-full">
          <button
            onClick={isRunning ? onPause : onStart}
            className={`flex-1 min-h-[44px] rounded-xl font-medium transition-colors text-white ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? '일시정지' : hasTime ? '재개' : '시작'}
          </button>
          <button
            onClick={onReset}
            disabled={!hasTime && !isRunning}
            className="min-h-[44px] px-5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}
