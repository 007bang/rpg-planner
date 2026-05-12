import { useState, useEffect, useRef } from 'react';
import { initDB, db } from './db/db';
import { useCharacter, useSubjects } from './hooks/useStudies';
import { useToast } from './hooks/useToast';
import { useTimer } from './hooks/useTimer';
import { JOB_MULT, DEFAULT_MULT } from './utils/xp';
import { applyTheme } from './constants/themes';
import NavBar from './components/NavBar';
import ClassroomCanvas from './components/ClassroomCanvas';
import AddStudyModal from './components/AddStudyModal';
import StatusPanel from './components/StatusPanel';
import DdayBanner from './components/DdayBanner';
import StudyCalendar from './components/StudyCalendar';
import StatsPanel from './components/StatsPanel';
import QuestPanel from './components/QuestPanel';
import CharacterStatPanel from './components/CharacterStatPanel';
import ShopPanel from './components/ShopPanel';
import SettingsPanel from './components/SettingsPanel';
import InfoPanel from './components/InfoPanel';
import CharacterSetup from './components/CharacterSetup';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  useEffect(() => { initDB(); }, []);

  const characters        = useCharacter();
  const subjects          = useSubjects() ?? [];
  const { elapsed, isRunning, start, pause, reset } = useTimer();
  const [timerModal, setTimerModal] = useState({ open: false, key: 0, minutes: 0 });
  const { msg: toastMsg, show: showToast } = useToast();
  const attendanceChecked = useRef(false);
  const [xpFloat, setXpFloat] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTab,  setInfoTab]  = useState('level');

  function handleOpenInfo(tab) {
    setInfoTab(tab);
    setInfoOpen(true);
  }

  function handleStudyComplete({ minutes, difficulty }) {
    const job = characters?.[0]?.job ?? null;
    const mult = (job && JOB_MULT[job]) ? JOB_MULT[job] : DEFAULT_MULT;
    const xp = Math.round(minutes * (mult[difficulty] ?? 1.0));
    setXpFloat({ amount: xp, key: Date.now() });
  }

  useEffect(() => {
    applyTheme(characters?.[0] ?? null);
  }, [characters]);

  useEffect(() => {
    if (!characters?.length || attendanceChecked.current) return;
    attendanceChecked.current = true;
    const character = characters[0];
    const today = todayStr();
    if (character.lastVisitDate !== today) {
      db.characters.update(character.id, {
        lastVisitDate: today,
        bonusCoins: (character.bonusCoins ?? 0) + 1,
      });
      showToast('🎊 출석 완료! 🪙+1 코인 획득!');
    }
  }, [characters, showToast]);

  function handleTimerReset() {
    if (elapsed > 0) {
      const minutes = Math.max(1, Math.round(elapsed / 60));
      reset();
      setTimerModal(prev => ({ open: true, key: prev.key + 1, minutes }));
    } else {
      reset();
    }
  }

  async function handleTimerStudySave({ subject, difficulty, minutes, memo }) {
    await db.studies.add({
      eventId:    String(Date.now()),
      date:       todayStr(),
      subject,
      difficulty,
      minutes,
      memo,
      status:     'pending',
    });
    setTimerModal(prev => ({ ...prev, open: false }));
  }

  if (characters === undefined) return null;
  if (characters.length === 0) return <CharacterSetup />;

  return (
    <>
      <NavBar timerElapsed={elapsed} timerRunning={isRunning} />
      <div className="max-w-2xl mx-auto pb-16 flex flex-col gap-12">
        <div className="pt-4">
          <ClassroomCanvas
            elapsed={elapsed}
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={handleTimerReset}
          />
        </div>
        <div id="section-status">
          <StatusPanel onOpenInfo={handleOpenInfo} />
          <DdayBanner />
        </div>
        <div id="section-calendar">
          <StudyCalendar onStudyComplete={handleStudyComplete} />
        </div>
        <div id="section-quest">
          <QuestPanel />
        </div>
        <div id="section-char-stat">
          <CharacterStatPanel />
        </div>
        <div id="section-charts">
          <StatsPanel />
        </div>
        <div id="section-shop">
          <ShopPanel />
        </div>
        <div id="section-settings">
          <SettingsPanel />
        </div>
      </div>
      <InfoPanel open={infoOpen} onClose={() => setInfoOpen(false)} defaultTab={infoTab} />
      <AddStudyModal
        key={timerModal.key}
        open={timerModal.open}
        date={todayStr()}
        subjects={subjects}
        onSave={handleTimerStudySave}
        onClose={() => setTimerModal(prev => ({ ...prev, open: false }))}
        initialValues={{ minutes: timerModal.minutes }}
      />
      {xpFloat && (
        <div
          key={xpFloat.key}
          className="fixed left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-2xl pointer-events-none z-50 drop-shadow-lg"
          style={{ top: '120px', animation: 'xp-float 1s ease-out forwards' }}
          onAnimationEnd={() => setXpFloat(null)}
        >
          +{xpFloat.amount} XP
        </div>
      )}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-rpg-border text-rpg-text text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap border border-rpg-border">
          {toastMsg}
        </div>
      )}
    </>
  );
}
