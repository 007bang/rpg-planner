import { useState, useEffect } from 'react';
import { useStudies, useQuests, useCharacter } from '../hooks/useStudies';
import { computeStats, ACHIEVEMENTS } from '../utils/xp';

const LEVEL_INFO = [
  { level: 1,  name: '견습 모험가',   range: '0 ~ 199 XP'         },
  { level: 2,  name: '초보 학습자',   range: '200 ~ 499 XP'       },
  { level: 3,  name: '성실한 학습자', range: '500 ~ 999 XP'       },
  { level: 4,  name: '숙련된 탐구자', range: '1,000 ~ 1,499 XP'  },
  { level: 5,  name: '지식의 수호자', range: '1,500 ~ 2,499 XP'  },
  { level: 6,  name: '현명한 전략가', range: '2,500 ~ 3,999 XP'  },
  { level: 7,  name: '전설의 학자',   range: '4,000 ~ 5,999 XP'  },
  { level: 8,  name: '마스터',        range: '6,000 ~ 8,999 XP'  },
  { level: 9,  name: '그랜드마스터',  range: '9,000 ~ 11,999 XP' },
  { level: 10, name: '시험의 전설',   range: '12,000 XP 이상'    },
];

const TABS = [
  { id: 'level',   label: '레벨 칭호' },
  { id: 'achieve', label: '업적'      },
];

export default function InfoPanel({ open, onClose, defaultTab = 'level' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const studies    = useStudies();
  const quests     = useQuests();
  const characters = useCharacter();

  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  const character         = (characters ?? [])[0] ?? null;
  const savedAchievements = JSON.parse(character?.unlockedAchievements ?? '[]');
  const { level, achievements } = computeStats(studies ?? [], quests ?? [], character?.job ?? null, savedAchievements);
  const categories    = [...new Set(ACHIEVEMENTS.map(a => a.category))];
  const achievedCount = ACHIEVEMENTS.filter(a => achievements[a.id]).length;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50${open ? '' : ' hidden'}`}
      onClick={onClose}
    >
      <div
        className="bg-rpg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rpg-border flex-shrink-0">
          <h2 className="text-base font-bold text-rpg-text">레벨 & 업적</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-rpg-muted hover:text-rpg-text hover:bg-rpg-border transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex px-4 pt-3 gap-1 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-rpg-purple text-white'
                  : 'text-rpg-muted hover:text-rpg-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {activeTab === 'level' && (
            <div className="rounded-xl border border-rpg-border overflow-hidden">
              <div className="divide-y divide-rpg-border/40">
                {LEVEL_INFO.map(info => {
                  const isCurrent = level === info.level;
                  return (
                    <div
                      key={info.level}
                      className={`flex items-center gap-3 px-4 py-3${isCurrent ? ' bg-rpg-green/10' : ' opacity-35'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0${isCurrent ? ' bg-rpg-purple text-white' : ' bg-rpg-border text-rpg-muted'}`}>
                        {info.level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold${isCurrent ? ' text-rpg-text' : ' text-rpg-muted'}`}>{info.name}</p>
                        <p className={`text-xs mt-0.5${isCurrent ? ' text-rpg-muted' : ' text-rpg-muted/60'}`}>{info.range}</p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs font-medium text-rpg-purple bg-rpg-purple/20 px-2 py-0.5 rounded-full flex-shrink-0">
                          현재
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'achieve' && (
            <>
              <p className="text-xs text-rpg-muted text-right">{achievedCount} / {ACHIEVEMENTS.length} 달성</p>
              {categories.map(cat => (
                <div key={cat} className="rounded-xl border border-rpg-border overflow-hidden">
                  <div className="px-4 py-2 bg-rpg-border/30">
                    <p className="text-xs font-semibold text-rpg-muted">{cat}</p>
                  </div>
                  <div className="divide-y divide-rpg-border/40">
                    {ACHIEVEMENTS.filter(a => a.category === cat).map(ach => (
                      <div
                        key={ach.id}
                        className={`flex items-center gap-3 px-4 py-3${achievements[ach.id] ? '' : ' opacity-30'}`}
                      >
                        <span className="text-xl flex-shrink-0">{ach.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-rpg-text">{ach.name}</p>
                          <p className="text-xs text-rpg-muted mt-0.5">{ach.desc}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs font-bold text-rpg-gold">+{ach.xp} XP</span>
                          {achievements[ach.id] && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              달성
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
