import { useState } from 'react';
import { db } from '../db/db';
import { useQuests, useSubjects, useCharacter } from '../hooks/useStudies';

const COIN_BY_DIFF = { easy: 2, normal: 5, hard: 10 };
const DIFF_LABELS  = { easy: '쉬움', normal: '보통', hard: '어려움' };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
}

const MODAL_CLOSED = { open: false, questId: null, title: '', subject: '', difficulty: '', date: '' };

export default function QuestPanel() {
  const quests     = useQuests()    ?? [];
  const subjects   = useSubjects()  ?? [];
  const characters = useCharacter() ?? [];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tab,   setTab]   = useState('pending');
  const [modal, setModal] = useState(MODAL_CLOSED);

  const character  = characters[0] ?? null;
  const isEdit     = !!modal.questId;
  const coinReward = COIN_BY_DIFF[modal.difficulty] ?? 0;

  const dayQuests = quests.filter(q => q.date === selectedDate);
  const filtered  = dayQuests.filter(q => q.status === tab);

  const countByTab = {
    pending:   dayQuests.filter(q => q.status === 'pending').length,
    completed: dayQuests.filter(q => q.status === 'completed').length,
  };

  function openAdd() {
    setModal({ open: true, questId: null, title: '', subject: '', difficulty: '', date: selectedDate });
  }

  function openEdit(quest) {
    setModal({ open: true, questId: quest.id, title: quest.title, subject: quest.subject, difficulty: quest.difficulty, date: quest.date });
  }

  async function handleSave() {
    if (!modal.title.trim() || !modal.subject || !modal.difficulty || !modal.date) return;
    const coin = COIN_BY_DIFF[modal.difficulty];
    if (modal.questId) {
      await db.quests.update(modal.questId, {
        title: modal.title.trim(), subject: modal.subject, difficulty: modal.difficulty, coin, date: modal.date,
      });
    } else {
      await db.quests.add({
        title: modal.title.trim(), subject: modal.subject, difficulty: modal.difficulty, coin, date: modal.date, status: 'pending',
      });
    }
    setModal(MODAL_CLOSED);
  }

  async function handleComplete(quest) {
    if (!character) return;
    await db.transaction('rw', db.quests, db.characters, async () => {
      await db.quests.update(quest.id, { status: 'completed' });
      await db.characters.update(character.id, { coin: (character.coin ?? 0) + quest.coin });
    });
  }

  async function handleUndo(quest) {
    if (!character) return;
    await db.transaction('rw', db.quests, db.characters, async () => {
      await db.quests.update(quest.id, { status: 'pending' });
      await db.characters.update(character.id, { coin: Math.max(0, (character.coin ?? 0) - quest.coin) });
    });
  }

  async function handleDelete(quest) {
    await db.quests.delete(quest.id);
  }

  const isToday = selectedDate === todayStr();

  return (
    <div className="mx-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-lg font-bold text-gray-800">퀘스트</h2>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + 퀘스트 추가
        </button>
      </div>

      {/* 날짜 탐색 */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2 mb-3">
        <button
          onClick={() => setSelectedDate(d => addDays(d, -1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{formatDate(selectedDate)}</span>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
            >
              오늘
            </button>
          )}
        </div>
        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
        >
          ›
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
        {[['pending', '미완료'], ['completed', '완료']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}{countByTab[key] > 0 ? ` (${countByTab[key]})` : ''}
          </button>
        ))}
      </div>

      {/* 퀘스트 목록 */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          {tab === 'pending' ? '이 날의 퀘스트가 없습니다' : '완료한 퀘스트가 없습니다'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(quest => {
            const subjectColor = subjects.find(s => s.name === quest.subject)?.color ?? '#6B7280';
            return (
              <div key={quest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                <p className={`font-medium text-gray-800 mb-1.5${tab === 'completed' ? ' line-through text-gray-400' : ''}`}>
                  {quest.title}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: subjectColor }}
                  >
                    {quest.subject}
                  </span>
                  <span className="text-xs text-gray-400">{DIFF_LABELS[quest.difficulty]}</span>
                  <span className="text-xs font-bold text-yellow-600">🪙 {quest.coin}</span>
                </div>
                <div className="flex gap-2">
                  {tab === 'pending' && (
                    <>
                      <button
                        onClick={() => openEdit(quest)}
                        className="flex-1 min-h-[36px] rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleComplete(quest)}
                        className="flex-1 min-h-[36px] rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        ✓ 완료
                      </button>
                    </>
                  )}
                  {tab === 'completed' && (
                    <button
                      onClick={() => handleUndo(quest)}
                      className="flex-1 min-h-[36px] rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      ↩ 완료 취소
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(quest)}
                    className="min-h-[36px] px-4 rounded-xl bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가/수정 모달 */}
      {modal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModal(MODAL_CLOSED)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {isEdit ? '📜 퀘스트 수정' : '📜 퀘스트 추가'}
            </h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                날짜
                <input
                  type="date"
                  value={modal.date}
                  onChange={e => setModal(prev => ({ ...prev, date: e.target.value }))}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                제목
                <input
                  type="text"
                  value={modal.title}
                  onChange={e => setModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="퀘스트 제목을 입력하세요"
                  maxLength={40}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                과목
                <select
                  value={modal.subject}
                  onChange={e => setModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">선택하세요</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                난이도
                <select
                  value={modal.difficulty}
                  onChange={e => setModal(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">선택하세요</option>
                  <option value="easy">쉬움</option>
                  <option value="normal">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </label>

              {modal.difficulty && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">코인 보상</span>
                  <span className="font-bold text-yellow-600 ml-auto">🪙 {coinReward}</span>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setModal(MODAL_CLOSED)}
                  className="flex-1 min-h-[44px] rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!modal.title.trim() || !modal.subject || !modal.difficulty || !modal.date}
                  className="flex-1 min-h-[44px] rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {isEdit ? '저장' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
