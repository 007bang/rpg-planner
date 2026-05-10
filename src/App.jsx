import { useEffect } from 'react';
import { initDB } from './db/db';
import { useCharacter } from './hooks/useStudies';
import StatusPanel from './components/StatusPanel';
import DdayBanner from './components/DdayBanner';
import StudyCalendar from './components/StudyCalendar';
import StatsPanel from './components/StatsPanel';
import QuestPanel from './components/QuestPanel';
import SettingsPanel from './components/SettingsPanel';
import InfoPanel from './components/InfoPanel';
import CharacterSetup from './components/CharacterSetup';

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  const characters = useCharacter();

  if (characters === undefined) return null;
  if (characters.length === 0) return <CharacterSetup />;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <StatusPanel />
      <DdayBanner />
      <StudyCalendar />
      <StatsPanel />
      <QuestPanel />
      <SettingsPanel />
      <InfoPanel />
    </div>
  );
}
