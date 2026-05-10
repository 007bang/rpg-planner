import { useState } from 'react';
import { db } from '../db/db';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function offsetDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 수학 3건, 영어 3건, 국어 2건, 과학 2건
const TEMPLATES = [
  { subject: '수학', difficulty: 'hard'   },
  { subject: '수학', difficulty: 'normal' },
  { subject: '수학', difficulty: 'easy'   },
  { subject: '영어', difficulty: 'normal' },
  { subject: '영어', difficulty: 'hard'   },
  { subject: '영어', difficulty: 'easy'   },
  { subject: '국어', difficulty: 'normal' },
  { subject: '국어', difficulty: 'easy'   },
  { subject: '과학', difficulty: 'hard'   },
  { subject: '과학', difficulty: 'normal' },
];

export default function SeedButton() {
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const base = Date.now();
      const records = TEMPLATES.map((t, i) => ({
        eventId:    String(base + i),
        date:       offsetDateStr(randInt(0, 6)),
        subject:    t.subject,
        difficulty: t.difficulty,
        minutes:    randInt(30, 120),
        memo:       '',
        completed:  true,
      }));
      await db.studies.bulkAdd(records);
      alert('샘플 데이터 10건이 추가됐습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-4 mb-8">
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="w-full min-h-[44px] rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        {loading ? '추가 중…' : '샘플 데이터 넣기'}
      </button>
    </div>
  );
}
