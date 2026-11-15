import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Circle, CalendarOff, Trash2, X } from 'lucide-react';
import { SUBJECTS } from './constants';
import { DatePicker, TimePicker, toMinutes, fromMinutes } from './Pickers';
import './editor.css';

export default function TaskEditor({ task = {}, onSave, onDelete, onToggle, onClose }) {
  const [form, setForm] = useState(() => ({ title: '', subject: 'CSOPESY', due: task?.date || '', date: '', start: '', duration: 60, notes: '', done: false, completedAt: '', spanDays: 1, ...task }));
  const [end, setEnd] = useState(() => task?.start ? fromMinutes(toMinutes(task.start) + (task.duration || 60)) : '');
  const [error, setError] = useState('');
  const modal = useRef(null);
  const title = useRef(null);
  useEffect(() => { const previous = document.activeElement; title.current?.focus(); return () => previous?.focus?.(); }, []);
  const patch = values => setForm(f => ({ ...f, ...values }));
  function schedule(date) { setForm(f => ({ ...f, date, due: f.due || date })); }
  function startChange(start) { patch({ start }); if (start && !end) setEnd(fromMinutes(toMinutes(start) + form.duration)); else if (start && end) patch({ start, duration: (toMinutes(end) - toMinutes(start) + 1440) % 1440 || 1440 }); }
  function endChange(next) { setEnd(next); if (next && form.start) patch({ duration: (toMinutes(next) - toMinutes(form.start) + 1440) % 1440 || 1440 }); }
  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Give your task a title.'); title.current?.focus(); return; }
    if (form.start && !form.date) { setError('Choose a scheduled date, or clear the start time to keep this task unscheduled.'); return; }
    const duration = form.start && end ? (toMinutes(end) - toMinutes(form.start) + 1440) % 1440 || 1440 : Number(form.duration) || 60;
    const spanDays = Math.max(1, Math.min(7, Number(form.spanDays) || 1));
    onSave({ ...form, title: form.title.trim(), duration, spanDays });
  }
  function unschedule() { patch({ date: '', start: '' }); setEnd(''); }
  function keydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
    if (e.key !== 'Tab') return;
    const elements = [...modal.current.querySelectorAll('button:not([disabled]),input,textarea,select,[tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = elements[0], last = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  const nextDay = form.start && end && toMinutes(end) <= toMinutes(form.start);
  return <div className="kd-modal-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={keydown}><section className="kd-task-modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="kd-task-heading">
    <header className="kd-task-modal-head"><div><span className="kd-overline">A LITTLE ROOM TO FOCUS</span><h2 id="kd-task-heading">{form.id ? 'Your task, thoughtfully planned.' : 'Something to work towards.'}</h2></div><button type="button" className="kd-modal-close" onClick={onClose} aria-label="Close task editor"><X size={20}/></button></header>
    <form onSubmit={submit} className="kd-task-form">
      <label className="kd-field">Title<input ref={title} maxLength={200} value={form.title} onChange={e => patch({ title: e.target.value })} placeholder="What would you like to get done?" required/></label>
      <fieldset className="kd-subject-field"><legend>Subject</legend><div className="kd-subject-pills">{SUBJECTS.map(s => <button key={s.id} type="button" className={form.subject === s.id ? 'selected' : ''} style={{ '--pill-bg': s.color, '--pill-fg': s.text }} aria-pressed={form.subject === s.id} onClick={() => patch({ subject: s.id })}>{form.subject === s.id && <Check size={13}/>} {s.name}</button>)}</div></fieldset>
      <div className="kd-fields-row"><DatePicker label="Due date" value={form.due} onChange={due => patch({ due })}/><DatePicker label="Scheduled date" value={form.date} onChange={schedule}/></div>
      <div className="kd-fields-row"><TimePicker label="Start time" value={form.start} onChange={startChange}/><TimePicker label="End time" value={end} onChange={endChange}/></div>
      <div className="kd-duration-row"><span>{form.duration} minutes{nextDay ? ' · ends next day' : ''}</span><label>Span <input type="number" min="1" max="7" value={form.spanDays} onChange={e => patch({ spanDays: e.target.value })} aria-label="Task span in days"/> day{Number(form.spanDays) === 1 ? '' : 's'}</label></div>
      <label className="kd-field">Notes<textarea rows={3} value={form.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Details, reminders, a place to begin…"/></label>
      {(form.date || form.start) && <button type="button" className="kd-unschedule" onClick={unschedule}><CalendarOff size={15}/> Move to unscheduled</button>}
      {error && <p className="kd-form-error" role="alert">{error}</p>}
      <footer className="kd-task-modal-footer">{form.id && <div className="kd-existing-actions"><button type="button" onClick={() => onToggle(form)} className="kd-toggle-task">{form.done ? <Circle size={16}/> : <CheckCircle2 size={16}/>} {form.done ? 'Mark Open' : 'Mark Done'}</button><button type="button" onClick={() => { if (window.confirm(`Delete “${form.title}”?`)) onDelete(form); }} className="kd-delete-task"><Trash2 size={16}/> Delete</button></div>}<div className="kd-save-actions"><button type="button" className="kd-cancel" onClick={onClose}>Cancel</button><button type="submit" className="kd-save">Save task</button></div></footer>
    </form>
  </section></div>;
}
