import { useEffect, useRef } from 'react';

const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };

function fmtDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

const STATUS_BADGE = {
  studying:  { label: '학습중', cls: 'text-amber-600 bg-amber-50' },
  completed: { label: '완료',   cls: 'text-rpg-green bg-green-50' },
};

export default function EventPopup({ extendedProps, position, onSetStatus, onDelete, onEdit, onClose }) {
  const ref = useRef(null);
  const { status = 'pending', subjectName, difficulty, minutes } = extendedProps;
  const badge = STATUS_BADGE[status] ?? null;

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
      className="bg-rpg-card rounded-2xl shadow-2xl p-4 w-52 border border-rpg-border"
    >
      <div className="flex items-start justify-between mb-0.5">
        <p className="font-bold text-rpg-text">{subjectName}</p>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-1 ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs text-rpg-muted mb-3">
        {DIFFICULTY_LABEL[difficulty] ?? '보통'} · {fmtDuration(minutes)}
      </p>

      {status === 'pending' && (
        <>
          <button
            onClick={() => onSetStatus('studying')}
            className="w-full min-h-[44px] rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors mb-2"
          >
            ▶ 학습중
          </button>
          <button
            onClick={() => onSetStatus('completed')}
            className="w-full min-h-[44px] rounded-xl bg-rpg-green text-white font-medium hover:bg-green-600 transition-colors mb-2"
          >
            ✓ 완료
          </button>
        </>
      )}

      {status === 'studying' && (
        <>
          <button
            onClick={() => onSetStatus('completed')}
            className="w-full min-h-[44px] rounded-xl bg-rpg-green text-white font-medium hover:bg-green-600 transition-colors mb-2"
          >
            ✓ 완료
          </button>
          <button
            onClick={() => onSetStatus('pending')}
            className="w-full min-h-[44px] rounded-xl bg-rpg-border text-rpg-text font-medium hover:bg-rpg-border/70 transition-colors mb-2"
          >
            ↩ 미완료로
          </button>
        </>
      )}

      {status === 'completed' && (
        <button
          onClick={() => onSetStatus('pending')}
          className="w-full min-h-[44px] rounded-xl bg-rpg-border text-rpg-text font-medium hover:bg-rpg-border/70 transition-colors mb-2"
        >
          ↩ 완료 취소
        </button>
      )}

      <button
        onClick={onEdit}
        className="w-full min-h-[44px] rounded-xl bg-rpg-purple text-white font-medium hover:bg-purple-700 transition-colors mb-2"
      >
        수정
      </button>
      <button
        onClick={onDelete}
        className="w-full min-h-[44px] rounded-xl bg-rpg-red text-white font-medium hover:bg-red-600 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}
