import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { computeStats } from '../utils/xp';

const BADGE_LIST = [
  { key: 'firstRecord',   icon: '🎯', label: '첫 기록'     },
  { key: 'streak3',       icon: '🔥', label: '3일 연속'    },
  { key: 'hardChallenge', icon: '⚡', label: '어려움 도전' },
  { key: 'levelMaster',   icon: '👑', label: '레벨 마스터' },
];

export default function StatusPanel() {
  const studies = useLiveQuery(() => db.studies.toArray(), []);

  if (studies === undefined) return null;

  const { totalXP, todayXP, streak, level, levelName, progress, remaining, badges } = computeStats(studies);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-5 mx-4 mt-4 shadow-xl">
      {/* 레벨 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-indigo-300 tracking-widest uppercase mb-0.5">
            Lv.{level}
          </p>
          <h2 className="text-xl font-bold leading-tight">{levelName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-300 mb-0.5">총 XP</p>
          <p className="text-2xl font-bold text-yellow-400">{totalXP.toLocaleString()}</p>
        </div>
      </div>

      {/* XP 프로그레스 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-indigo-300 mb-1.5">
          <span>{progress}%</span>
          <span>
            {level < 3
              ? `다음 레벨까지 ${remaining.toLocaleString()} XP`
              : '🏆 최고 레벨 달성!'}
          </span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 오늘 XP + 연속 출석 */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5">
          <p className="text-xs text-indigo-300 mb-0.5">오늘 획득 XP</p>
          <p className="font-bold leading-none">
            <span className="text-yellow-400 text-lg">{todayXP}</span>
            <span className="text-indigo-300 text-sm"> / 400</span>
          </p>
          {/* 오늘 진행 미니바 */}
          <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (todayXP / 400) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5">
          <p className="text-xs text-indigo-300 mb-0.5">연속 출석</p>
          <p className="font-bold text-lg leading-none">
            {streak > 0 ? (
              <span className="text-orange-400">{streak}일 🔥</span>
            ) : (
              <span className="text-indigo-400">-</span>
            )}
          </p>
          <p className="text-xs text-indigo-400 mt-1">
            {streak >= 7 ? '×1.2 보너스 중!' : streak >= 3 ? '×1.1 보너스 중!' : '3일 연속 시 보너스'}
          </p>
        </div>
      </div>

      {/* 뱃지 */}
      <div className="flex justify-around border-t border-white/10 pt-4">
        {BADGE_LIST.map(badge => (
          <div
            key={badge.key}
            className={`flex flex-col items-center gap-1 transition-opacity duration-300${badges[badge.key] ? '' : ' opacity-25'}`}
            title={badge.label}
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className="text-xs text-indigo-300 text-center leading-tight">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
