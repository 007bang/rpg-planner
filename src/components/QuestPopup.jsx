import { useEffect, useRef } from 'react'

const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' }
const DIFFICULTY_CLS   = {
  easy:   'text-green-700 bg-green-50 border-green-200',
  normal: 'text-blue-700 bg-blue-50 border-blue-200',
  hard:   'text-red-700 bg-red-50 border-red-200',
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
      className="bg-white rounded-2xl shadow-2xl p-4 w-52 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="font-bold text-gray-800 leading-tight flex-1 pr-2 text-sm">
          📋 {title}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 shrink-0 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DIFFICULTY_CLS[difficulty] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
          {DIFFICULTY_LABEL[difficulty] ?? difficulty}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${done ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
          {done ? '✓ 완료' : '미완료'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-yellow-50 rounded-xl px-3 py-2">
        <span>🪙</span>
        <span className="font-bold text-yellow-600">{coin}</span>
        <span className="text-xs text-gray-400">코인 보상</span>
      </div>
    </div>
  )
}
