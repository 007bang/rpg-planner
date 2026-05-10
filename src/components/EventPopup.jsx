import { useEffect, useRef } from 'react';

const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };

export default function EventPopup({ eventId, extendedProps, position, onComplete, onDelete, onClose }) {
  const ref = useRef(null);
  const { completed, subjectName, difficulty, minutes } = extendedProps;

  useEffect(() => {
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: position.y, left: position.x, zIndex: 1000 }}
      className="bg-white rounded-2xl shadow-2xl p-4 w-52 border border-gray-100"
    >
      <p className="font-bold text-gray-800 mb-0.5">{subjectName}</p>
      <p className="text-xs text-gray-500 mb-3">
        {DIFFICULTY_LABEL[difficulty] ?? '보통'} · {minutes}분
      </p>
      {!completed ? (
        <button
          onClick={onComplete}
          className="w-full min-h-[44px] rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors mb-2"
        >
          ✓ 완료
        </button>
      ) : (
        <p className="text-center text-green-600 font-semibold mb-2">✓ 완료됨</p>
      )}
      <button
        onClick={onDelete}
        className="w-full min-h-[44px] rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}
