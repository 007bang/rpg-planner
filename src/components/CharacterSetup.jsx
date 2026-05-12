import { useState } from 'react';
import { db } from '../db/db';
import { FREE_AVATARS } from '../constants/avatars';

const JOBS = [
  {
    id: 'warrior',
    icon: '⚔️',
    label: '전사',
    desc: '어려움에 강함',
    mults: [
      { diff: '어려움', mult: '×1.8', highlight: true },
      { diff: '보통',   mult: '×1.0' },
      { diff: '쉬움',   mult: '×0.7' },
    ],
  },
  {
    id: 'mage',
    icon: '🧙',
    label: '마법사',
    desc: '균형잡힌 성장',
    mults: [
      { diff: '어려움', mult: '×1.3' },
      { diff: '보통',   mult: '×1.2', highlight: true },
      { diff: '쉬움',   mult: '×1.0' },
    ],
  },
  {
    id: 'archer',
    icon: '🏹',
    label: '궁수',
    desc: '안정적인 성장',
    mults: [
      { diff: '어려움', mult: '×1.5' },
      { diff: '보통',   mult: '×1.1', highlight: true },
      { diff: '쉬움',   mult: '×0.9' },
    ],
  },
];

export default function CharacterSetup() {
  const [nickname, setNickname] = useState('');
  const [job, setJob] = useState('');
  const [avatar, setAvatar] = useState('🧑');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim() || !job) return;
    await db.characters.add({ nickname: nickname.trim(), job, coin: 0, avatar });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold text-white mb-1">RPG 공부 플래너</h1>
          <p className="text-indigo-300 text-sm">모험을 시작하기 전에 캐릭터를 만들어주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={12}
              required
              className="w-full bg-white/10 text-white placeholder-indigo-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">
              아바타 선택
              <span className="ml-2 text-xs text-indigo-400">🔓 추가 아바타는 상점에서 코인으로 해금</span>
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {FREE_AVATARS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`rounded-xl py-2 text-xl transition-all border-2 ${
                    avatar === em
                      ? 'bg-white/20 border-white'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">직업 선택</label>
            <div className="grid grid-cols-3 gap-2">
              {JOBS.map(j => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setJob(j.id)}
                  className={`rounded-xl p-3 text-center transition-all border-2 ${
                    job === j.id
                      ? 'bg-white/20 border-white'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-1">{j.icon}</div>
                  <div className="text-white font-bold text-sm">{j.label}</div>
                  <div className="text-indigo-300 text-xs mt-0.5 mb-2">{j.desc}</div>
                  <div className="space-y-0.5">
                    {j.mults.map(m => (
                      <div
                        key={m.diff}
                        className={`text-xs flex justify-between ${m.highlight ? 'text-yellow-300 font-bold' : 'text-indigo-400'}`}
                      >
                        <span>{m.diff}</span>
                        <span>{m.mult}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!nickname.trim() || !job}
            className="w-full min-h-[52px] rounded-xl bg-yellow-400 text-gray-900 font-bold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            모험 시작!
          </button>
        </form>
      </div>
    </div>
  );
}
