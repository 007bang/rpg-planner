import { useState, useEffect } from 'react';
import { initDB, db } from './db/db';
import { useCharacter, useSubjects } from './hooks/useStudies';
import { useTimer } from './hooks/useTimer';
import NavBar from './components/NavBar';
import StudyTimer from './components/StudyTimer';
import ClassroomCanvas from './components/ClassroomCanvas';
import AddStudyModal from './components/AddStudyModal';
import StatusPanel from './components/StatusPanel';
import DdayBanner from './components/DdayBanner';
import StudyCalendar from './components/StudyCalendar';
import StatsPanel from './components/StatsPanel';
import QuestPanel from './components/QuestPanel';
import CharacterStatPanel from './components/CharacterStatPanel';
import SettingsPanel from './components/SettingsPanel';
import InfoPanel from './components/InfoPanel';
import CharacterSetup from './components/CharacterSetup';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  useEffect(() => { initDB(); }, []);

  const characters = useCharacter();
  const subjects   = useSubjects() ?? [];
  const { elapsed, isRunning, start, pause, reset } = useTimer();
  const [timerModal, setTimerModal] = useState({ open: false, key: 0, minutes: 0 });

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
      <div className="max-w-2xl mx-auto pb-16">
        <div id="section-status" className="pt-4 scroll-mt-16">
          <StatusPanel />
          <DdayBanner />
        </div>
        <StudyTimer
          elapsed={elapsed}
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={handleTimerReset}
        />
        <ClassroomCanvas />
        <div id="section-calendar" className="mt-8 scroll-mt-16">
          <StudyCalendar />
        </div>
        <div id="section-quest" className="mt-16 scroll-mt-16">
          <QuestPanel />
        </div>
        <div id="section-char-stat" className="mt-16 scroll-mt-16">
          <CharacterStatPanel />
        </div>
        <div id="section-settings" className="mt-16 scroll-mt-16">
          <SettingsPanel />
        </div>
        <div id="section-charts" className="mt-16 scroll-mt-16">
          <StatsPanel />
          <InfoPanel />
        </div>
      </div>
      <AddStudyModal
        key={timerModal.key}
        open={timerModal.open}
        date={todayStr()}
        subjects={subjects}
        onSave={handleTimerStudySave}
        onClose={() => setTimerModal(prev => ({ ...prev, open: false }))}
        initialValues={{ minutes: timerModal.minutes }}
      />
    </>
  );
}
