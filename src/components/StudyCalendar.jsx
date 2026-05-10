import { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { db } from '../db/db';
import { useStudies, useSubjects, useExams } from '../hooks/useStudies';
import AddStudyModal from './AddStudyModal';
import EventPopup from './EventPopup';
import AddExamModal from './AddExamModal';
import ExamPopup from './ExamPopup';

// 2025~2026 한국 법정공휴일
const HOLIDAYS = new Set([
  // 2025
  '2025-01-01', // 신정
  '2025-01-28', // 설날 연휴
  '2025-01-29', // 설날
  '2025-01-30', // 설날 연휴
  '2025-03-01', // 삼일절 (토)
  '2025-03-03', // 삼일절 대체공휴일 (토→월)
  '2025-05-05', // 어린이날 · 부처님오신날
  '2025-05-06', // 대체공휴일
  '2025-06-03', // 대통령선거일 (조기 대선)
  '2025-06-06', // 현충일
  '2025-07-17', // 제헌절
  '2025-08-15', // 광복절
  '2025-10-03', // 개천절
  '2025-10-05', // 추석 연휴 (일)
  '2025-10-06', // 추석
  '2025-10-07', // 추석 연휴
  '2025-10-08', // 추석 대체공휴일 (일→수)
  '2025-10-09', // 한글날
  '2025-12-25', // 성탄절
  // 2026
  '2026-01-01', // 신정
  '2026-02-16', // 설날 연휴
  '2026-02-17', // 설날
  '2026-02-18', // 설날 연휴
  '2026-03-01', // 삼일절 (일)
  '2026-03-02', // 삼일절 대체공휴일 (일→월)
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님오신날 (일)
  '2026-05-25', // 부처님오신날 대체공휴일 (일→월)
  '2026-06-03', // 지방선거일
  '2026-06-06', // 현충일 (토)
  '2026-07-17', // 제헌절
  '2026-08-15', // 광복절 (토)
  '2026-08-17', // 광복절 대체공휴일 (토→월)
  '2026-09-24', // 추석 연휴
  '2026-09-25', // 추석
  '2026-09-26', // 추석 연휴
  '2026-10-03', // 개천절 (토)
  '2026-10-05', // 개천절 대체공휴일 (토→월)
  '2026-10-09', // 한글날
  '2026-12-25', // 성탄절
]);

const ABBR = { '수학': '수', '영어': '영', '국어': '국', '과학': '과' };
const getAbbr = (name) => ABBR[name] ?? name.charAt(0);

function studyToEvent(study, subjects) {
  const subject = subjects.find(s => s.name === study.subject);
  const color = subject?.color ?? '#6B7280';
  const abbr = getAbbr(study.subject);
  const status = study.status ?? 'pending';

  const title =
    status === 'completed' ? `✓ ${abbr}` :
    status === 'studying'  ? `▶ ${abbr}` :
    abbr;

  return {
    id: study.eventId,
    title,
    start: study.date,
    backgroundColor: color,
    borderColor: status === 'studying' ? '#ffffff' : color,
    textColor: '#ffffff',
    extendedProps: {
      type:        'study',
      studyId:     study.id,
      status,
      subjectName: study.subject,
      difficulty:  study.difficulty,
      minutes:     study.minutes,
      memo:        study.memo ?? '',
      date:        study.date,
    },
  };
}

function examToEvent(exam) {
  return {
    id: `exam-${exam.id}`,
    title: `📝 ${exam.subject}`,
    start: exam.date,
    backgroundColor: '#111827',
    borderColor: '#111827',
    textColor: '#ffffff',
    editable: false,
    extendedProps: {
      type:    'exam',
      examId:  exam.id,
      subject: exam.subject,
      range:   exam.range ?? '',
      date:    exam.date,
    },
  };
}

const MODAL_CLOSED      = { open: false, date: '', key: 0, editStudyId: null, initialValues: null };
const POPUP_CLOSED      = { open: false, extendedProps: null, position: null };
const EXAM_MODAL_CLOSED = { open: false, date: '', key: 0 };
const EXAM_POPUP_CLOSED = { open: false, extendedProps: null, position: null };

export default function StudyCalendar() {
  const subjects = useSubjects() ?? [];
  const studies  = useStudies()  ?? [];
  const exams    = useExams()    ?? [];

  const fcEvents = useMemo(
    () => [
      ...studies.map(s => studyToEvent(s, subjects)),
      ...exams.map(e => examToEvent(e)),
    ],
    [studies, subjects, exams],
  );

  const [modalState,     setModalState]     = useState(MODAL_CLOSED);
  const [popupState,     setPopupState]     = useState(POPUP_CLOSED);
  const [examModalState, setExamModalState] = useState(EXAM_MODAL_CLOSED);
  const [examPopupState, setExamPopupState] = useState(EXAM_POPUP_CLOSED);

  const longPressRef = useRef({ timer: null, fired: false });

  function handleWrapperPointerDown(e) {
    if (e.target.closest('.fc-event')) return;
    const dayEl = e.target.closest('[data-date]');
    if (!dayEl) return;
    const dateStr = dayEl.dataset.date;
    longPressRef.current.fired = false;
    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.fired = true;
      setExamModalState(prev => ({ open: true, date: dateStr, key: prev.key + 1 }));
    }, 600);
  }

  function handleWrapperPointerUp() {
    clearTimeout(longPressRef.current.timer);
  }

  function handleWrapperPointerMove() {
    clearTimeout(longPressRef.current.timer);
  }

  const handleDateClick = useCallback((arg) => {
    if (longPressRef.current.fired) {
      longPressRef.current.fired = false;
      return;
    }
    setModalState(prev => ({
      open: true, date: arg.dateStr, key: prev.key + 1,
      editStudyId: null, initialValues: null,
    }));
  }, []);

  const handleEventClick = useCallback((arg) => {
    const { clientX, clientY } = arg.jsEvent;
    const x = Math.min(clientX + 12, window.innerWidth - 232);
    const y = Math.min(Math.max(clientY - 20, 10), window.innerHeight - 300);

    if (arg.event.extendedProps.type === 'exam') {
      setExamPopupState({
        open: true,
        extendedProps: { ...arg.event.extendedProps },
        position: { x, y },
      });
    } else {
      setPopupState({
        open: true,
        extendedProps: { ...arg.event.extendedProps },
        position: { x, y },
      });
    }
  }, []);

  const handleEventDrop = useCallback(async (info) => {
    const { studyId } = info.event.extendedProps;
    const newDate = info.event.startStr.slice(0, 10);
    try {
      await db.studies.update(studyId, { date: newDate });
    } catch {
      info.revert();
    }
  }, []);

  const renderEventContent = useCallback((eventInfo) => {
    const { status, type } = eventInfo.event.extendedProps;
    const faded = type !== 'exam' && status === 'completed';
    return (
      <div className={`px-1 text-white text-xs font-bold truncate w-full leading-relaxed${faded ? ' opacity-50' : ''}`}>
        {eventInfo.event.title}
      </div>
    );
  }, []);

  const dayCellContent = useCallback((arg) => {
    const dow = arg.date.getDay();
    const dateStr = [
      arg.date.getFullYear(),
      String(arg.date.getMonth() + 1).padStart(2, '0'),
      String(arg.date.getDate()).padStart(2, '0'),
    ].join('-');

    let cls = '';
    if (dow === 0 || HOLIDAYS.has(dateStr)) cls = 'text-red-500';
    else if (dow === 6) cls = 'text-blue-500';

    return cls
      ? <span className={cls}>{arg.dayNumberText}</span>
      : <span>{arg.dayNumberText}</span>;
  }, []);

  async function handleSave({ subject, difficulty, minutes, memo }) {
    if (modalState.editStudyId) {
      await db.studies.update(modalState.editStudyId, { subject, difficulty, minutes, memo });
    } else {
      await db.studies.add({
        eventId:   String(Date.now()),
        date:      modalState.date,
        subject,
        difficulty,
        minutes,
        memo,
        status:    'pending',
      });
    }
    setModalState(MODAL_CLOSED);
  }

  async function handleSetStatus(newStatus) {
    await db.studies.update(popupState.extendedProps.studyId, { status: newStatus });
    setPopupState(POPUP_CLOSED);
  }

  async function handleDelete() {
    await db.studies.delete(popupState.extendedProps.studyId);
    setPopupState(POPUP_CLOSED);
  }

  function handleEdit() {
    const { studyId, subjectName, difficulty, minutes, memo, date } = popupState.extendedProps;
    setPopupState(POPUP_CLOSED);
    setModalState(prev => ({
      open: true,
      date,
      key: prev.key + 1,
      editStudyId: studyId,
      initialValues: { subject: subjectName, difficulty, minutes, memo },
    }));
  }

  async function handleExamSave({ subject, date, range }) {
    await db.exams.add({ subject, date, range });
    setExamModalState(EXAM_MODAL_CLOSED);
  }

  async function handleExamDelete() {
    await db.exams.delete(examPopupState.extendedProps.examId);
    setExamPopupState(EXAM_POPUP_CLOSED);
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setExamModalState(prev => ({ open: true, date: '', key: prev.key + 1 }))}
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          📝 시험 추가
        </button>
      </div>
      <div
        onPointerDown={handleWrapperPointerDown}
        onPointerUp={handleWrapperPointerUp}
        onPointerMove={handleWrapperPointerMove}
      >
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={koLocale}
          events={fcEvents}
          editable={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={renderEventContent}
          dayCellContent={dayCellContent}
          height="auto"
        />
      </div>
      <AddStudyModal
        key={modalState.key}
        open={modalState.open}
        date={modalState.date}
        subjects={subjects}
        onSave={handleSave}
        onClose={() => setModalState(MODAL_CLOSED)}
        initialValues={modalState.initialValues}
      />
      {popupState.open && (
        <EventPopup
          extendedProps={popupState.extendedProps}
          position={popupState.position}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onClose={() => setPopupState(POPUP_CLOSED)}
        />
      )}
      <AddExamModal
        key={`exam-${examModalState.key}`}
        open={examModalState.open}
        date={examModalState.date}
        subjects={subjects}
        onSave={handleExamSave}
        onClose={() => setExamModalState(EXAM_MODAL_CLOSED)}
      />
      {examPopupState.open && (
        <ExamPopup
          extendedProps={examPopupState.extendedProps}
          position={examPopupState.position}
          onDelete={handleExamDelete}
          onClose={() => setExamPopupState(EXAM_POPUP_CLOSED)}
        />
      )}
    </div>
  );
}
