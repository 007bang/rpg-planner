import { useState, useRef, useEffect } from 'react';
import { useStudies, useCharacter, useCoin } from '../hooks/useStudies';
import { computeStats, JOB_MULT } from '../utils/xp';

const BADGE_LIST = [
  { key: 'firstRecord',   icon: '🎯', label: '첫 기록'     },
  { key: 'streak3',       icon: '🔥', label: '3일 연속'    },
  { key: 'hardChallenge', icon: '⚡', label: '어려움 도전' },
  { key: 'levelMaster',   icon: '👑', label: '레벨 마스터' },
];

const JOB_ICONS  = { warrior: '⚔️', mage: '🧙', archer: '🏹' };
const JOB_LABELS = { warrior: '전사', mage: '마법사', archer: '궁수' };

const LEVELUP_LINES = {
  warrior: {
    2:  '좋아, 이제 좀 쓸 만해졌군!',
    3:  '연습을 거듭할수록 칼날이 빛을 발한다!',
    4:  '강함은 노력에서 나온다. 계속 나아가자!',
    5:  '절반은 왔다! 멈출 이유가 없어!',
    6:  '전략 없이는 용기도 소용없지. 나는 둘 다 갖췄다!',
    7:  '전설이라 불릴 자격이 생겼군... 아직 만족 못 해!',
    8:  '이 정도면 마스터라 불러도 되겠지?',
    9:  '그랜드마스터! 어떤 시험도 두렵지 않아!',
    10: '나는 이제 시험의 전설이다! 아무도 막을 수 없어!',
  },
  mage: {
    2:  '지식의 첫 장이 펼쳐지는군...',
    3:  '학문의 깊이는 끝이 없지. 계속 파헤쳐야 해.',
    4:  '숙련됨이란 반복에서 비롯되는 것...',
    5:  '지식이 쌓일수록 마법도 강해지는 법...',
    6:  '전략적 사고가 모든 것을 꿰뚫는다.',
    7:  '전설의 학자로 거듭났군. 탐구를 멈추지 않겠어.',
    8:  '이제 마스터의 경지에 올랐다. 완벽에 가까워지고 있어.',
    9:  '그랜드마스터... 모든 학문이 내 손 안에 있어.',
    10: '모든 지식을 통달했다. 나는 시험의 전설이다!',
  },
  archer: {
    2:  '조준이 조금 더 정확해졌어!',
    3:  '꾸준함이 명중률을 높이는 법이야.',
    4:  '목표를 향한 집중력이 올라가고 있어!',
    5:  '집중력이 높아졌어! 목표를 절대 놓치지 않겠어!',
    6:  '전략적으로 화살을 쏘면 어떤 문제도 맞힐 수 있어.',
    7:  '전설의 학자 칭호... 내 화살은 더 정확해졌어.',
    8:  '마스터! 빗나가는 화살은 이제 없어!',
    9:  '그랜드마스터... 어떤 문제도 내 사정거리 안에 있어.',
    10: '어떤 문제도 내 화살을 피할 수 없다!',
  },
};

function scrollToInfo() {
  document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth' });
}

export default function StatusPanel() {
  const studies    = useStudies();
  const characters = useCharacter();
  const coin       = useCoin();

  const [levelUpModal, setLevelUpModal] = useState(false);
  const prevLevelRef = useRef(null);
  const timerRef     = useRef(null);

  const character = (characters ?? [])[0] ?? null;
  const { totalXP, todayXP, streak, level, levelName, progress, remaining, badges } =
    computeStats(studies ?? [], character?.job ?? null);

  useEffect(() => {
    if (studies === undefined) return;
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setLevelUpModal(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLevelUpModal(false), 3000);
    }
    prevLevelRef.current = level;
    return () => clearTimeout(timerRef.current);
  }, [level, studies]);

  function closeModal() {
    clearTimeout(timerRef.current);
    setLevelUpModal(false);
  }

  if (studies === undefined || characters === undefined || coin === undefined) return null;

  return (
    <>
    {/* 레벨업 축하 모달 */}
    {levelUpModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div
          className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl text-center"
          style={{ animation: 'levelup-popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold mb-1">레벨업!</h2>
          <p className="text-indigo-200 text-sm mb-4">새로운 칭호를 획득했습니다</p>

          <div className="bg-white/15 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-indigo-300 mb-0.5">새 칭호</p>
            <p className="text-xl font-bold">Lv.{level} {levelName}</p>
          </div>

          {character && LEVELUP_LINES[character.job]?.[level] && (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl shrink-0">{character.avatar ?? JOB_ICONS[character.job]}</span>
              <div className="relative bg-white/20 rounded-2xl px-4 py-3 flex-1 text-left">
                <div
                  className="absolute -left-2 bottom-3 w-0 h-0"
                  style={{
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '8px solid rgba(255,255,255,0.2)',
                  }}
                />
                <p className="text-sm font-medium text-white leading-snug">
                  &ldquo;{LEVELUP_LINES[character.job][level]}&rdquo;
                </p>
              </div>
            </div>
          )}

          {character && JOB_MULT[character.job] && (
            <div className="bg-white/15 rounded-xl px-4 py-3 mb-4 text-left">
              <p className="text-xs text-indigo-300 mb-2">
                {JOB_ICONS[character.job]} {JOB_LABELS[character.job]} 직업 배율
              </p>
              <div className="space-y-1 text-sm">
                {[['hard', '어려움'], ['normal', '보통'], ['easy', '쉬움']].map(([key, label]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-indigo-200">{label}</span>
                    <span className="font-bold text-yellow-300">×{JOB_MULT[character.job][key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3초 카운트다운 바 */}
          <div className="h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-white/50 rounded-full"
              style={{ animation: 'countdown 3s linear forwards' }}
            />
          </div>

          <button
            onClick={closeModal}
            className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-medium transition-colors text-sm"
          >
            확인
          </button>
        </div>
      </div>
    )}

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
            {level < 10
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
    </>
  );
}
