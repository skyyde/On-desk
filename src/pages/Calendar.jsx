import { useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Move, Maximize2 } from 'lucide-react';
import './calendar.css';

const HOUR_HEIGHT = 64;
const pad = (n) => String(n).padStart(2, '0');
const localDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
const monday = (date) => { const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()); return addDays(start, -((start.getDay() + 6) % 7)); };
const minutes = (value) => { const [h, m] = (value || '09:00').split(':').map(Number); return h * 60 + m; };
const time = (value) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
const snap = (value) => Math.round(value / 15) * 15;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const displayTime = (value) => { const [h, m] = value.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`; };

export default function Calendar({ data, update, openEvent }) {
  const [week, setWeek] = useState(() => monday(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const subjects = data.subjects || [];
  const events = data.events || [];
  const tasks = data.tasks || [];
  const today = localDate(new Date());
  const subjectFor = (id) => subjects.find((subject) => subject.id === id);
  const dates = days.map(localDate);
  const weekLabel = `${week.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const makeAt = (day, e) => {
    if (e.target.closest('.calendar-event')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const start = clamp(snap((e.clientY - rect.top) / HOUR_HEIGHT * 60), 0, 23 * 60);
    openEvent({ date: localDate(day), start: time(start), end: time(Math.min(start + 60, 1425)) });
  };
  const beginDrag = (e, event, mode) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: event.id, mode, x: e.clientX, y: e.clientY, date: event.date, start: minutes(event.start), end: minutes(event.end || '10:00'), moved: false };
  };
  const finishDrag = (e) => {
    const current = drag.current;
    if (!current) return;
    const deltaY = e.clientY - current.y;
    const deltaX = e.clientX - current.x;
    if (Math.abs(deltaY) > 4 || Math.abs(deltaX) > 4) {
      const delta = snap(deltaY / HOUR_HEIGHT * 60);
      const columns = document.querySelector('.calendar-columns');
      const dayWidth = columns ? columns.getBoundingClientRect().width / 7 : 1;
      const dayDelta = Math.round(deltaX / dayWidth);
      const duration = Math.max(15, current.end - current.start);
      const newStart = current.mode === 'move' ? clamp(current.start + delta, 0, 1425 - duration) : current.start;
      const newEnd = current.mode === 'resize' ? clamp(current.end + delta, current.start + 15, 1425) : newStart + duration;
      const originalDay = new Date(`${current.date}T12:00:00`);
      const date = current.mode === 'move' ? localDate(addDays(originalDay, dayDelta)) : current.date;
      update((previous) => ({ ...previous, events: previous.events.map((event) => event.id === current.id ? { ...event, date, start: time(newStart), end: time(newEnd) } : event) }));
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 100);
    }
    drag.current = null;
  };
  return <section className="calendar-page">
    <div className="calendar-title-row">
      <div><p className="calendar-eyebrow">MAKE SPACE FOR WHAT MATTERS</p><h1>Weekly planner</h1><p className="calendar-subtitle">A little structure for your days.</p></div>
      <button className="calendar-primary" onClick={() => openEvent({ date: today, start: '09:00', end: '10:00' })}><Plus size={17} /> Add event</button>
    </div>
    <div className="calendar-toolbar">
      <div><span className="calendar-toolbar-label">YOUR WEEK</span><h2>{weekLabel}</h2></div>
      <div className="calendar-navigation"><button onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week"><ChevronLeft size={18} /></button><button className="calendar-today" onClick={() => setWeek(monday(new Date()))}>Today</button><button onClick={() => setWeek(addDays(week, 7))} aria-label="Next week"><ChevronRight size={18} /></button></div>
    </div>
    <p className="calendar-hint">Tap a time to add a session. Use the handles to move or resize, or select an event to edit it.</p>
    <div className="calendar-frame">
      <div className="calendar-scroll" role="region" aria-label="Weekly calendar, scroll to see all times and days" tabIndex="0">
        <div className="calendar-inner">
          <div className="calendar-days"><div className="calendar-time-spacer" />{days.map((day) => <div className={`calendar-day-heading ${localDate(day) === today ? 'is-today' : ''}`} key={localDate(day)}><span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span><strong>{day.getDate()}</strong></div>)}</div>
          <div className="calendar-deadlines"><div className="calendar-deadline-label">DUE</div>{days.map((day) => <div className="calendar-deadline-day" key={localDate(day)}>{tasks.filter((task) => !task.completed && task.dueDate === localDate(day)).map((task) => <span className="calendar-deadline" title={`${task.title}${task.dueTime ? ` · ${task.dueTime}` : ''}`} key={task.id}>{task.title}</span>)}</div>)}</div>
          <div className="calendar-timeline"><div className="calendar-hours">{Array.from({ length: 24 }, (_, h) => <div key={h}>{h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`}</div>)}</div><div className="calendar-columns">{days.map((day) => {
            const dayKey = localDate(day);
            return <div className="calendar-day-column" key={dayKey} onClick={(e) => makeAt(day, e)}>{events.filter((event) => event.date === dayKey).map((event) => {
              const start = minutes(event.start); const end = Math.max(start + 15, minutes(event.end || '10:00')); const subject = subjectFor(event.subjectId);
              return <div className="calendar-event" key={event.id} style={{ top: `${start / 60 * HOUR_HEIGHT}px`, height: `${Math.max(20, (end - start) / 60 * HOUR_HEIGHT)}px`, '--event-color': subject?.color || '#c98f99' }}>
                <button className="calendar-event-content" onClick={(e) => { e.stopPropagation(); if (!suppressClick.current) openEvent(event); }} title={`Edit ${event.title}`}><strong>{event.title}</strong><span>{displayTime(event.start || '09:00')} – {displayTime(event.end || '10:00')}</span></button>
                <button className="calendar-drag-handle" aria-label={`Move ${event.title}; use edit for keyboard scheduling`} title="Drag to move" onPointerDown={(e) => beginDrag(e, event, 'move')} onPointerUp={finishDrag} onPointerCancel={() => { drag.current = null; }}><Move size={12} /></button>
                <button className="calendar-resize-handle" aria-label={`Resize ${event.title}; use edit for keyboard scheduling`} title="Drag to resize" onPointerDown={(e) => beginDrag(e, event, 'resize')} onPointerUp={finishDrag} onPointerCancel={() => { drag.current = null; }}><Maximize2 size={11} /></button>
              </div>;
            })}</div>;
          })}</div></div>
        </div>
      </div>
    </div>
    {events.filter((event) => dates.includes(event.date)).length === 0 && <p className="calendar-empty"><CalendarDays size={16} /> Your week is a blank canvas. Add a session whenever you’re ready.</p>}
  </section>;
}
