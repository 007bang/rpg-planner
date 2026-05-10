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

const MODAL_CLOSED = { open: false, date: '', key: 0, editStudyId: null, initialValues: null };
const POPUP_CLOSED = { open: false, extendedProps: null, position: null };

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
    const y = Math.min(Math.max(clientY - 20, 10), window.innerHeight - 300);
    setPopupState({
      open: true,
      extendedProps: { ...arg.event.extendedProps },
      position: { x, y },
    });
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
    const { status } = eventInfo.event.extendedProps;
    return (
      <div className={`px-1 text-white text-xs font-bold truncate w-full leading-relaxed${status === 'completed' ? ' opacity-50' : ''}`}>
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

  return (
    <div className="p-4">
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
          extendedProps={popupState.extendedProps}
          position={popupState.position}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onClose={() => setPopupState(POPUP_CLOSED)}
        />
      )}
    </div>
  );
}
