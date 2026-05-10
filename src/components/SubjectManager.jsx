import { useState } from 'react';
import { db } from '../db/db';
import { useSubjects } from '../hooks/useStudies';
import { useToast } from '../hooks/useToast';

export default function SubjectManager() {
  const subjects = useSubjects() ?? [];
  const { msg: toastMsg, show: showToast } = useToast();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');

  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addColor, setAddColor] = useState('#3B82F6');

  async function handleAdd(e) {
    e.preventDefault();
    const name = addName.trim();
    if (!name) return;
    if (subjects.some(s => s.name === name)) {
      showToast('이미 존재하는 과목 이름입니다');
      return;
    }
    await db.subjects.add({ name, color: addColor });
    setAddName('');
    setAddColor('#3B82F6');
    setAdding(false);
    showToast(`'${name}' 과목이 추가됐습니다`);
  }

  function startEdit(subject) {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditColor(subject.color);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const subject = subjects.find(s => s.id === editingId);
    if (!subject) return;
    const newName = editName.trim();
    if (!newName) return;

    if (newName !== subject.name && subjects.some(s => s.name === newName)) {
      showToast('이미 존재하는 과목 이름입니다');
      return;
    }

    await db.transaction('rw', db.subjects, db.studies, async () => {
      if (newName !== subject.name) {
        await db.studies.where('subject').equals(subject.name).modify({ subject: newName });
      }
      await db.subjects.update(editingId, { name: newName, color: editColor });
    });

    setEditingId(null);
    showToast('과목이 수정됐습니다');
  }

  async function handleDelete(subject) {
    const count = await db.studies.where('subject').equals(subject.name).count();
    if (count > 0) {
      showToast(`'${subject.name}'에 ${count}건의 기록이 있어 삭제할 수 없습니다`);
      return;
    }
    await db.subjects.delete(subject.id);
    showToast(`'${subject.name}' 과목이 삭제됐습니다`);
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {subjects.map(subject => (
          <div key={subject.id}>
            {editingId === subject.id ? (
              <form onSubmit={handleUpdate} className="flex items-center gap-2 py-2.5">
                <input
                  type="color"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border-0 flex-shrink-0"
                />
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0">
                  확인
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0">
                  취소
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 py-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="flex-1 text-sm font-medium text-gray-800">{subject.name}</span>
                <button
                  onClick={() => startEdit(subject)}
                  className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(subject)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <form onSubmit={handleAdd} className="flex items-center gap-2 py-2.5">
            <input
              type="color"
              value={addColor}
              onChange={e => setAddColor(e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0 flex-shrink-0"
            />
            <input
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="과목 이름"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0">
              추가
            </button>
            <button type="button" onClick={() => { setAdding(false); setAddName(''); }} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0">
              취소
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full py-2.5 text-sm text-indigo-500 hover:text-indigo-600 text-left font-medium transition-colors"
          >
            + 과목 추가
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </>
  );
}
