import { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useStudies, useSubjects } from '../hooks/useStudies';
import WeeklyReport from './WeeklyReport';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

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

const BAR_OPTIONS = {
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: '과목별 총 공부시간', font: { size: 14, weight: 'bold' } },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x}분` } },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { callback: v => `${v}분` },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    y: { grid: { display: false } },
  },
};

const LINE_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: '최근 7일 일별 공부시간', font: { size: 14, weight: 'bold' } },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}분` } },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: v => `${v}분` },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: { grid: { display: false } },
  },
};

const MONTHLY_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: '월별 공부시간 비교', font: { size: 14, weight: 'bold' } },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}분` } },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: v => `${v}분` },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: { grid: { display: false } },
  },
};

export default function StatsPanel() {
  const allStudies = useStudies();
  const subjects   = useSubjects() ?? [];
  const studies    = useMemo(() => allStudies?.filter(s => s.completed) ?? [], [allStudies]);

  const barData = useMemo(() => {
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
        borderRadius: 6,
        borderSkipped: false,
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
        data: last7.map(d => minutesByDate[d] ?? 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
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
        data: last6.map(m => minutesByMonth[m] ?? 0),
        backgroundColor: last6.map(m =>
          m === currentMonth ? '#6366f1' : 'rgba(99,102,241,0.3)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    };
  }, [studies]);

  if (allStudies === undefined) return null;

  return (
    <div className="mx-4 my-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-800 px-1">학습 통계</h2>

      <WeeklyReport />

      {studies.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-200">
          아직 완료된 공부 기록이 없습니다
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Bar data={monthlyData} options={MONTHLY_OPTIONS} />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Line data={lineData} options={LINE_OPTIONS} />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Bar data={barData} options={BAR_OPTIONS} />
          </div>
        </>
      )}
    </div>
  );
}
