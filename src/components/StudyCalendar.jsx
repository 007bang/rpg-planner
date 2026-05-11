import { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { db } from '../db/db';
import { useStudies, useSubjects, useExams, useQuests } from '../hooks/useStudies';
import AddStudyModal from './AddStudyModal';
import EventPopup from './EventPopup';
import AddExamModal from './AddExamModal';
import ExamPopup from './ExamPopup';
import QuestPopup from './QuestPopup';

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

const QUEST_BG     = { easy: '#22c55e26', normal: '#3b82f626', hard: '#ef444426' };
const QUEST_BORDER = { easy: '#22c55e',   normal: '#3b82f6',   hard: '#ef4444'   };
const QUEST_TEXT   = { easy: '#15803d',   normal: '#1d4ed8',   hard: '#b91c1c'   };

function questToEvent(quest) {
  return {
    id:              `quest-${quest.id}`,
    title:           `📋 ${quest.title}`,
    start:           quest.date,
    backgroundColor: QUEST_BG[quest.difficulty]     ?? '#6b728026',
    borderColor:     QUEST_BORDER[quest.difficulty]  ?? '#6b7280',
    editable:        false,
    extendedProps: {
      type:       'quest',
      questId:    quest.id,
      title:      quest.title,
      difficulty: quest.difficulty,
      coin:       quest.coin,
      status:     quest.status,
      date:       quest.date,
    },
  };
}

function studyToEvent(study, subjects) {
  const subject = subjects.find(s => s.name === study.subject);
  const color = subject?.color ?? '#6B7280';
  const status = study.status ?? 'pending';

  const title =
    status === 'completed' ? `✓ ${study.subject}` :
    status === 'studying'  ? `▶ ${study.subject}` :
    study.subject;

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

function examToEvent(exam, subjects) {
  const subject = subjects.find(s => s.name === exam.subject);
  const color = subject?.color ?? '#6B7280';
  return {
    id: `exam-${exam.id}`,
    title: `📝 ${exam.subject}`,
    start: exam.date,
    backgroundColor: color,
    borderColor: '#111827',
    textColor: '#ffffff',
    extendedProps: {
      type:    'exam',
      examId:  exam.id,
      subject: exam.subject,
      range:   exam.range ?? '',
      date:    exam.date,
    },
  };
}

const MODAL_CLOSED       = { open: false, date: '', key: 0, editStudyId: null, initialValues: null };
const POPUP_CLOSED       = { open: false, extendedProps: null, position: null };
const EXAM_MODAL_CLOSED  = { open: false, date: '', key: 0, examId: null, initialValues: null };
const EXAM_POPUP_CLOSED  = { open: false, extendedProps: null, position: null };
const QUEST_POPUP_CLOSED = { open: false, extendedProps: null, position: null };

export default function StudyCalendar() {
  const subjects = useSubjects() ?? [];
  const studies  = useStudies()  ?? [];
  const exams    = useExams()    ?? [];
  const quests   = useQuests()   ?? [];

  const fcEvents = useMemo(
    () => [
      ...studies.map(s => studyToEvent(s, subjects)),
      ...exams.map(e => examToEvent(e, subjects)),
      ...quests.map(q => questToEvent(q)),
    ],
    [studies, subjects, exams, quests],
  );

  const [modalState,      setModalState]      = useState(MODAL_CLOSED);
  const [popupState,      setPopupState]      = useState(POPUP_CLOSED);
  const [examModalState,  setExamModalState]  = useState(EXAM_MODAL_CLOSED);
  const [examPopupState,  setExamPopupState]  = useState(EXAM_POPUP_CLOSED);
  const [questPopupState, setQuestPopupState] = useState(QUEST_POPUP_CLOSED);

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

    const { type } = arg.event.extendedProps;
    const props = { open: true, extendedProps: { ...arg.event.extendedProps }, position: { x, y } };
    if (type === 'exam')        setExamPopupState(props);
    else if (type === 'quest')  setQuestPopupState(props);
    else                        setPopupState(props);
  }, []);

  const handleEventDrop = useCallback(async (info) => {
    const { type, studyId, examId } = info.event.extendedProps;
    if (type === 'quest') { info.revert(); return; }
    const newDate = info.event.startStr.slice(0, 10);
    try {
      if (type === 'exam') {
        await db.exams.update(examId, { date: newDate });
      } else {
        await db.studies.update(studyId, { date: newDate });
      }
    } catch {
      info.revert();
    }
  }, []);

  const renderEventContent = useCallback((eventInfo) => {
    const { status, type, difficulty } = eventInfo.event.extendedProps;
    const done = status === 'completed';

    if (type === 'quest') {
      return (
        <div
          className="px-1 text-xs font-bold truncate w-full leading-relaxed"
          style={{
            color:          QUEST_TEXT[difficulty] ?? '#374151',
            opacity:        done ? 0.5 : 1,
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {eventInfo.event.title}
        </div>
      );
    }

    const faded = type !== 'exam' && done;
    return (
      <div className={`px-1 text-white text-xs font-bold truncate w-full leading-relaxed${faded ? ' opacity-50' : ''}`}>
        {eventInfo.event.title}
      </div>
    );
  }, []);

  const handleEventDidMount = useCallback((info) => {
    if (info.event.extendedProps.type === 'exam') {
      info.el.style.borderWidth = '2px';
    }
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
      initialValues: { id: studyId, subject: subjectName, difficulty, minutes, memo },
    }));
  }

  async function handleExamSave({ subject, date, range }) {
    if (examModalState.examId) {
      await db.exams.update(examModalState.examId, { subject, date, range });
    } else {
      await db.exams.add({ subject, date, range });
    }
    setExamModalState(EXAM_MODAL_CLOSED);
  }

  function handleExamEdit() {
    const { examId, subject, range, date } = examPopupState.extendedProps;
    setExamPopupState(EXAM_POPUP_CLOSED);
    setExamModalState(prev => ({
      open: true,
      date,
      key: prev.key + 1,
      examId,
      initialValues: { subject, date, range },
    }));
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
          className="px-3 py-1.5 rounded-lg bg-rpg-gold text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
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
          eventDidMount={handleEventDidMount}
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
        initialValues={examModalState.initialValues}
      />
      {examPopupState.open && (
        <ExamPopup
          extendedProps={examPopupState.extendedProps}
          position={examPopupState.position}
          onDelete={handleExamDelete}
          onEdit={handleExamEdit}
          onClose={() => setExamPopupState(EXAM_POPUP_CLOSED)}
        />
      )}
      {questPopupState.open && (
        <QuestPopup
          extendedProps={questPopupState.extendedProps}
          position={questPopupState.position}
          onClose={() => setQuestPopupState(QUEST_POPUP_CLOSED)}
        />
      )}
    </div>
  );
}
