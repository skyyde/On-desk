import React, { useState } from 'react';
import { Plus, ArrowLeft, Archive, ArchiveRestore, Trash2, Pencil, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react';
import './subjects.css';

const COLORS = ['#C98F99', '#9DAA91', '#B96F66', '#C7A58C', '#8B91A8', '#BE9A75'];
const WEEKS = [...Array.from({ length: 14 }, (_, i) => `Week ${i + 1}`), 'Finals'];
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Subjects({ data, update }) {
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [week, setWeek] = useState('Week 1');
  const subjects = data.subjects || [];
  const selected = subjects.find(s => s.id === selectedId);
  const tasks = (data.tasks || []).filter(t => t.subjectId === selectedId);
  const completed = tasks.filter(t => t.completed).length;
  const changeSubject = (id, patch) => update(prev => ({ ...prev, subjects: prev.subjects.map(s => s.id === id ? { ...s, ...patch } : s) }));
  const saveSubject = e => {
    e.preventDefault();
    const name = editing.name.trim();
    if (!name) return;
    if (editing.id) changeSubject(editing.id, { name, color: editing.color, description: editing.description.trim() });
    else {
      const subject = { id: uid(), name, color: editing.color, description: editing.description.trim(), notes: '', resources: '', grading: '', weeks: {}, archived: false };
      update(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
      setSelectedId(subject.id);
    }
    setEditing(null);
  };
  const remove = subject => {
    if (!window.confirm(`Delete “${subject.name}”? Its tasks will remain, without a subject.`)) return;
    update(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== subject.id), tasks: prev.tasks.map(t => t.subjectId === subject.id ? { ...t, subjectId: '' } : t), events: (prev.events || []).map(e => e.subjectId === subject.id ? { ...e, subjectId: '' } : e) }));
    setSelectedId(null);
  };
  const resources = typeof selected?.resources === 'string' ? selected.resources : '';
  const links = resources.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [label, raw] = line.includes('|') ? line.split('|').map(x => x.trim()) : [line, line];
    try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) ? { label, url: url.href } : null; } catch { return null; }
  }).filter(Boolean);
  return <section className="subjects-page">
    <div className="subjects-heading">
      <div><span className="subjects-eyebrow">YOUR LEARNING SPACE</span><h1>{selected ? selected.name : 'Subjects'}</h1><p>{selected ? (selected.description || 'Your space for everything in this subject.') : 'A little home for every course on your desk.'}</p></div>
      {!selected && <button className="subject-primary" onClick={() => setEditing({ name: '', color: COLORS[0], description: '' })}><Plus size={17}/> Add subject</button>}
    </div>
    {selected ? <>
      <div className="subject-toolbar"><button className="subject-link" onClick={() => setSelectedId(null)}><ArrowLeft size={16}/> All subjects</button><div className="subject-actions"><button onClick={() => setEditing({ ...selected })}><Pencil size={15}/> Edit</button><button onClick={() => changeSubject(selected.id, { archived: !selected.archived })}>{selected.archived ? <ArchiveRestore size={15}/> : <Archive size={15}/>} {selected.archived ? 'Restore' : 'Archive'}</button><button onClick={() => remove(selected)}><Trash2 size={15}/> Delete</button></div></div>
      {selected.archived && <p className="subject-notice">This subject is archived. Restore it to bring it back to your active subjects.</p>}
      <div className="subject-workspace">
        <div className="subject-main">
          <article className="subject-panel"><div className="subject-panel-head"><div><span className="subjects-eyebrow">THE SEMESTER</span><h2>Week by week</h2></div><span className="subject-dot" style={{ background: selected.color }}/></div><p>Keep lecture notes, reading lists, and reminders together.</p><div className="subject-week-list" aria-label="Choose a week">{WEEKS.map(w => <button key={w} className={w === week ? 'active' : ''} onClick={() => setWeek(w)}>{w}</button>)}</div><label className="subject-label" htmlFor="subject-week-note">{week} notes</label><textarea id="subject-week-note" rows="7" placeholder="What would you like to remember?" value={selected.weeks?.[week] || ''} onChange={e => changeSubject(selected.id, { weeks: { ...(selected.weeks || {}), [week]: e.target.value } })}/><small>Changes save automatically.</small></article>
          <article className="subject-panel"><span className="subjects-eyebrow">A PLACE FOR IDEAS</span><h2>Course notes</h2><label className="subject-label" htmlFor="subject-notes">Notes</label><textarea id="subject-notes" rows="6" placeholder="Add anything you want to keep close..." value={selected.notes || ''} onChange={e => changeSubject(selected.id, { notes: e.target.value })}/></article>
          <article className="subject-panel"><span className="subjects-eyebrow">KEEP HANDY</span><h2>Resources & links</h2><p>Add one link per line. Use <strong>Label | https://example.com</strong> for a custom label.</p><label className="subject-label" htmlFor="subject-resources">Resource links</label><textarea id="subject-resources" rows="4" placeholder={'Course website | https://example.com'} value={resources} onChange={e => changeSubject(selected.id, { resources: e.target.value })}/>{links.length > 0 && <div className="subject-links">{links.map((link, i) => <a key={i} href={link.url} target="_blank" rel="noreferrer">{link.label} <ExternalLink size={14}/></a>)}</div>}</article>
        </div>
        <aside className="subject-side"><article className="subject-panel subject-progress"><span className="subjects-eyebrow">YOUR PROGRESS</span><h2>Making strides</h2><div className="subject-progress-number">{tasks.length ? Math.round(completed / tasks.length * 100) : 0}<span>%</span></div><div className="subject-progress-bar"><span style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%`, background: selected.color }}/></div><p>{completed} of {tasks.length} tasks completed</p></article>
          <article className="subject-panel"><span className="subjects-eyebrow">COMING UP</span><h2>Course tasks</h2>{tasks.length ? <ul className="subject-task-list">{tasks.slice().sort((a,b) => (a.completed === b.completed ? (a.dueDate || '9999').localeCompare(b.dueDate || '9999') : a.completed ? 1 : -1)).map(task => <li key={task.id}><label><input type="checkbox" checked={!!task.completed} onChange={() => update(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) }))}/><span className={task.completed ? 'done' : ''}>{task.title}</span></label>{task.dueDate && <small>Due {task.dueDate}</small>}</li>)}</ul> : <p>No tasks yet. Assign a task to this subject to see it here.</p>}</article>
          <article className="subject-panel"><span className="subjects-eyebrow">THE DETAILS</span><h2>Grading</h2><label className="subject-label" htmlFor="subject-grading">Grading information</label><textarea id="subject-grading" rows="6" placeholder="Add weights, goals, or grading notes..." value={selected.grading || ''} onChange={e => changeSubject(selected.id, { grading: e.target.value })}/></article>
        </aside>
      </div>
    </> : <><div className="subject-list-header"><h2>{showArchived ? 'Archived subjects' : 'Your subjects'}</h2><button className="subject-link" onClick={() => setShowArchived(!showArchived)}>{showArchived ? 'View active subjects' : 'View archive'}</button></div><div className="subject-grid">{subjects.filter(s => !!s.archived === showArchived).map(subject => { const own = (data.tasks || []).filter(t => t.subjectId === subject.id); const done = own.filter(t => t.completed).length; return <button className="subject-card" key={subject.id} onClick={() => { setSelectedId(subject.id); setWeek('Week 1'); }}><span className="subject-icon" style={{ backgroundColor: `${subject.color || '#C98F99'}30`, color: subject.color || '#C98F99' }}><BookOpen size={22}/></span><span className="subject-card-name">{subject.name}</span><span className="subject-card-description">{subject.description || 'Your course workspace'}</span><span className="subject-card-foot"><CheckCircle2 size={15}/> {done}/{own.length} tasks completed <span>↗</span></span></button>; })}</div>{!subjects.some(s => !!s.archived === showArchived) && <div className="subject-empty"><BookOpen size={26}/><h2>{showArchived ? 'Nothing in your archive' : 'Make room for your subjects'}</h2><p>{showArchived ? 'Archived subjects will appear here.' : 'Add a subject to keep your coursework, notes, and resources together.'}</p>{!showArchived && <button className="subject-primary" onClick={() => setEditing({ name: '', color: COLORS[0], description: '' })}><Plus size={17}/> Add your first subject</button>}</div>}</>}
    {editing && <div className="subject-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null); }}><form className="subject-dialog" role="dialog" aria-modal="true" aria-labelledby="subject-dialog-title" onSubmit={saveSubject}><span className="subjects-eyebrow">YOUR LEARNING SPACE</span><h2 id="subject-dialog-title">{editing.id ? 'Edit subject' : 'A new subject'}</h2><label>Subject name<input autoFocus required maxLength="100" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Art history"/></label><label>Description <span>(optional)</span><textarea rows="3" maxLength="300" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="A little about this course"/></label><label>Subject color<input type="color" value={editing.color || COLORS[0]} onChange={e => setEditing({ ...editing, color: e.target.value })}/></label><div className="subject-dialog-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="subject-primary" type="submit">Save subject</button></div></form></div>}
  </section>;
}
