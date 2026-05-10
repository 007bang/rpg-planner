import { useState } from 'react';
import { db } from '../db/db';
import { useQuests, useCharacter } from '../hooks/useStudies';

const COIN_BY_DIFF  = { easy: 2, normal: 5, hard: 10 };
const DIFF_BORDER   = { easy: 'border-green-400', normal: 'border-blue-400', hard: 'border-red-400' };

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

const MODAL_CLOSED = { open: false, questId: null, title: '', difficulty: '', date: '' };

export default function QuestPanel() {
  const quests     = useQuests()    ?? [];
  const characters = useCharacter() ?? [];

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modal, setModal] = useState(MODAL_CLOSED);

  const character  = characters[0] ?? null;
  const isEdit     = !!modal.questId;
  const coinReward = COIN_BY_DIFF[modal.difficulty] ?? 0;

  const today   = todayStr();
  const isToday = selectedDate === today;

  const sorted = quests
    .filter(q => q.date === selectedDate)
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'completed' ? 1 : -1;
    });

  function openAdd() {
    setModal({ open: true, questId: null, title: '', difficulty: '', date: selectedDate });
  }

  function openEdit(quest) {
    setModal({ open: true, questId: quest.id, title: quest.title, difficulty: quest.difficulty, date: quest.date });
  }

  async function handleSave() {
    if (!modal.title.trim() || !modal.difficulty || !modal.date) return;
    const coin = COIN_BY_DIFF[modal.difficulty];
    if (modal.questId) {
      await db.quests.update(modal.questId, {
        title: modal.title.trim(), difficulty: modal.difficulty, coin, date: modal.date,
      });
    } else {
      await db.quests.add({
        title: modal.title.trim(), difficulty: modal.difficulty, coin, date: modal.date, status: 'pending',
      });
    }
    setModal(MODAL_CLOSED);
  }

  async function handleToggle(quest) {
    if (!character) return;
    await db.transaction('rw', db.quests, db.characters, async () => {
      const char = await db.characters.get(character.id);
      const currentCoin = char?.coin ?? 0;
      if (quest.status === 'completed') {
        await db.quests.update(quest.id, { status: 'pending' });
        await db.characters.update(character.id, { coin: Math.max(0, currentCoin - quest.coin) });
      } else {
        await db.quests.update(quest.id, { status: 'completed' });
        await db.characters.update(character.id, { coin: currentCoin + quest.coin });
      }
    });
  }

  async function handleDelete(quest) {
    await db.quests.delete(quest.id);
  }

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
      <div className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2 mb-3">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-800">{formatDate(selectedDate)}</span>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
          >
            ›
          </button>
        </div>
        {!isToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
          >
            오늘로 돌아가기
          </button>
        )}
      </div>

      {/* 퀘스트 목록 */}
      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">이 날의 퀘스트가 없습니다</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map(quest => {
            const done = quest.status === 'completed';
            return (
              <div
                key={quest.id}
                className={`bg-white rounded-xl border-l-4 ${DIFF_BORDER[quest.difficulty]} shadow-sm px-3 py-2.5 flex items-center gap-2.5 transition-opacity ${done ? 'opacity-50' : ''}`}
              >
                {/* 체크박스 */}
                <button
                  onClick={() => handleToggle(quest)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {done && <span className="text-[10px] leading-none font-bold">✓</span>}
                </button>

                {/* 제목 */}
                <span className={`flex-1 text-sm font-medium min-w-0 truncate ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {quest.title}
                </span>

                {/* 코인 */}
                <span className="text-xs font-bold text-yellow-600 shrink-0">🪙 {quest.coin}</span>

                {/* 수정 / 삭제 */}
                <button
                  onClick={() => openEdit(quest)}
                  className="text-xs text-gray-400 hover:text-gray-600 shrink-0 px-1 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(quest)}
                  className="text-xs text-gray-400 hover:text-red-400 shrink-0 px-1 transition-colors"
                >
                  삭제
                </button>
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
                  disabled={!modal.title.trim() || !modal.difficulty || !modal.date}
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
