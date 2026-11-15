import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, ExternalLink, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import './extras.css'

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const prettyDate = date => { const d = new Date(`${date}T12:00:00`); return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }

export function Journal({ data, update }) {
  const entries = data.journal || []
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const current = entries.find(entry => entry.id === selected)
  const matches = [...entries].filter(entry => `${entry.date} ${entry.text}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date))
  function addEntry() {
    const entry = { id: uid(), date: today(), text: '' }
    update(previous => ({ ...previous, journal: [entry, ...(previous.journal || [])] }))
    setSelected(entry.id)
  }
  function changeEntry(patch) { update(previous => ({ ...previous, journal: previous.journal.map(entry => entry.id === selected ? { ...entry, ...patch } : entry) })) }
  function deleteEntry(id) {
    if (!window.confirm('Delete this journal entry?')) return
    update(previous => ({ ...previous, journal: previous.journal.filter(entry => entry.id !== id) }))
    if (selected === id) setSelected(null)
  }
  return <section className="extra-page">
    <div className="extra-heading"><div><span className="extra-eyebrow">A LITTLE SPACE FOR YOU</span><h1>Journal</h1><p>Thoughts, moments, and everything in between.</p></div><button className="extra-primary" onClick={addEntry}><Plus size={17}/> New entry</button></div>
    <div className="journal-layout"><aside className="extra-card journal-list"><div className="journal-list-title"><h2>Your entries</h2><span>{entries.length}</span></div><label className="extra-search"><Search size={17}/><span className="sr-only">Search entries</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search entries..." /></label>
      <div className="journal-items">{matches.map(entry => <button key={entry.id} className={`journal-item ${selected === entry.id ? 'selected' : ''}`} onClick={() => setSelected(entry.id)}><strong>{prettyDate(entry.date)}</strong><span>{entry.text.trim() || 'A fresh page...'}</span></button>)}{!matches.length && <p className="extra-empty">{query ? 'No entries match your search.' : 'Your story starts here. Create your first entry.'}</p>}</div></aside>
      <div className="extra-card journal-editor">{current ? <><div className="journal-editor-top"><div><span className="extra-eyebrow">YOUR JOURNAL</span><h2>A moment to reflect.</h2></div><button className="extra-icon danger" aria-label="Delete entry" title="Delete entry" onClick={() => deleteEntry(current.id)}><Trash2 size={18}/></button></div><label className="extra-field journal-date">Entry date<input type="date" value={current.date} onChange={e => e.target.value && changeEntry({ date: e.target.value })}/></label><textarea aria-label="Journal entry" value={current.text} onChange={e => changeEntry({ text: e.target.value })} placeholder="What's on your mind today?"/><p className="extra-hint">Your words are saved automatically on this device.</p></> : <div className="extra-blank"><BookOpen size={30}/><h2>A page just for you</h2><p>Select an entry or start a new one.</p><button className="extra-secondary" onClick={addEntry}><Plus size={16}/> New entry</button></div>}</div>
    </div></section>
}

const blankShortcut = { title: '', url: '', color: '#C98F99', image: '' }
export function Shortcuts({ data, update }) {
  const shortcuts = data.shortcuts || []
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankShortcut)
  const [error, setError] = useState('')
  function open(item) { setForm(item ? { ...blankShortcut, ...item } : { ...blankShortcut }); setEditing(item?.id || 'new'); setError('') }
  function save(e) {
    e.preventDefault()
    const title = form.title.trim()
    let url
    try { url = new URL(form.url.trim()); if (!['http:', 'https:'].includes(url.protocol)) throw new Error() } catch { setError('Enter a valid URL starting with https:// or http://.'); return }
    if (!title) { setError('Please add a title.'); return }
    const item = { ...form, title, url: url.href, id: editing === 'new' ? uid() : editing }
    update(previous => ({ ...previous, shortcuts: editing === 'new' ? [...(previous.shortcuts || []), item] : previous.shortcuts.map(shortcut => shortcut.id === editing ? item : shortcut) }))
    setEditing(null)
  }
  function remove(item) { if (window.confirm(`Delete “${item.title}”?`)) update(previous => ({ ...previous, shortcuts: previous.shortcuts.filter(shortcut => shortcut.id !== item.id) })) }
  function move(index, direction) { const target = index + direction; if (target < 0 || target >= shortcuts.length) return; update(previous => { const next = [...previous.shortcuts]; [next[index], next[target]] = [next[target], next[index]]; return { ...previous, shortcuts: next } }) }
  function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 1024 * 1024) { setError('Choose an image smaller than 1 MB.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = () => { setForm(previous => ({ ...previous, image: reader.result })); setError('') }
    reader.onerror = () => setError('Could not read that image. Please try another file.')
    reader.readAsDataURL(file)
  }
  return <section className="extra-page"><div className="extra-heading"><div><span className="extra-eyebrow">YOUR CORNER OF THE INTERNET</span><h1>Shortcuts</h1><p>All your favorite places, right where you need them.</p></div><button className="extra-primary" onClick={() => open()}><Plus size={17}/> Add shortcut</button></div>
    <div className="shortcut-grid">{shortcuts.map((item, index) => <article key={item.id} className="extra-card shortcut-card"><a className="shortcut-link" href={item.url} target="_blank" rel="noreferrer"><div className="shortcut-image" style={{ backgroundColor: item.color || '#C98F99', backgroundImage: item.image ? `url(${item.image})` : undefined }}><ExternalLink size={23}/></div><div><h2>{item.title}</h2><span>{(() => { try { return new URL(item.url).hostname } catch { return item.url } })()}</span></div><ExternalLink size={16}/></a><div className="shortcut-actions"><button className="extra-icon" aria-label={`Move ${item.title} earlier`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16}/></button><button className="extra-icon" aria-label={`Move ${item.title} later`} disabled={index === shortcuts.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16}/></button><button className="extra-icon" aria-label={`Edit ${item.title}`} onClick={() => open(item)}><Pencil size={16}/></button><button className="extra-icon danger" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={16}/></button></div></article>)}{!shortcuts.length && <div className="extra-card extra-blank"><ExternalLink size={28}/><h2>Keep your favorites close</h2><p>Add a shortcut to a site you visit often.</p><button className="extra-secondary" onClick={() => open()}><Plus size={16}/> Add shortcut</button></div>}</div>
    {editing && <div className="extra-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null) }}><div className="extra-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title"><div className="extra-dialog-head"><h2 id="shortcut-title">{editing === 'new' ? 'Add shortcut' : 'Edit shortcut'}</h2><button className="extra-icon" onClick={() => setEditing(null)} aria-label="Close"><X size={20}/></button></div><form onSubmit={save}><label className="extra-field">Title<input required maxLength={80} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. My library" /></label><label className="extra-field">Website URL<input required type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" /></label><label className="extra-field">Card color<input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></label><label className="extra-field">Optional image <span className="extra-hint">(up to 1 MB)</span><span className="extra-upload"><ImagePlus size={17}/> Choose image<input type="file" accept="image/*" onChange={upload} /></span></label>{form.image && <button className="extra-text-button" type="button" onClick={() => setForm({ ...form, image: '' })}>Remove image</button>}{error && <p className="extra-error" role="alert">{error}</p>}<div className="extra-dialog-actions"><button type="button" className="extra-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="extra-primary" type="submit">Save shortcut</button></div></form></div></div>}
  </section>
}

export function Settings({ data, update, exportData, importData, resetData }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  async function doImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (!window.confirm('Restore this backup? This replaces the data currently on this device.')) { e.target.value = ''; return }
    try { await importData(file); setError(''); setMessage('Backup restored successfully.') } catch (err) { setMessage(''); setError(err?.message || 'Could not import this backup. Check the file and try again.') } finally { e.target.value = '' }
  }
  function reset() { if (window.confirm('Erase all On Desk data on this device? This cannot be undone. Export a backup first if you want to keep it.')) { resetData(); setError(''); setMessage('Your data has been reset.') } }
  return <section className="extra-page"><div className="extra-heading"><div><span className="extra-eyebrow">MAKE IT YOURS</span><h1>Settings</h1><p>A few little details for your workspace.</p></div></div><div className="settings-grid"><div className="extra-card settings-card"><h2>Personal details</h2><p>Make your dashboard feel like home.</p><label className="extra-field">Your name<input maxLength={60} value={data.settings?.name || ''} placeholder="Your name" onChange={e => update(previous => ({ ...previous, settings: { ...previous.settings, name: e.target.value } }))}/></label><span className="extra-hint">Changes save automatically.</span></div><div className="extra-card settings-card"><h2>Your data</h2><p>On Desk stores your data in this browser on this device. It does not sync between devices. Clearing browser data can remove it, so keep a backup.</p><div className="settings-actions"><button className="extra-secondary" onClick={() => { try { exportData(); setError(''); setMessage('Backup downloaded.') } catch (err) { setError(err?.message || 'Could not export data.') } }}>Export backup</button><button className="extra-secondary" onClick={() => fileRef.current?.click()}>Import backup</button><input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} hidden /></div><p className="extra-hint">Importing replaces your current data. Backups are JSON files.</p>{message && <p className="extra-success" role="status">{message}</p>}{error && <p className="extra-error" role="alert">{error}</p>}</div><div className="extra-card settings-card"><h2>Start fresh</h2><p>Remove your tasks, subjects, journal, shortcuts, and settings from this browser.</p><button className="extra-secondary danger" onClick={reset}>Reset all data</button></div></div></section>
}
