import { useEffect, useRef } from 'react'

const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' }
const DIFFICULTY_CLS   = {
  easy:   'text-green-700 bg-green-50 border-green-200',
  normal: 'text-blue-700  bg-blue-50  border-blue-200',
  hard:   'text-red-700   bg-red-50   border-red-200',
}

export default function QuestPopup({ extendedProps, position, onClose }) {
  const ref = useRef(null)
  const { title, difficulty, coin, status } = extendedProps
  const done = status === 'completed'

  useEffect(() => {
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: position.y, left: position.x, zIndex: 1000 }}
      className="bg-rpg-card rounded-2xl shadow-2xl p-4 w-52 border border-rpg-border"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="font-bold text-rpg-text leading-tight flex-1 pr-2 text-sm">
          📋 {title}
        </p>
        <button
          onClick={onClose}
          className="text-rpg-muted hover:text-rpg-text shrink-0 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DIFFICULTY_CLS[difficulty] ?? 'text-rpg-muted bg-rpg-border/40 border-rpg-border'}`}>
          {DIFFICULTY_LABEL[difficulty] ?? difficulty}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${done ? 'text-green-700 bg-green-50 border-green-200' : 'text-rpg-muted bg-rpg-border/40 border-rpg-border'}`}>
          {done ? '✓ 완료' : '미완료'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-rpg-border/50 rounded-xl px-3 py-2">
        <span>🪙</span>
        <span className="font-bold text-rpg-gold">{coin}</span>
        <span className="text-xs text-rpg-muted">코인 보상</span>
      </div>
    </div>
  )
}
