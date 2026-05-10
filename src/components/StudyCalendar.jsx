import { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { db } from '../db/db';
import { useStudies, useSubjects } from '../hooks/useStudies';
import AddStudyModal from './AddStudyModal';
import EventPopup from './EventPopup';

const ABBR = { '수학': '수', '영어': '영', '국어': '국', '과학': '과' };
const getAbbr = (name) => ABBR[name] ?? name.charAt(0);

function studyToEvent(study, subjects) {
  const subject = subjects.find(s => s.name === study.subject);
  const color = subject?.color ?? '#6B7280';
  const abbr = getAbbr(study.subject);
  return {
    id: study.eventId,
    title: study.completed ? `✓ ${abbr}` : abbr,
    start: study.date,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      studyId:     study.id,
      completed:   !!study.completed,
      subjectName: study.subject,
      difficulty:  study.difficulty,
      minutes:     study.minutes,
      memo:        study.memo ?? '',
      date:        study.date,
    },
  };
}

const MODAL_CLOSED = { open: false, date: '', key: 0, editStudyId: null, initialValues: null };
const POPUP_CLOSED = { open: false, eventId: null, extendedProps: null, position: null };

export default function StudyCalendar() {
  const subjects = useSubjects() ?? [];
  const studies  = useStudies()  ?? [];

  const fcEvents = useMemo(
    () => studies.map(s => studyToEvent(s, subjects)),
    [studies, subjects],
  );

  const [modalState, setModalState] = useState(MODAL_CLOSED);
  const [popupState, setPopupState] = useState(POPUP_CLOSED);

  const handleDateClick = useCallback((arg) => {
    setModalState(prev => ({
      open: true, date: arg.dateStr, key: prev.key + 1,
      editStudyId: null, initialValues: null,
    }));
  }, []);

  const handleEventClick = useCallback((arg) => {
    const { clientX, clientY } = arg.jsEvent;
    const x = Math.min(clientX + 12, window.innerWidth - 232);
    const y = Math.min(Math.max(clientY - 20, 10), window.innerHeight - 220);
    setPopupState({
      open: true,
      eventId: arg.event.id,
      extendedProps: { ...arg.event.extendedProps },
      position: { x, y },
    });
  }, []);

  const renderEventContent = useCallback((eventInfo) => {
    const { completed } = eventInfo.event.extendedProps;
    return (
      <div className={`px-1 text-white text-xs font-bold truncate w-full leading-relaxed${completed ? ' opacity-50' : ''}`}>
        {eventInfo.event.title}
      </div>
    );
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
        completed: false,
      });
    }
    setModalState(MODAL_CLOSED);
  }

  async function handleComplete() {
    await db.studies.update(popupState.extendedProps.studyId, { completed: true });
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

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        events={fcEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
      />
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
          eventId={popupState.eventId}
          extendedProps={popupState.extendedProps}
          position={popupState.position}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onClose={() => setPopupState(POPUP_CLOSED)}
        />
      )}
    </div>
  );
}
