import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';

export const localISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const toMinutes = value => { const [h, m] = (value || '00:00').split(':').map(Number); return h * 60 + m; };
export const fromMinutes = minutes => { const n = ((minutes % 1440) + 1440) % 1440; return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
export const formatTime = value => { if (!value) return ''; const n = toMinutes(value); return `${Math.floor(n / 60) % 12 || 12}:${String(n % 60).padStart(2, '0')} ${n < 720 ? 'AM' : 'PM'}`; };
const parseDate = value => value ? new Date(`${value}T12:00:00`) : new Date();

function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = e => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const onKeyDown = e => { if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); close(); } };
  return { open, setOpen, root, trigger, close, onKeyDown };
}

export function DatePicker({ label, value = '', onChange }) {
  const p = usePopover();
  const id = useId();
  const [month, setMonth] = useState(() => { const d = parseDate(value); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  function toggle() { if (!p.open) { const d = parseDate(value); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); } p.setOpen(!p.open); }
  function choose(date) { onChange(date); p.close(); }
  const moveMonth = amount => setMonth(m => new Date(m.getFullYear(), m.getMonth() + amount, 1));
  return <div className="kd-field kd-picker" ref={p.root} onKeyDown={p.onKeyDown}>
    <label id={`${id}-label`}>{label}</label>
    <button type="button" className={`kd-picker-trigger ${!value ? 'is-empty' : ''}`} ref={p.trigger} aria-labelledby={`${id}-label ${id}-value`} aria-expanded={p.open} aria-controls={`${id}-popover`} onClick={toggle}><CalendarDays size={16}/><span id={`${id}-value`}>{value ? parseDate(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date'}</span></button>
    {p.open && <div className="kd-date-popover" id={`${id}-popover`} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
      <div className="kd-picker-heading"><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17}/></button><strong aria-live="polite">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17}/></button></div>
      <div className="kd-date-grid">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span className="kd-weekday" key={i}>{d}</span>)}{days.map(d => { const iso = localISO(d); return <button type="button" key={iso} aria-label={d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} aria-pressed={value === iso} aria-current={iso === localISO() ? 'date' : undefined} className={`${d.getMonth() !== month.getMonth() ? 'outside-month' : ''} ${value === iso ? 'selected' : ''} ${iso === localISO() ? 'is-today' : ''}`} onClick={() => choose(iso)}>{d.getDate()}</button>; })}</div>
      <div className="kd-picker-footer"><button type="button" onClick={() => choose(localISO())}>Today</button><button type="button" onClick={() => choose('')}>Clear</button><button type="button" aria-label="Close date picker" onClick={p.close}><X size={15}/></button></div>
    </div>}
  </div>;
}

export function TimePicker({ label, value = '', onChange }) {
  const p = usePopover();
  const id = useId();
  const list = useRef(null);
  useEffect(() => { if (p.open) { const selected = list.current?.querySelector('[aria-selected="true"]'); if (selected) list.current.scrollTop = selected.offsetTop - list.current.offsetTop - 70; } }, [p.open]);
  const times = Array.from({ length: 96 }, (_, i) => fromMinutes(i * 15));
  function choose(t) { onChange(t); p.close(); }
  function listKeys(e) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const buttons = [...list.current.querySelectorAll('[role="option"]')];
    const current = buttons.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? 95 : Math.max(0, Math.min(95, current + (e.key === 'ArrowDown' ? 1 : -1)));
    buttons[next]?.focus();
  }
  return <div className="kd-field kd-picker" ref={p.root} onKeyDown={p.onKeyDown}>
    <label id={`${id}-label`}>{label}</label><button ref={p.trigger} type="button" className={`kd-picker-trigger ${!value ? 'is-empty' : ''}`} aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={p.open} aria-controls={`${id}-options`} onClick={() => p.setOpen(!p.open)}><Clock3 size={16}/><span id={`${id}-value`}>{formatTime(value) || 'Choose time'}</span></button>
    {p.open && <div className="kd-time-popover"><div className="kd-time-options" ref={list} id={`${id}-options`} role="listbox" aria-label={label} onKeyDown={listKeys}>{times.map(t => <button key={t} type="button" role="option" aria-selected={t === value} className={t === value ? 'selected' : ''} onClick={() => choose(t)}>{formatTime(t)}</button>)}</div><div className="kd-picker-footer"><button type="button" onClick={() => choose('')}>Clear</button><button type="button" onClick={p.close}>Close</button></div></div>}
  </div>;
}
