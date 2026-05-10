import { useEffect } from 'react';
import { initDB } from './db/db';
import StatusPanel from './components/StatusPanel';
import StudyCalendar from './components/StudyCalendar';
import StatsPanel from './components/StatsPanel';
import SettingsPanel from './components/SettingsPanel';
import InfoPanel from './components/InfoPanel';

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
      <InfoPanel />
    </div>
  );
}
