import { useState } from 'react';
import { db } from '../db/db';
import { useQuests } from '../hooks/useStudies';

const COIN_BY_DIFF     = { easy: 2, normal: 5, hard: 10 };
const DIFF_LEFT_COLOR  = { easy: '#22c55e', normal: '#3b82f6', hard: '#ef4444' };

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
  const quests = useQuests() ?? [];

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modal, setModal] = useState(MODAL_CLOSED);

  const isEdit = !!modal.questId;
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
    if (quest.status === 'completed') {
      await db.quests.update(quest.id, { status: 'pending' });
    } else {
      await db.quests.update(quest.id, { status: 'completed' });
    }
  }

  async function handleDelete(quest) {
    await db.quests.delete(quest.id);
  }

  return (
    <div className="mx-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-lg font-bold text-rpg-text">퀘스트</h2>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 rounded-lg bg-rpg-gold text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          + 퀘스트 추가
        </button>
      </div>

      {/* 날짜 탐색 */}
      <div className="flex flex-col items-center gap-1 bg-rpg-card rounded-xl border border-rpg-border shadow-lg px-3 py-2 mb-3">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rpg-border text-rpg-muted font-bold transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-rpg-text">{formatDate(selectedDate)}</span>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rpg-border text-rpg-muted font-bold transition-colors"
          >
            ›
          </button>
        </div>
        {!isToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="text-xs text-rpg-purple font-medium hover:text-purple-400"
          >
            오늘로 돌아가기
          </button>
        )}
      </div>

      {/* 퀘스트 목록 */}
      {sorted.length === 0 ? (
        <p className="text-center text-rpg-muted text-sm py-6">이 날의 퀘스트가 없습니다</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map(quest => {
            const done = quest.status === 'completed';
            return (
              <div
                key={quest.id}
                className={`bg-rpg-card rounded-xl border-l-4 border border-rpg-border shadow-lg px-3 py-2.5 flex items-center gap-2.5 transition-opacity ${done ? 'opacity-40' : ''}`}
                style={{ borderLeftColor: DIFF_LEFT_COLOR[quest.difficulty] }}
              >
                <button
                  onClick={() => handleToggle(quest)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? 'bg-rpg-green border-rpg-green text-white'
                      : 'border-rpg-muted hover:border-rpg-purple'
                  }`}
                >
                  {done && <span className="text-[10px] leading-none font-bold">✓</span>}
                </button>

                <span className={`flex-1 text-sm font-medium min-w-0 truncate ${done ? 'line-through text-rpg-muted' : 'text-rpg-text'}`}>
                  {quest.title}
                </span>

                <span className="text-xs font-bold text-rpg-gold shrink-0">🪙 {quest.coin}</span>

                <button
                  onClick={() => openEdit(quest)}
                  className="text-xs text-rpg-muted hover:text-rpg-text shrink-0 px-1 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(quest)}
                  className="text-xs text-rpg-muted hover:text-rpg-red shrink-0 px-1 transition-colors"
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
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setModal(MODAL_CLOSED)}
        >
          <div
            className="bg-rpg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-rpg-border"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-rpg-text">
              {isEdit ? '📜 퀘스트 수정' : '📜 퀘스트 추가'}
            </h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
                날짜
                <input
                  type="date"
                  value={modal.date}
                  onChange={e => setModal(prev => ({ ...prev, date: e.target.value }))}
                  className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
                제목
                <input
                  type="text"
                  value={modal.title}
                  onChange={e => setModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="퀘스트 제목을 입력하세요"
                  maxLength={40}
                  className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
                난이도
                <select
                  value={modal.difficulty}
                  onChange={e => setModal(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                >
                  <option value="">선택하세요</option>
                  <option value="easy">쉬움</option>
                  <option value="normal">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </label>

              {modal.difficulty && (
                <div className="flex items-center gap-2 bg-rpg-border/50 border border-rpg-border rounded-lg px-3 py-2">
                  <span className="text-sm text-rpg-muted">코인 보상</span>
                  <span className="font-bold text-rpg-gold ml-auto">🪙 {coinReward}</span>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setModal(MODAL_CLOSED)}
                  className="flex-1 min-h-[44px] rounded-xl border border-rpg-border text-rpg-text font-medium hover:bg-rpg-border transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!modal.title.trim() || !modal.difficulty || !modal.date}
                  className="flex-1 min-h-[44px] rounded-xl bg-rpg-gold text-gray-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
