import { useStudies, useCharacter, useCoin } from '../hooks/useStudies';
import { computeStats } from '../utils/xp';

const BADGE_LIST = [
  { key: 'firstRecord',   icon: '🎯', label: '첫 기록'     },
  { key: 'streak3',       icon: '🔥', label: '3일 연속'    },
  { key: 'hardChallenge', icon: '⚡', label: '어려움 도전' },
  { key: 'levelMaster',   icon: '👑', label: '레벨 마스터' },
];

const JOB_ICONS  = { warrior: '⚔️', mage: '🧙', archer: '🏹' };
const JOB_LABELS = { warrior: '전사', mage: '마법사', archer: '궁수' };

function scrollToInfo() {
  document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth' });
}

export default function StatusPanel() {
  const studies    = useStudies();
  const characters = useCharacter();
  const coin       = useCoin();

  if (studies === undefined || characters === undefined || coin === undefined) return null;

  const character = characters[0] ?? null;
  const { totalXP, todayXP, streak, level, levelName, progress, remaining, badges } =
    computeStats(studies, character?.job ?? null);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-5 mx-4 mt-4 shadow-xl">
      {/* 캐릭터 정보 */}
      {character && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <span className="text-xl">{JOB_ICONS[character.job]}</span>
          <span className="font-bold">{character.nickname}</span>
          <span className="text-xs text-indigo-300 ml-1">{JOB_LABELS[character.job]}</span>
          <span className="ml-auto text-sm font-bold text-yellow-300">🪙 {coin}</span>
        </div>
      )}

      {/* 레벨 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-indigo-300 tracking-widest uppercase mb-0.5">
            Lv.{level}
          </p>
          <h2
            className="text-xl font-bold leading-tight cursor-pointer hover:text-indigo-200 transition-colors"
            onClick={scrollToInfo}
            title="레벨 · 뱃지 정보 보기"
          >
            {levelName} ›
          </h2>
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

      {/* 뱃지 아이콘 요약 */}
      <div
        className="flex justify-around border-t border-white/10 pt-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={scrollToInfo}
        title="뱃지 획득 조건 보기"
      >
        {BADGE_LIST.map(badge => (
          <div
            key={badge.key}
            className={`flex flex-col items-center gap-1 transition-opacity duration-300${badges[badge.key] ? '' : ' opacity-25'}`}
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className="text-xs text-indigo-300 text-center leading-tight">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
