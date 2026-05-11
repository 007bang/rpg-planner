import { useState, useRef } from 'react';
import { db } from '../db/db';
import { useToast } from '../hooks/useToast';
import { useCharacter } from '../hooks/useStudies';
import SubjectManager from './SubjectManager';

const JOB_ICONS  = { warrior: '⚔️', mage: '🧙', archer: '🏹' };
const JOB_LABELS = { warrior: '전사', mage: '마법사', archer: '궁수' };

const AVATARS = [
  '🧑', '👦', '👧', '👨', '👩', '🧒',
  '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍💻', '👩‍💻',
  '🐱', '🐶', '🦊', '🐸', '🐼', '🐨',
];

const VALID_STATUSES   = ['pending', 'studying', 'completed'];
const VALID_QUEST_STAT = ['pending', 'completed'];
const VALID_DIFF       = ['easy', 'normal', 'hard'];

function validateStudy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.minutes !== 'number') return null;

  const out = {};
  if (typeof raw.id === 'number')   out.id         = raw.id;
  if (raw.eventId   !== undefined)  out.eventId    = String(raw.eventId);
  if (raw.date      !== undefined)  out.date       = String(raw.date);
  if (raw.subject   !== undefined)  out.subject    = String(raw.subject);
  if (raw.difficulty !== undefined) out.difficulty = String(raw.difficulty);
  out.minutes = raw.minutes;

  if (raw.status !== undefined) {
    out.status = VALID_STATUSES.includes(raw.status) ? raw.status : 'pending';
  } else if (raw.completed !== undefined) {
    out.status = raw.completed ? 'completed' : 'pending';
  } else {
    out.status = 'pending';
  }

  return out;
}

function validateQuest(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.title || typeof raw.title !== 'string') return null;

  const out = {};
  if (typeof raw.id === 'number') out.id = raw.id;
  out.title      = raw.title.trim();
  out.difficulty = VALID_DIFF.includes(raw.difficulty) ? raw.difficulty : 'normal';
  out.coin       = typeof raw.coin === 'number' ? raw.coin : 0;
  out.status     = VALID_QUEST_STAT.includes(raw.status) ? raw.status : 'pending';
  out.date       = raw.date ? String(raw.date) : new Date().toISOString().slice(0, 10);
  if (typeof raw.actualDuration === 'number') out.actualDuration = raw.actualDuration;
  return out;
}

function validateExam(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.subject || !raw.date) return null;

  const out = {};
  if (typeof raw.id === 'number') out.id = raw.id;
  out.subject = String(raw.subject);
  out.date    = String(raw.date);
  out.range   = raw.range ? String(raw.range) : '';
  return out;
}

export default function SettingsPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const importModeRef = useRef('add');
  const { msg: toastMsg, show: showToast } = useToast();

  const characters = useCharacter();
  const character = characters?.[0] ?? null;
  const [editChar, setEditChar] = useState(false);
  const [charNickname, setCharNickname] = useState('');
  const [charJob, setCharJob] = useState('');
  const [charAvatar, setCharAvatar] = useState('🧑');

  function startEditChar() {
    setCharNickname(character?.nickname ?? '');
    setCharJob(character?.job ?? '');
    setCharAvatar(character?.avatar ?? '🧑');
    setEditChar(true);
  }

  async function saveChar() {
    if (!charNickname.trim() || !charJob || !character) return;
    await db.characters.update(character.id, { nickname: charNickname.trim(), job: charJob, avatar: charAvatar });
    setEditChar(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const [studies, subjects, quests, exams] = await Promise.all([
        db.studies.toArray(),
        db.subjects.toArray(),
        db.quests.toArray(),
        db.exams.toArray(),
      ]);
      const blob = new Blob(
        [JSON.stringify({ studies, subjects, quests, exams }, null, 2)],
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

  function openImport(mode) {
    if (mode === 'replace') {
      if (!window.confirm('기존 데이터가 모두 삭제됩니다. 계속하시겠습니까?')) return;
    }
    importModeRef.current = mode;
    fileInputRef.current?.click();
  }

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

        const validStudies = parsed.studies.map(validateStudy).filter(Boolean);
        const validQuests  = (parsed.quests  ?? []).map(validateQuest).filter(Boolean);
        const validExams   = (parsed.exams   ?? []).map(validateExam).filter(Boolean);
        const total = validStudies.length + validQuests.length + validExams.length;

        if (importModeRef.current === 'replace') {
          await db.transaction('rw', db.studies, db.quests, db.exams, async () => {
            await db.studies.clear();
            await db.studies.bulkAdd(validStudies);
            await db.quests.clear();
            if (validQuests.length > 0) await db.quests.bulkAdd(validQuests);
            await db.exams.clear();
            if (validExams.length > 0) await db.exams.bulkAdd(validExams);
          });
          showToast(`기존 데이터를 삭제하고 ${total}건을 불러왔습니다`);
        } else {
          await db.transaction('rw', db.studies, db.quests, db.exams, async () => {
            await db.studies.bulkPut(validStudies);
            if (validQuests.length > 0) await db.quests.bulkPut(validQuests);
            if (validExams.length > 0) await db.exams.bulkPut(validExams);
          });
          showToast(`${total}건의 기록을 추가했습니다`);
        }
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

      {/* 캐릭터 */}
      {character && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">캐릭터</p>
              <p className="text-xs text-gray-400 mt-0.5">닉네임과 직업을 변경합니다</p>
            </div>
            {!editChar && (
              <button
                onClick={startEditChar}
                className="min-h-[36px] px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                수정
              </button>
            )}
          </div>
          {editChar ? (
            <div className="px-5 py-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                닉네임
                <input
                  type="text"
                  value={charNickname}
                  onChange={e => setCharNickname(e.target.value)}
                  maxLength={12}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">아바타</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATARS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCharAvatar(em)}
                      className={`rounded-xl py-1.5 text-xl transition-all border-2 ${
                        charAvatar === em
                          ? 'bg-gray-100 border-gray-400'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                직업
                <select
                  value={charJob}
                  onChange={e => setCharJob(e.target.value)}
                  className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="warrior">⚔️ 전사 — 어려움 ×1.8</option>
                  <option value="mage">🧙 마법사 — 보통 ×1.2</option>
                  <option value="archer">🏹 궁수 — 어려움 ×1.5</option>
                </select>
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditChar(false)}
                  className="flex-1 min-h-[40px] rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={saveChar}
                  disabled={!charNickname.trim() || !charJob}
                  className="flex-1 min-h-[40px] rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 flex items-center gap-3">
              <span className="text-2xl">{character.avatar ?? '🧑'}</span>
              <span className="text-lg">{JOB_ICONS[character.job]}</span>
              <div>
                <p className="font-medium text-gray-800">{character.nickname}</p>
                <p className="text-xs text-gray-400">{JOB_LABELS[character.job]}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 과목 관리 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-medium text-gray-800">과목 관리</p>
          <p className="text-xs text-gray-400 mt-0.5">과목을 추가·수정·삭제합니다 (기록이 있는 과목은 삭제 불가)</p>
        </div>
        <div className="px-5 py-2">
          <SubjectManager />
        </div>
      </div>

      {/* 데이터 관리 */}
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
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="font-medium text-gray-800">데이터 가져오기</p>
            <p className="text-xs text-gray-400 mt-0.5">JSON 백업 파일에서 복원</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openImport('add')}
              disabled={importing}
              className="flex-1 min-h-[44px] rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {importing ? '불러오는 중…' : '추가로 가져오기'}
            </button>
            <button
              type="button"
              onClick={() => openImport('replace')}
              disabled={importing}
              className="flex-1 min-h-[44px] rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {importing ? '불러오는 중…' : '교체로 가져오기'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
