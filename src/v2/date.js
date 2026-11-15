import { SEMESTER_START, SEMESTER_END } from './constants.js';
const pad = n => String(n).padStart(2, '0');
export const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const today = () => dateKey(new Date());
export const parseDate = key => new Date(`${key}T12:00:00`);
export const addDays = (key, amount) => { const date = parseDate(key); date.setDate(date.getDate() + amount); return dateKey(date); };
export const weekStart = key => { const date = parseDate(key); return addDays(key, -((date.getDay() + 6) % 7)); };
export const weekDates = key => Array.from({ length: 7 }, (_, i) => addDays(weekStart(key), i));
export const dayDifference = (a, b) => Math.round((Date.UTC(...a.split('-').map((n, i) => +n - (i === 1 ? 1 : 0))) - Date.UTC(...b.split('-').map((n, i) => +n - (i === 1 ? 1 : 0)))) / 86400000);
export const clampDate = key => key < SEMESTER_START ? SEMESTER_START : key > SEMESTER_END ? SEMESTER_END : key;
export const timeMinutes = time => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; };
export const minutesTime = minutes => { const value = ((minutes % 1440) + 1440) % 1440; return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`; };
export const durationBetween = (start, end) => (timeMinutes(end) - timeMinutes(start) + 1440) % 1440 || 1440;
export const formatTime = time => { const value = timeMinutes(time); return `${Math.floor(value / 60) % 12 || 12}:${pad(value % 60)} ${value < 720 ? 'AM' : 'PM'}`; };
export const formatDate = (key, options = { month: 'short', day: 'numeric' }) => key ? parseDate(key).toLocaleDateString(undefined, options) : '';
export function urgency(due, current = today()) {
  if (!due) return { text: 'No due date', level: 'none', days: null };
  const days = dayDifference(due, current);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, level: 'overdue', days };
  if (!days) return { text: 'due today', level: 'today', days };
  return { text: days <= 10 ? `due in ${days}d` : `due ${formatDate(due)}`, level: days <= 2 ? 'soon' : days <= 5 ? 'near' : days <= 10 ? 'upcoming' : 'later', days };
}
