import { SUBJECTS } from './constants.js';
import { createPlanner, PLANNER_SUBJECTS, WEEK_STATUSES, DEADLINE_STATUSES } from './seedPlanner.js';
import { today, clampDate, timeMinutes, durationBetween } from './date.js';
export const KEY = 'on-desk-v2';
export const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const seedClasses = () => [
  ['NSETRON',0,'09:15','10:45'], ['CSSWENG',0,'11:00','12:30'],
  ['LCASEAN',1,'09:15','10:45'], ['CSOPESY',1,'14:30','16:00'],
  ['NSETRON',3,'09:15','10:45'], ['CSSWENG',3,'11:00','12:30'],
  ['LCASEAN',4,'09:15','10:45'], ['CSOPESY',4,'14:30','16:00'],
  ['NSCOM03',5,'07:30','09:00'], ['NSCOM03',5,'09:15','10:45'],
].map(([subject,dow,start,end]) => ({id:id(),subject,dow,start,end,label:subject}));
export const createData = () => ({version:2,tasks:[],classes:seedClasses(),notes:Object.fromEntries(SUBJECTS.map(s => [s.id,{quick:'',resources:''}])),photos:{},links:{},journal:[],planner:createPlanner(),calendar:{date:clampDate(today()),view:'week',scroll:440},lastBackup:''});
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string';
const number = value => typeof value === 'number' && Number.isFinite(value);
const validDate = (value, optional = true) => {
  if (optional && value === '') return true;
  if (!text(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10) === value;
};
const validTime = (value, optional = true) => optional && value === '' || text(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validTimestamp = value => value === '' || value === null || text(value) && !Number.isNaN(Date.parse(value));
const subject = value => SUBJECTS.some(s => s.id === value);
const check = (condition, section) => { if (!condition) throw new Error(`Invalid ${section} in backup. Your current data has not been replaced.`); };
const fields = (item, keys) => keys.every(key => text(item[key]));
const list = (value, section) => {
  check(Array.isArray(value), section);
  const ids = new Set();
  value.forEach(item => {check(object(item) && text(item.id) && item.id.length > 0 && !ids.has(item.id),section);ids.add(item.id)});
};
export function validateData(value) {
  check(object(value), 'backup format');
  if(value.version === 1) return migrateLegacy(value);
  check(value.version === 2, 'backup version');
  list(value.tasks,'tasks');
  value.tasks.forEach(t => check(fields(t,['title','notes','subject','due','date','start']) && t.title.trim().length > 0 && subject(t.subject) && validDate(t.due) && validDate(t.date) && validTime(t.start) && number(t.duration) && t.duration >= 15 && t.duration <= 1440 && Number.isInteger(t.spanDays) && t.spanDays >= 1 && t.spanDays <= 7 && typeof t.done === 'boolean' && validTimestamp(t.completedAt), 'task fields'));
  list(value.classes,'classes');
  value.classes.forEach(c => check(fields(c,['subject','start','end','label']) && subject(c.subject) && Number.isInteger(c.dow) && c.dow >= 0 && c.dow <= 6 && validTime(c.start,false) && validTime(c.end,false) && timeMinutes(c.end) > timeMinutes(c.start),'class schedule'));
  check(object(value.notes),'subject notes');
  SUBJECTS.forEach(s => check(object(value.notes[s.id]) && fields(value.notes[s.id],['quick','resources']),'subject notes'));
  check(object(value.photos),'shortcut images');
  Object.values(value.photos).forEach(photo => check(text(photo) && (photo === '' || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)), 'shortcut images'));
  check(object(value.links),'links');
  Object.values(value.links).forEach(url => {if(url === '') return; try {check(text(url) && ['https:','http:'].includes(new URL(url).protocol),'link URLs')} catch {throw new Error('Invalid link URL in backup. Your current data has not been replaced.')}});
  list(value.journal,'journal');
  value.journal.forEach(j => check(fields(j,['title','date','body']) && validDate(j.date,false) && (validTimestamp(j.updatedAt) || number(j.updatedAt)),'journal entry'));
  check(object(value.calendar) && ['week','month'].includes(value.calendar.view) && validDate(value.calendar.date,false) && number(value.calendar.scroll) && value.calendar.scroll >= 0,'calendar preferences');
  check(validTimestamp(value.lastBackup),'backup timestamp');
  const planner = value.planner; check(object(planner),'subject planner');
  list(planner.weeks,'weekly planner');
  planner.weeks.forEach(w => {check(fields(w,['label','deadline']) && object(w.topics) && object(w.statuses),'weekly planner'); PLANNER_SUBJECTS.forEach(s => check(text(w.topics[s]) && WEEK_STATUSES.includes(w.statuses[s]),'weekly planner cells'))});
  list(planner.deadlines,'milestones');
  planner.deadlines.forEach(d => check(fields(d,['subject','type','deliverable','timing','date','weight','note','status']) && PLANNER_SUBJECTS.includes(d.subject) && validDate(d.date) && DEADLINE_STATUSES.includes(d.status),'milestone fields'));
  check(object(planner.grading),'grading');
  PLANNER_SUBJECTS.forEach(s => { list(planner.grading[s],'grading components');planner.grading[s].forEach(c=>check(fields(c,['name','weight','note']),'grading fields')); });
  // Return a detached copy: caller can safely adopt it after every check passes.
  return JSON.parse(JSON.stringify(value));
}
export function migrateLegacy(legacy) {
  check(legacy.version === 1 && ['tasks','events','subjects','journal','shortcuts'].every(k=>Array.isArray(legacy[k])), 'legacy backup');
  const result = createData();
  result.legacy = JSON.parse(JSON.stringify(legacy));
  const subjectMap = sid => {const s=legacy.subjects.find(item=>item.id===sid);return SUBJECTS.find(item=>item.id===s?.name?.toUpperCase())?.id || 'Extracurricular'};
  result.tasks = legacy.tasks.map(t => {
    check(object(t) && text(t.id) && text(t.title),'legacy task');
    const event = legacy.events.find(e=>e.taskId===t.id);
    return {id:t.id,title:t.title||'Untitled task',subject:subjectMap(t.subjectId),due:t.dueDate||'',date:event?.date||'',start:event?.start||'',duration:event?.start&&event?.end?Math.max(15,durationBetween(event.start,event.end)):60,notes:t.notes||'',done:!!t.completed,completedAt:t.completed?(t.completedAt||new Date().toISOString()):'',spanDays:1};
  });
  const used = new Set(legacy.tasks.map(t=>legacy.events.find(e=>e.taskId===t.id)?.id));
  legacy.events.filter(e=>!used.has(e.id)).forEach(e=>result.tasks.push({id:`event-${e.id}`,title:e.title||'Study session',subject:subjectMap(e.subjectId),due:e.date||'',date:e.date||'',start:e.start||'',duration:e.start&&e.end?Math.max(15,durationBetween(e.start,e.end)):60,notes:'Imported from On Desk v1 calendar.',done:false,completedAt:'',spanDays:1}));
  legacy.subjects.forEach(s => { const target=subjectMap(s.id);const note=result.notes[target];note.quick += `${note.quick?'\n\n':''}${s.name || 'Subject'}\n${s.notes||''}${s.weeks?'\n'+Object.entries(s.weeks).map(([w,t])=>`${w}: ${t}`).join('\n'):''}${s.grading?'\nGrading: '+s.grading:''}`;if(text(s.resources))note.resources+=`${note.resources?'\n':''}${s.resources}`; });
  result.journal = legacy.journal.map(j=>({id:j.id,title:'Imported entry',date:j.date,body:j.text||'',updatedAt:new Date(`${j.date}T12:00:00`).toISOString()}));
  // Custom subjects, shortcuts, priorities, and all unmodeled fields remain losslessly
  // available in legacy and the old storage key; exports include the legacy snapshot.
  return validateData(result);
}
export function loadData(storage = globalThis.localStorage) {
  const current = storage.getItem(KEY);
  if (current !== null) return validateData(JSON.parse(current));
  const legacy = storage.getItem('on-desk-v1');
  return legacy === null ? createData() : migrateLegacy(JSON.parse(legacy));
}
export function saveData(data, storage = globalThis.localStorage) {
  // localStorage.setItem is atomic. Quota errors propagate to the visible app alert.
  storage.setItem(KEY, JSON.stringify(data));
}
