import { useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useStudies, useSubjects } from '../hooks/useStudies';
import WeeklyReport from './WeeklyReport';

ChartJS.register(
  CategoryScale, LinearScale,
  LineElement, PointElement,
  ArcElement,
  Title, Tooltip, Legend,
);

/* 차트 전역 밝은 테마 */
ChartJS.defaults.color = '#4a7a5a';
ChartJS.defaults.borderColor = 'rgba(167,243,208,0.6)';

const toHours = (minutes) => Math.round(minutes / 6) / 10;

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


const CHART_TITLE_STYLE = { color: '#1a3a2a', font: { size: 14, weight: 'bold' } };
const LEGEND_STYLE = { position: 'bottom', labels: { padding: 16, font: { size: 12 }, color: '#4a7a5a' } };
const SCALE_Y = {
  beginAtZero: true,
  ticks: { callback: v => `${v}시간`, color: '#4a7a5a' },
  grid: { color: 'rgba(167,243,208,0.5)' },
};
const SCALE_X = { grid: { display: false }, ticks: { color: '#4a7a5a' } };

const PIE_OPTIONS = {
  responsive: true,
  plugins: {
    legend: LEGEND_STYLE,
    title: { display: true, text: '과목별 공부 비율', ...CHART_TITLE_STYLE },
    tooltip: {
      callbacks: {
        label: ctx => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
          return ` ${ctx.label}: ${toHours(ctx.parsed)}시간 (${pct}%)`;
        },
      },
    },
  },
};

const LINE_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: '최근 7일 일별 공부시간', ...CHART_TITLE_STYLE },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}시간` } },
  },
  scales: { y: SCALE_Y, x: SCALE_X },
};


export default function StatsPanel() {
  const allStudies  = useStudies();
  const subjectsRaw = useSubjects();
  const studies     = useMemo(() => allStudies?.filter(s => s.status === 'completed') ?? [], [allStudies]);

  const pieData = useMemo(() => {
    const subjects = subjectsRaw ?? [];
    const minutesBySubject = {};
    for (const s of studies) {
      minutesBySubject[s.subject] = (minutesBySubject[s.subject] ?? 0) + s.minutes;
    }
    const active = subjects.filter(s => minutesBySubject[s.name]);
    return {
      labels: active.map(s => s.name),
      datasets: [{
        data: active.map(s => minutesBySubject[s.name]),
        backgroundColor: active.map(s => s.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    };
  }, [studies, subjectsRaw]);

  const lineData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return localDateStr(d);
    });
    const minutesByDate = {};
    for (const s of studies) {
      minutesByDate[s.date] = (minutesByDate[s.date] ?? 0) + s.minutes;
    }
    return {
      labels: last7.map(d => d.slice(5)),
      datasets: [{
        data: last7.map(d => toHours(minutesByDate[d] ?? 0)),
        borderColor: '#f0a500',
        backgroundColor: 'rgba(240,165,0,0.08)',
        pointBackgroundColor: '#f0a500',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }],
    };
  }, [studies]);


  if (allStudies === undefined) return null;

  return (
    <div className="mx-4 my-4 space-y-4">
      <h2 className="text-lg font-bold text-rpg-text px-1">학습 통계</h2>

      <WeeklyReport />

      {studies.length === 0 ? (
        <div className="bg-rpg-card rounded-2xl p-10 text-center text-rpg-muted border border-dashed border-rpg-border">
          아직 완료된 공부 기록이 없습니다
        </div>
      ) : (
        <>
          <div className="bg-rpg-card rounded-2xl p-5 shadow-lg border border-rpg-border">
            <Line data={lineData} options={LINE_OPTIONS} />
          </div>
          <div className="bg-rpg-card rounded-2xl p-5 shadow-lg border border-rpg-border">
            <Pie data={pieData} options={PIE_OPTIONS} />
          </div>
        </>
      )}
    </div>
  );
}
