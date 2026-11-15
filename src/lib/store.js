export const KEY = 'on-desk-v1';
export const emptyData = () => ({version:1, settings:{name:''}, tasks:[], events:[], subjects:[], journal:[], shortcuts:[]});
export const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function validateData(value) {
  if (!value || typeof value !== 'object' || value.version !== 1 || !value.settings || typeof value.settings !== 'object') throw new Error('This is not a supported On Desk backup.');
  for (const key of ['tasks','events','subjects','journal','shortcuts']) if (!Array.isArray(value[key]) || value[key].some(item => !item || typeof item !== 'object' || typeof item.id !== 'string')) throw new Error(`Invalid ${key} in backup.`);
  if (value.tasks.some(t=>typeof t.title!=='string') || value.events.some(e=>typeof e.title!=='string' || typeof e.date!=='string' || typeof e.start!=='string' || typeof e.end!=='string') || value.subjects.some(s=>typeof s.name!=='string') || value.journal.some(j=>typeof j.date!=='string' || typeof j.text!=='string') || value.shortcuts.some(s=>typeof s.title!=='string' || typeof s.url!=='string')) throw new Error('The backup contains invalid entries.');
  if (value.shortcuts.some(s => { try { return !['http:', 'https:'].includes(new URL(s.url).protocol); } catch { return true; } })) throw new Error('The backup contains an invalid shortcut URL.');
  if (value.settings.name !== undefined && typeof value.settings.name !== 'string') throw new Error('Invalid personalization settings.');
  if (value.subjects.some(s => (s.weeks !== undefined && (typeof s.weeks !== 'object' || s.weeks === null)) || (s.resources !== undefined && typeof s.resources !== 'string'))) throw new Error('Invalid subject data.');
  return value;
}
export function loadData() { const raw=localStorage.getItem(KEY); return raw ? validateData(JSON.parse(raw)) : emptyData(); }
export function saveData(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
export function formatDate(date, options={month:'short',day:'numeric'}) { if(!date)return 'No date'; const d=new Date(`${date}T12:00:00`); return Number.isNaN(d.valueOf()) ? date : d.toLocaleDateString(undefined,options); }
