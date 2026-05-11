import { useMemo } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement, LineElement, PointElement,
  ArcElement,
  Title, Tooltip, Legend,
);

/* 차트 전역 다크 테마 */
ChartJS.defaults.color = '#8892b0';
ChartJS.defaults.borderColor = 'rgba(15,52,96,0.6)';

const toHours = (minutes) => Math.round(minutes / 6) / 10;

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const CHART_TITLE_STYLE = { color: '#e0e0e0', font: { size: 14, weight: 'bold' } };
const LEGEND_STYLE = { position: 'bottom', labels: { padding: 16, font: { size: 12 }, color: '#8892b0' } };
const SCALE_Y = {
  beginAtZero: true,
  ticks: { callback: v => `${v}시간`, color: '#8892b0' },
  grid: { color: 'rgba(15,52,96,0.6)' },
};
const SCALE_X = { grid: { display: false }, ticks: { color: '#8892b0' } };

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

const MONTHLY_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: '월별 공부시간 비교', ...CHART_TITLE_STYLE },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}시간` } },
  },
  scales: { y: SCALE_Y, x: SCALE_X },
};

export default function StatsPanel() {
  const allStudies = useStudies();
  const subjects   = useSubjects() ?? [];
  const studies    = useMemo(() => allStudies?.filter(s => s.status === 'completed') ?? [], [allStudies]);

  const pieData = useMemo(() => {
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
        borderColor: '#16213e',
      }],
    };
  }, [studies, subjects]);

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
        pointBorderColor: '#16213e',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }],
    };
  }, [studies]);

  const monthlyData = useMemo(() => {
    const currentMonth = monthStr();
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return monthStr(d);
    });
    const minutesByMonth = {};
    for (const s of studies) {
      const m = s.date.slice(0, 7);
      minutesByMonth[m] = (minutesByMonth[m] ?? 0) + s.minutes;
    }
    return {
      labels: last6.map(m => {
        const [y, mo] = m.split('-');
        return `${y.slice(2)}년 ${parseInt(mo)}월`;
      }),
      datasets: [{
        data: last6.map(m => toHours(minutesByMonth[m] ?? 0)),
        backgroundColor: last6.map(m =>
          m === currentMonth ? '#7c3aed' : 'rgba(124,58,237,0.35)'
        ),
        borderRadius: 6,
        borderSkipped: false,
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
            <Bar data={monthlyData} options={MONTHLY_OPTIONS} />
          </div>
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
