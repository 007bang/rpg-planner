import { useEffect } from 'react';
import { initDB } from './db/db';
import StatusPanel from './components/StatusPanel';
import StudyCalendar from './components/StudyCalendar';
import StatsPanel from './components/StatsPanel';
import SettingsPanel from './components/SettingsPanel';
import SeedButton from './components/SeedButton';

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <StatusPanel />
      <StudyCalendar />
      <StatsPanel />
      <SettingsPanel />
      <SeedButton />
    </div>
  );
}
