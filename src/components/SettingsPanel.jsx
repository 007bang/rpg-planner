import { useState, useRef, useEffect } from 'react';
import { db } from '../db/db';

// ── 토스트 ──────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  function show(text) {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3000);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return { msg, show };
}

// ── 검증 ────────────────────────────────────────────────────────────────────

function validateStudy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.minutes !== 'number') return null;
  if (typeof raw.completed !== 'boolean') return null;

  // 허용 필드만 추출
  const out = {};
  if (typeof raw.id === 'number')       out.id         = raw.id;
  if (raw.eventId   !== undefined)      out.eventId    = String(raw.eventId);
  if (raw.date      !== undefined)      out.date       = String(raw.date);
  if (raw.subject   !== undefined)      out.subject    = String(raw.subject);
  if (raw.difficulty !== undefined)     out.difficulty = String(raw.difficulty);
  out.minutes   = raw.minutes;
  out.completed = raw.completed;
  return out;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { msg: toastMsg, show: showToast } = useToast();

  // 내보내기
  async function handleExport() {
    setExporting(true);
    try {
      const [studies, subjects] = await Promise.all([
        db.studies.toArray(),
        db.subjects.toArray(),
      ]);
      const blob = new Blob(
        [JSON.stringify({ studies, subjects }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rpg-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('백업 파일이 저장됐습니다');
    } finally {
      setExporting(false);
    }
  }

  // 가져오기 — 파일 선택
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        let parsed;
        try {
          parsed = JSON.parse(ev.target.result);
        } catch {
          showToast('JSON 파싱에 실패했습니다');
          return;
        }

        if (!Array.isArray(parsed?.studies)) {
          showToast('올바르지 않은 백업 파일입니다');
          return;
        }

        const valid = parsed.studies.map(validateStudy).filter(Boolean);

        await db.transaction('rw', db.studies, async () => {
          await db.studies.bulkPut(valid);
        });

        showToast(`${valid.length}건의 기록을 불러왔습니다`);
      } catch {
        showToast('가져오기 중 오류가 발생했습니다');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      showToast('파일을 읽을 수 없습니다');
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  }

  return (
    <div className="mx-4 mb-4">
      <h2 className="text-lg font-bold text-gray-800 px-1 mb-3">설정</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {/* 내보내기 */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-gray-800">데이터 내보내기</p>
            <p className="text-xs text-gray-400 mt-0.5">전체 기록을 JSON 파일로 저장</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="min-h-[44px] px-5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {exporting ? '저장 중…' : '내보내기'}
          </button>
        </div>

        {/* 가져오기 */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-gray-800">데이터 가져오기</p>
            <p className="text-xs text-gray-400 mt-0.5">JSON 백업 파일에서 복원</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="min-h-[44px] px-5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {importing ? '불러오는 중…' : '가져오기'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 토스트 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
