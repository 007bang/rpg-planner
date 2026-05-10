import { useStudies, useCharacter } from '../hooks/useStudies';
import { computeStats } from '../utils/xp';

const LEVEL_INFO = [
  { level: 1, name: '수습 공부러',   range: '0 ~ 499 XP'      },
  { level: 2, name: '성실한 학습자', range: '500 ~ 1,499 XP'  },
  { level: 3, name: '시험의 지배자', range: '1,500 XP 이상'   },
];

const BADGE_DETAIL = [
  { key: 'firstRecord',   icon: '🎯', label: '첫 기록',     desc: '공부 기록을 처음으로 완료하세요'          },
  { key: 'streak3',       icon: '🔥', label: '3일 연속',    desc: '3일 이상 연속으로 학습을 완료하세요'      },
  { key: 'hardChallenge', icon: '⚡', label: '어려움 도전', desc: '어려움 난이도 공부를 5번 완료하세요'      },
  { key: 'levelMaster',   icon: '👑', label: '레벨 마스터', desc: '총 XP 1,500 이상을 획득하세요 (Lv.3)'    },
];

export default function InfoPanel() {
  const studies    = useStudies();
  const characters = useCharacter();

  if (studies === undefined || characters === undefined) return null;

  const character = characters[0] ?? null;
  const { level, badges } = computeStats(studies, character?.job ?? null);

  return (
    <div id="info-section" className="mx-4 mb-4 space-y-3">
      {/* 뱃지 획득 조건 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

      {/* 레벨 칭호 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
    </div>
  );
}
