import { useStudies } from '../hooks/useStudies';
import { computeStats } from '../utils/xp';

const LEVEL_INFO = [
  { level: 1, name: '수습 공부러',   range: '0 ~ 499 XP'      },
  { level: 2, name: '성실한 학습자', range: '500 ~ 1,499 XP'  },
  { level: 3, name: '시험의 지배자', range: '1,500 XP 이상'   },
];

const BADGE_LIST = [
  { key: 'firstRecord',   icon: '🎯', label: '첫 기록'     },
  { key: 'streak3',       icon: '🔥', label: '3일 연속'    },
  { key: 'hardChallenge', icon: '⚡', label: '어려움 도전' },
  { key: 'levelMaster',   icon: '👑', label: '레벨 마스터' },
];

const BADGE_DETAIL = [
  {
    key:  'firstRecord',
    icon: '🎯',
    label: '첫 기록',
    desc:  '공부 기록을 처음으로 완료하세요',
  },
  {
    key:  'streak3',
    icon: '🔥',
    label: '3일 연속',
    desc:  '3일 이상 연속으로 학습을 완료하세요',
  },
  {
    key:  'hardChallenge',
    icon: '⚡',
    label: '어려움 도전',
    desc:  '어려움 난이도 공부를 5번 완료하세요',
  },
  {
    key:  'levelMaster',
    icon: '👑',
    label: '레벨 마스터',
    desc:  '총 XP 1,500 이상을 획득하세요 (Lv.3)',
  },
];

export default function StatusPanel() {
  const studies = useStudies();

  if (studies === undefined) return null;

  const { totalXP, todayXP, streak, level, levelName, progress, remaining, badges } = computeStats(studies);

  return (
    <>
      {/* 메인 상태 카드 */}
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

      {/* 뱃지 설명 카드 */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">뱃지 획득 조건</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {BADGE_DETAIL.map(badge => (
            <div
              key={badge.key}
              className={`flex items-center gap-4 px-5 py-3.5 transition-opacity duration-300${badges[badge.key] ? '' : ' opacity-30'}`}
            >
              <span className="text-2xl flex-shrink-0">{badge.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{badge.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
              </div>
              {badges[badge.key] && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  획득
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 레벨 칭호 카드 */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">레벨 칭호</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {LEVEL_INFO.map(info => {
            const isCurrent = level === info.level;
            return (
              <div
                key={info.level}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors${isCurrent ? ' bg-indigo-50' : ' opacity-40'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0${isCurrent ? ' bg-indigo-600 text-white' : ' bg-gray-100 text-gray-500'}`}>
                  {info.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold${isCurrent ? ' text-indigo-700' : ' text-gray-700'}`}>
                    {info.name}
                  </p>
                  <p className={`text-xs mt-0.5${isCurrent ? ' text-indigo-400' : ' text-gray-400'}`}>
                    {info.range}
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    현재
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
