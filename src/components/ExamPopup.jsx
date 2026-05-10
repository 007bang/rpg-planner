import { useEffect, useRef } from 'react';

export default function ExamPopup({ extendedProps, position, onDelete, onEdit, onClose }) {
  const ref = useRef(null);
  const { subject, range, date } = extendedProps;

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
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-lg">📝</span>
        <p className="font-bold text-gray-800">{subject} 시험</p>
      </div>
      <p className="text-xs text-gray-400 mb-2">{date}</p>
      {range ? (
        <p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
          {range}
        </p>
      ) : (
        <div className="mb-3" />
      )}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 min-h-[44px] rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
