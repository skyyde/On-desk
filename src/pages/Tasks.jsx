import { useMemo, useState } from 'react';
import { ArrowDownUp, CalendarClock, Check, CircleCheck, ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import './tasks.css';

const priorities = { high: 0, medium: 1, low: 2 };
const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const readableDate = (date) => {
  if (!date) return 'No due date';
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
};

export default function Tasks({ data, update, openTask, openEvent }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('active');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('deadline');
  const tasks = data.tasks || [];
  const subjects = data.subjects || [];
  const subjectName = (id) => subjects.find((subject) => subject.id === id)?.name || 'Personal';
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      return Boolean(task.completed) === (view === 'completed') &&
        (!query || `${task.title} ${subjectName(task.subjectId)}`.toLowerCase().includes(query)) &&
        (subjectFilter === 'all' || (subjectFilter === 'personal' ? !task.subjectId : task.subjectId === subjectFilter)) &&
        (priorityFilter === 'all' || (task.priority || 'medium') === priorityFilter);
    }).sort((a, b) => {
      if (sort === 'priority') return (priorities[a.priority] ?? 1) - (priorities[b.priority] ?? 1) || a.title.localeCompare(b.title);
      if (sort === 'course') return subjectName(a.subjectId).localeCompare(subjectName(b.subjectId)) || a.title.localeCompare(b.title);
      return `${a.dueDate || '9999'}${a.dueTime || '23:59'}`.localeCompare(`${b.dueDate || '9999'}${b.dueTime || '23:59'}`) || a.title.localeCompare(b.title);
    });
  }, [tasks, subjects, search, view, subjectFilter, priorityFilter, sort]);
  const toggle = (id) => update((previous) => ({ ...previous, tasks: previous.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed, completedAt: task.completed ? '' : todayString() } : task) }));
  const remove = (task) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    update((previous) => ({ ...previous, tasks: previous.tasks.filter((item) => item.id !== task.id), events: (previous.events || []).map((event) => event.taskId === task.id ? { ...event, taskId: '' } : event) }));
  };
  const schedule = (task) => openEvent({ title: task.title, taskId: task.id, subjectId: task.subjectId || '', date: task.dueDate || todayString(), start: '09:00', end: '10:00' });
  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - activeCount;

  return <section className="tasks-page" aria-labelledby="tasks-title">
    <header className="tasks-heading">
      <div><span className="tasks-eyebrow">YOUR TO-DO LIST</span><h1 id="tasks-title">Tasks <em>&amp; little wins.</em></h1><p>A little progress adds up. Take it one task at a time.</p></div>
      <button className="tasks-primary" onClick={() => openTask(null)}><Plus size={17} /> New task</button>
    </header>
    <div className="tasks-tabs" role="group" aria-label="Task view">
      <button className={view === 'active' ? 'selected' : ''} onClick={() => setView('active')}>To do <span>{activeCount}</span></button>
      <button className={view === 'completed' ? 'selected' : ''} onClick={() => setView('completed')}>Completed <span>{completedCount}</span></button>
    </div>
    <div className="tasks-panel">
      <div className="tasks-toolbar">
        <label className="tasks-search"><Search size={17} aria-hidden="true" /><span className="tasks-sr">Search tasks</span><input type="search" placeholder="Search your tasks..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="tasks-filters">
          <label><span className="tasks-sr">Filter by subject</span><select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option><option value="personal">Personal</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
          <label><span className="tasks-sr">Filter by priority</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></label>
          <label className="tasks-sort"><ArrowDownUp size={15} aria-hidden="true" /><span className="tasks-sr">Sort tasks</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="deadline">Deadline</option><option value="priority">Priority</option><option value="course">Subject</option></select></label>
        </div>
      </div>
      <div className="tasks-list-heading"><span>{view === 'completed' ? 'COMPLETED TASKS' : 'YOUR TASKS'}</span><span>{visible.length} {visible.length === 1 ? 'TASK' : 'TASKS'}</span></div>
      {visible.length === 0 ? <div className="tasks-empty"><div className="tasks-empty-icon">{view === 'completed' ? <CircleCheck size={25} /> : <ClipboardList size={25} />}</div><h2>{search || subjectFilter !== 'all' || priorityFilter !== 'all' ? 'No matching tasks' : view === 'completed' ? 'Your little wins will live here' : 'A clear space to begin'}</h2><p>{search || subjectFilter !== 'all' || priorityFilter !== 'all' ? 'Try a different search or filter.' : view === 'completed' ? 'Completed tasks are saved here for you to look back on.' : 'Add a task and make a little room in your mind.'}</p>{view === 'active' && !search && subjectFilter === 'all' && priorityFilter === 'all' && <button className="tasks-text-button" onClick={() => openTask(null)}><Plus size={16} /> Add your first task</button>}</div> : <ul className="tasks-list">{visible.map((task) => {
        const subject = subjects.find((item) => item.id === task.subjectId);
        const overdue = !task.completed && task.dueDate && task.dueDate < todayString();
        return <li className={`tasks-row ${task.completed ? 'is-complete' : ''}`} key={task.id}>
          <button className="tasks-check" onClick={() => toggle(task.id)} aria-label={`${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`} aria-pressed={Boolean(task.completed)}>{task.completed && <Check size={14} />}</button>
          <div className="tasks-row-content"><button className="tasks-title-button" onClick={() => openTask(task)}>{task.title}</button><div className="tasks-meta"><span className="tasks-subject"><i style={{ background: subject?.color || '#c7a58c' }} />{subject?.name || 'Personal'}</span><span className={overdue ? 'tasks-overdue' : ''}>{overdue ? 'Overdue · ' : ''}{readableDate(task.dueDate)}{task.dueDate && task.dueTime ? ` · ${task.dueTime}` : ''}</span><span className={`tasks-priority priority-${task.priority || 'medium'}`}>{task.priority || 'medium'} priority</span></div></div>
          <div className="tasks-actions"><button onClick={() => schedule(task)} title="Schedule task" aria-label={`Schedule ${task.title}`}><CalendarClock size={17} /></button><button onClick={() => openTask(task)} title="Edit task" aria-label={`Edit ${task.title}`}><Pencil size={16} /></button><button onClick={() => remove(task)} title="Delete task" aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button></div>
        </li>;
      })}</ul>}
    </div>
  </section>;
}
