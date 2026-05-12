import { useState, useRef, useEffect } from 'react';
import { useStudies, useQuests, useCharacter, useCoin } from '../hooks/useStudies';
import { computeStats, JOB_MULT, ACHIEVEMENTS } from '../utils/xp';
import { db } from '../db/db';
import InfoPanel from './InfoPanel';

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

export default function StatusPanel() {
  const studies    = useStudies();
  const quests     = useQuests();
  const characters = useCharacter();
  const coin       = useCoin();

  // Level-up modal
  const [levelUpModal, setLevelUpModal] = useState(false);
  const prevLevelRef  = useRef(null);
  const levelTimerRef = useRef(null);

  // InfoPanel modal
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTab,  setInfoTab]  = useState('level');

  // Achievement popup
  const [achieveQueue, setAchieveQueue] = useState([]);
  const [achievePopup, setAchievePopup] = useState(null);
  const achieveTimerRef = useRef(null);

  const character          = (characters ?? [])[0] ?? null;
  const savedAchievements  = JSON.parse(character?.unlockedAchievements ?? '[]');
  const availableCoins     = (coin ?? 0) - (character?.spentCoins ?? 0);
  const { totalXP, todayXP, streak, level, levelName, progress, remaining, achievements } =
    computeStats(studies ?? [], quests ?? [], character?.job ?? null, savedAchievements);

  // Level-up detection
  useEffect(() => {
    if (studies === undefined) return;
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setLevelUpModal(true);
      clearTimeout(levelTimerRef.current);
      levelTimerRef.current = setTimeout(() => setLevelUpModal(false), 3000);
    }
    prevLevelRef.current = level;
    return () => clearTimeout(levelTimerRef.current);
  }, [level, studies]);

  // Achievement detection
  const dataReady = studies !== undefined && quests !== undefined && characters !== undefined;
  const achieveKey = dataReady
    ? ACHIEVEMENTS.map(a => achievements[a.id] ? '1' : '0').join('')
    : '';

  useEffect(() => {
    if (!achieveKey || !character) return;

    // First run: unlockedAchievements doesn't exist yet — save silently, no popup
    if (character.unlockedAchievements === undefined) {
      const currentIds = ACHIEVEMENTS.filter(a => achievements[a.id]).map(a => a.id);
      db.characters.update(character.id, { unlockedAchievements: JSON.stringify(currentIds) });
      return;
    }

    const savedIds = new Set(JSON.parse(character.unlockedAchievements));
    const newOnes  = ACHIEVEMENTS.filter(a => achievements[a.id] && !savedIds.has(a.id));
    if (newOnes.length === 0) return;

    const allIds = [...savedIds, ...newOnes.map(a => a.id)];
    db.characters.update(character.id, { unlockedAchievements: JSON.stringify(allIds) });
    setAchieveQueue(prev => [...prev, ...newOnes]);
  }, [achieveKey]); // eslint-disable-line

  // Achievement dequeue
  useEffect(() => {
    if (achievePopup !== null || achieveQueue.length === 0) return;
    const [next, ...rest] = achieveQueue;
    setAchievePopup(next);
    setAchieveQueue(rest);
    clearTimeout(achieveTimerRef.current);
    achieveTimerRef.current = setTimeout(() => setAchievePopup(null), 3000);
  }, [achievePopup, achieveQueue]);

  useEffect(() => () => {
    clearTimeout(levelTimerRef.current);
    clearTimeout(achieveTimerRef.current);
  }, []);

  function closeLevelModal() {
    clearTimeout(levelTimerRef.current);
    setLevelUpModal(false);
  }

  function closeAchievePopup() {
    clearTimeout(achieveTimerRef.current);
    setAchievePopup(null);
  }

  if (studies === undefined || quests === undefined || characters === undefined || coin === undefined) return null;

  const achievedCount = ACHIEVEMENTS.filter(a => achievements[a.id]).length;

  return (
    <>
    {/* 레벨업 모달 */}
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

          <div className="h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-white/50 rounded-full"
              style={{ animation: 'countdown 3s linear forwards' }}
            />
          </div>

          <button
            onClick={closeLevelModal}
            className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-medium transition-colors text-sm"
          >
            확인
          </button>
        </div>
      </div>
    )}

    {/* 업적 달성 팝업 */}
    {achievePopup && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div
          className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl text-center"
          style={{ animation: 'levelup-popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <div className="text-5xl mb-2">{achievePopup.icon}</div>
          <p className="text-sm font-medium text-yellow-100 mb-1">업적 달성!</p>
          <h2 className="text-xl font-bold mb-1">{achievePopup.name}</h2>
          <p className="text-sm text-yellow-200 mb-4">{achievePopup.desc}</p>
          <div className="bg-white/20 rounded-xl px-4 py-2 mb-4">
            <p className="text-lg font-bold text-yellow-200">+{achievePopup.xp} XP</p>
          </div>
          {achieveQueue.length > 0 && (
            <p className="text-xs text-yellow-200 mb-3">+{achieveQueue.length}개 추가 업적 대기 중</p>
          )}
          <div className="h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-white/50 rounded-full"
              style={{ animation: 'countdown 3s linear forwards' }}
            />
          </div>
          <button
            onClick={closeAchievePopup}
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
          <span className="ml-auto text-sm font-bold text-yellow-300">🪙 {availableCoins}</span>
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
            onClick={() => { setInfoTab('level'); setInfoOpen(true); }}
            title="레벨 · 업적 정보 보기"
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

      {/* 업적 요약 */}
      <div
        className="border-t border-white/10 pt-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => { setInfoTab('achieve'); setInfoOpen(true); }}
        title="업적 목록 보기"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-indigo-300 tracking-wider uppercase">업적</span>
          <span className="text-sm font-bold text-white">
            {achievedCount}
            <span className="text-indigo-300 font-normal text-xs"> / {ACHIEVEMENTS.length}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ACHIEVEMENTS.map(a => (
            <span
              key={a.id}
              className={`text-lg transition-opacity${achievements[a.id] ? '' : ' opacity-20'}`}
              title={a.name}
            >
              {a.icon}
            </span>
          ))}
        </div>
      </div>
    </div>

    <InfoPanel open={infoOpen} onClose={() => setInfoOpen(false)} defaultTab={infoTab} />
    </>
  );
}
