import {useEffect,useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,CalendarDays,Plus,X,GripVertical,Check,BookOpen} from 'lucide-react';
import {SUBJECTS,COURSE_DESCRIPTIONS} from './constants';
import './calendar.css';
const MIN='2026-09-01',MAX='2029-12-31',HOUR=64;
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const date=s=>new Date(`${s}T12:00:00`);
const add=(s,n)=>{let d=date(s);d.setDate(d.getDate()+n);return key(d)};
const monday=s=>add(s,-((date(s).getDay()+6)%7));
const diff=(a,b)=>Math.round((date(a)-date(b))/86400000);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clampDate=s=>s<MIN?MIN:s>MAX?MAX:s;
const mins=s=>{const [h,m]=(s||'00:00').split(':').map(Number);return h*60+m};
const clock=n=>`${pad(Math.floor(((n%1440)+1440)%1440/60))}:${pad(((n%1440)+1440)%1440%60)}`;
const label=s=>{const n=mins(s),h=Math.floor(n/60);return `${h%12||12}:${pad(n%60)} ${h<12?'AM':'PM'}`};
const snap=n=>Math.round(n/15)*15;
const today=()=>key(new Date());
const subject=id=>SUBJECTS.find(s=>s.id===id)||SUBJECTS[0];
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const range=t=>`${label(t.start)}–${label(clock(mins(t.start)+t.duration))}${mins(t.start)+t.duration>=1440?' (+1 day)':''}`;
const covers=(t,d)=>!!t.date&&d>=t.date&&d<=add(t.date,(t.spanDays||1)-1);

export default function Calendar({data,update,openTask,openNotes,toggleTask,dragItem,setDragItem,todayRequest=0,toolbarContent}){
 const {date:anchor=clampDate(today()),view='week',scroll=8*HOUR}=data.calendar||{};
 const [agenda,setAgenda]=useState(false),[more,setMore]=useState(null),[preview,setPreview]=useState(null),[announcement,setAnnouncement]=useState('');
 const scrollRef=useRef(null),gridRef=useRef(null),dragRef=useRef(null),pointRef=useRef(null),skipClick=useRef(false),latest=useRef(data),scrollTimer=useRef(null);
 latest.current=data;
 const start=monday(anchor),days=Array.from({length:7},(_,i)=>add(start,i));
 const monthStart=key(new Date(date(anchor).getFullYear(),date(anchor).getMonth(),1)),monthGrid=monday(monthStart),monthDays=Array.from({length:42},(_,i)=>add(monthGrid,i));
 const tasks=data.tasks||[],classes=data.classes||[];
 const changeCalendar=patch=>update(d=>({...d,calendar:{...d.calendar,...patch}}));
 const navigate=direction=>{let next;if(view==='week')next=add(anchor,direction*7);else{const d=date(anchor);next=key(new Date(d.getFullYear(),d.getMonth()+direction,1))}changeCalendar({date:clampDate(next)});setMore(null)};
 const goToday=()=>{changeCalendar({date:clampDate(today())});setAgenda(true)};
 useEffect(()=>{if(todayRequest>0)goToday()},[todayRequest]);
 const addAt=(day,time='09:00')=>openTask({date:day,start:time,duration:60,spanDays:1,due:day});
 useEffect(()=>{if(view==='week'&&scrollRef.current)scrollRef.current.scrollTop=scroll},[view]);
 useEffect(()=>()=>clearTimeout(scrollTimer.current),[]);
 useEffect(()=>{const close=e=>{if(e.key==='Escape'){setMore(null);setAgenda(false);setDragItem(null);setPreview(null)}};const resize=()=>setMore(null);window.addEventListener('keydown',close);window.addEventListener('resize',resize);return()=>{window.removeEventListener('keydown',close);window.removeEventListener('resize',resize)}},[setDragItem]);
 const saveScroll=()=>{const n=scrollRef.current?.scrollTop||0;clearTimeout(scrollTimer.current);scrollTimer.current=setTimeout(()=>changeCalendar({scroll:n}),180)};
 function begin(e,item,kind='task',mode='move'){
  if(e.button!==0)return;e.stopPropagation();e.preventDefault();
  setDragItem({kind,id:item.id,x:e.clientX,y:e.clientY,pointerId:e.pointerId,mode,internal:true});
 }
 const applyPatch=(kind,id,patch)=>update(d=>({...d,[kind==='class'?'classes':'tasks']:d[kind==='class'?'classes':'tasks'].map(t=>t.id===id?{...t,...patch}:t)}));
 useEffect(()=>{
  if(!dragItem){dragRef.current=null;setPreview(null);return}
  const source=(dragItem.kind==='class'?latest.current.classes:latest.current.tasks).find(t=>t.id===dragItem.id);if(!source)return;
  const g=gridRef.current?.getBoundingClientRect();
  const state={...dragItem,source:{...source},mode:dragItem.mode||'move',moved:false,scroll:scrollRef.current?.scrollTop||0,dayWidth:g?.width/7||100};dragRef.current=state;pointRef.current={x:state.x,y:state.y};let frame;
  const calculate=(x,y)=>{
   const st=dragRef.current;if(!st)return;const dx=x-st.x,dy=y-st.y+(scrollRef.current?.scrollTop||0)-st.scroll;
   if(Math.abs(dx)>5||Math.abs(dy)>5)st.moved=true;
   if(!st.moved)return;
   const side=document.elementFromPoint(x,y)?.closest('[data-unscheduled]');
   if(side&&st.kind==='task'){setPreview({sidebar:true,id:st.id});return}
   if(view==='month'){
    const cell=document.elementFromPoint(x,y)?.closest('[data-month-date]');setPreview(cell?{date:cell.dataset.monthDate,start:'09:00',duration:source.duration||60,spanDays:source.spanDays||1,id:source.id}:null);return;
   }
   const rect=gridRef.current?.getBoundingClientRect();if(!rect)return;
   let day,minute,duration=source.duration||Math.max(15,mins(source.end)-mins(source.start)),span=source.spanDays||1;
   if(!st.internal){day=clamp(Math.floor((x-rect.left)/(rect.width/7)),0,6);minute=clamp(snap((y-rect.top)/HOUR*60),0,1425);span=Math.min(span,7-day)}
   else{
    const originalDay=st.kind==='class'?source.dow:diff(source.date,start),originalStart=mins(source.start),daysMoved=Math.round(dx/st.dayWidth),timeMoved=snap(dy/HOUR*60);
    day=originalDay;minute=originalStart;
    if(st.mode==='move'){day=clamp(originalDay+daysMoved,0,7-span);minute=clamp(originalStart+timeMoved,0,Math.max(0,(st.kind==='class'?1425:1440)-duration))}
    if(st.mode==='bottom')duration=clamp(snap((source.duration||60)+dy/HOUR*60),15,1440-originalStart);
    if(st.mode==='right')span=clamp((source.spanDays||1)+daysMoved,1,7-originalDay);
    if(st.mode==='left'){const last=originalDay+(source.spanDays||1);day=clamp(originalDay+daysMoved,0,last-1);span=last-day}
   }
   setPreview({id:source.id,date:add(start,day),dow:day,start:clock(minute),duration,spanDays:span,kind:st.kind,mode:st.mode});
  };
  const move=e=>{pointRef.current={x:e.clientX,y:e.clientY};calculate(e.clientX,e.clientY)};
  
  const tick=()=>{const p=pointRef.current,el=scrollRef.current;if(p&&el&&view==='week'&&dragRef.current?.moved){const r=el.getBoundingClientRect();if(p.x>=r.left&&p.x<=r.right){const speed=p.y<r.top+45?-10:p.y>r.bottom-45?10:0;if(speed){el.scrollTop+=speed;calculate(p.x,p.y)}}}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
  const up=e=>{
   const st=dragRef.current;if(!st)return;window.removeEventListener('pointermove',move);cancelAnimationFrame(frame);
   if(st.moved){skipClick.current=true;setTimeout(()=>{skipClick.current=false},120);
    // Recompute from pointer-up coordinates using the latest preview stored below.
    const p=previewRef.current;
    if(p?.sidebar&&st.kind==='task')applyPatch('task',st.id,{date:'',start:''});
    else if(p&&p.date){if(st.kind==='class')applyPatch('class',st.id,{dow:p.dow,start:p.start,end:clock(mins(p.start)+p.duration)});else applyPatch('task',st.id,{date:p.date,start:p.start,duration:p.duration,spanDays:p.spanDays,due:source.due||p.date});setAnnouncement('Schedule saved')}
   }
   setDragItem(null);dragRef.current=null;setPreview(null);
  };
  const cancel=()=>{setDragItem(null);setPreview(null)};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});window.addEventListener('pointercancel',cancel,{once:true});
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel)};
 },[dragItem,view,start]);
 const previewRef=useRef(null);previewRef.current=preview;
 function keyboardMove(e,item,kind){if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const delta=e.key==='ArrowUp'?-15:e.key==='ArrowDown'?15:0;if(kind==='class'){const duration=mins(item.end)-mins(item.start),minute=clamp(mins(item.start)+delta,0,1425-duration);applyPatch(kind,item.id,{dow:clamp(item.dow+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0),0,6),start:clock(minute),end:clock(minute+duration)})}else{const day=clamp(diff(item.date,start)+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0),0,7-(item.spanDays||1));applyPatch(kind,item.id,{date:add(start,day),start:clock(clamp(mins(item.start)+delta,0,1440-item.duration))})}}
 function nativeDrop(e,day,time){e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(tasks.some(t=>t.id===id))applyPatch('task',id,{date:day,start:time,due:tasks.find(t=>t.id===id).due||day})}
 const visibleTasks=tasks.filter(t=>!t.done&&t.date&&t.start&&t.date<=days[6]&&add(t.date,(t.spanDays||1)-1)>=start);
 const dueWeek=tasks.filter(t=>!t.done&&t.due>=monday(today())&&t.due<=add(monday(today()),6)).length;
 const blocks=[];
 visibleTasks.forEach(t=>{const d=diff(t.date,start),left=Math.max(0,d),span=Math.min(7,d+(t.spanDays||1))-left;blocks.push({item:t,day:left,span,minute:mins(t.start),duration:Math.min(t.duration,1440-mins(t.start)),continuation:false});if(mins(t.start)+t.duration>1440&&left+1<7)blocks.push({item:t,day:left+1,span:Math.min(span,6-left),minute:0,duration:mins(t.start)+t.duration-1440,continuation:true})});
 const monthItems=d=>tasks.filter(t=>(t.date&&t.start&&covers(t,d))||(!(t.date&&t.start)&&t.due===d)).sort((a,b)=>(a.start||'99').localeCompare(b.start||'99'));
 const taskLine=(t,d)=>{const s=subject(t.subject);return <button key={t.id} className={`month-task ${t.done?'done':''}`} style={{background:s.color,color:s.text}} onClick={e=>{e.stopPropagation();setMore(null);openTask(t)}}><span>{t.done?'✓ ':t.date&&t.start?`${label(t.start)} · `:'DUE · '}{t.title}</span></button>};
 const heading=view==='week'?`${date(start).toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${date(days[6]).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`:date(anchor).toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const todayItems=[...classes.filter(c=>c.dow===(date(today()).getDay()+6)%7).map(c=>({...c,kind:'class'})),...tasks.filter(t=>!t.done&&t.start&&covers(t,today())).map(t=>({...t,kind:'task'})),...tasks.filter(t=>!t.done&&t.due===today()&&!(t.start&&covers(t,today()))).map(t=>({...t,kind:'due',start:''}))].sort((a,b)=>(a.start||'99').localeCompare(b.start||'99'));
 return <section className="calendar-v2"><header className="cal-heading" hidden><div><p className="v2-eyebrow">A LITTLE STRUCTURE, A LOT OF POSSIBILITY</p><h1>Your study space<span>.</span></h1></div><div className="cal-counters"><span><b>{dueWeek}</b> Due this week</span><span><b>{tasks.filter(t=>t.done).length}</b> Completed</span></div></header><div className="cal-toolbar"><div className="cal-period"><button aria-label="Previous period" onClick={()=>navigate(-1)} disabled={view==='week'?start<=monday(MIN):anchor.slice(0,7)<=MIN.slice(0,7)}><ChevronLeft size={19}/></button><button aria-label="Next period" onClick={()=>navigate(1)} disabled={view==='week'?start>=monday(MAX):anchor.slice(0,7)>=MAX.slice(0,7)}><ChevronRight size={19}/></button><h2>{heading}</h2></div><div className="cal-view-controls"><button onClick={goToday}>Today</button><div className="cal-segment" aria-label="Calendar view"><button aria-pressed={view==='week'} onClick={()=>changeCalendar({view:'week'})}>Week</button><button aria-pressed={view==='month'} onClick={()=>changeCalendar({view:'month'})}>Month</button></div></div></div>{toolbarContent}
 {view==='week'?<div className="week-shell" ref={scrollRef} onScroll={saveScroll}><div className="week-inner"><div className="week-day-header"><span className="timezone">LOCAL</span>{days.map(d=><div key={d} className={d===today()?'is-today':''}><span>{weekdays[(date(d).getDay()+6)%7]}</span><b>{date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</b></div>)}</div><div className="week-body"><div className="hour-labels">{Array.from({length:24},(_,h)=><span key={h} style={{top:h*HOUR}}>{label(`${pad(h)}:00`)}</span>)}</div><div className="week-grid" ref={gridRef} style={{height:24*HOUR}}>{days.map((d,i)=><div key={d} className={`week-day-column ${d===today()?'today-column':''} ${preview?.date===d?'drag-destination':''}`} onDoubleClick={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();addAt(d,clock(clamp(Math.floor((e.clientY-r.top)/HOUR)*60,0,1380)))}} onDragOver={e=>e.preventDefault()} onDrop={e=>{const r=e.currentTarget.getBoundingClientRect();nativeDrop(e,d,clock(clamp(snap((e.clientY-r.top)/HOUR*60),0,1425)))}}/>)}
 {classes.map(c=>{const s=subject(c.subject);return <div className="class-block" key={c.id} style={{left:`${c.dow/7*100}%`,width:`${100/7}%`,top:mins(c.start)/60*HOUR,height:Math.max(18,(mins(c.end)-mins(c.start))/60*HOUR),background:s.tint,'--class-color':s.color,borderColor:s.color,color:'#594239'}}><button className="class-main" onClick={()=>!skipClick.current&&openNotes(c.subject)}><BookOpen size={12}/><strong>{c.label||c.subject}</strong><small>{label(c.start)}–{label(c.end)}</small><span className="class-description">{COURSE_DESCRIPTIONS[c.subject]||'Recurring class'}</span></button><button className="block-grip class-grip" aria-label={`Move ${c.subject} class`} title="Drag to move recurring class; arrow keys also work" onPointerDown={e=>begin(e,c,'class')} onKeyDown={e=>keyboardMove(e,c,'class')}><GripVertical size={14}/></button></div>})}
 {blocks.map(({item:t,day,span,minute,duration,continuation})=>{const s=subject(t.subject),p=preview?.id===t.id&&!preview.sidebar&&preview.kind!=='class'?preview:null;const live=p&&['bottom','right','left'].includes(p.mode)&&!continuation;return <div key={`${t.id}-${continuation}`} className={`week-task-block ${dragItem?.id===t.id?'being-dragged':''}`} data-task-id={t.id} style={{left:`${(live?diff(p.date,start):day)/7*100}%`,width:`${(live?p.spanDays:span)/7*100}%`,top:(live?mins(p.start):minute)/60*HOUR,height:Math.max(16,(live?p.duration:duration)/60*HOUR),background:s.color,color:s.text}}><button className="block-check" aria-label={`Complete ${t.title}`} onClick={()=>toggleTask(t)}><span/></button><button className="block-content" onClick={()=>!skipClick.current&&openTask(t)}><strong>{t.title}</strong><small>{continuation?'Continued · ':''}{range(t)} · {s.name}</small></button><button className="block-grip" aria-label={`Move ${t.title}`} title="Drag to move; arrow keys also work" onPointerDown={e=>begin(e,t)} onKeyDown={e=>keyboardMove(e,t,'task')}><GripVertical size={15}/></button>{!continuation&&<><button className="resize-edge edge-bottom" aria-label={`Resize duration of ${t.title}`} onPointerDown={e=>begin(e,t,'task','bottom')} onKeyDown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();applyPatch('task',t.id,{duration:clamp(t.duration+(e.key==='ArrowUp'?-15:15),15,1440-mins(t.start))})}}}/><button className="resize-edge edge-left" aria-label={`Resize start day of ${t.title}`} onPointerDown={e=>begin(e,t,'task','left')} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const change=e.key==='ArrowLeft'?-1:1,oldDay=diff(t.date,start),newDay=clamp(oldDay+change,0,oldDay+(t.spanDays||1)-1);applyPatch('task',t.id,{date:add(start,newDay),spanDays:(t.spanDays||1)+oldDay-newDay})}}}/><button className="resize-edge edge-right" aria-label={`Resize end day of ${t.title}`} onPointerDown={e=>begin(e,t,'task','right')} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();applyPatch('task',t.id,{spanDays:clamp((t.spanDays||1)+(e.key==='ArrowLeft'?-1:1),1,7-day)})}}}/></>}</div>})}
 {preview&&!preview.sidebar&&preview.date&&<div className="drag-preview" style={{left:`${diff(preview.date,start)/7*100}%`,width:`${(preview.spanDays||1)/7*100}%`,top:mins(preview.start)/60*HOUR,height:Math.max(16,Math.min(preview.duration,1440-mins(preview.start))/60*HOUR)}}><span>{label(preview.start)} · {preview.spanDays||1} day{preview.spanDays>1?'s':''}</span></div>}
 </div></div></div></div>:<div className="month-shell"><div className="month-weekdays">{weekdays.map(d=><span key={d}>{d}</span>)}</div><div className="month-grid">{monthDays.map(d=>{const entries=monthItems(d);return <div key={d} data-month-date={d} className={`month-cell ${d.slice(0,7)!==anchor.slice(0,7)?'outside-month':''} ${d===today()?'today-month':''} ${preview?.date===d?'drag-destination':''}`} onDoubleClick={e=>{if(!e.target.closest('.month-task,button'))addAt(d)}} onDragOver={e=>e.preventDefault()} onDrop={e=>nativeDrop(e,d,'09:00')}><div className="month-day-number"><button aria-label={`Add task on ${d}`} onClick={()=>addAt(d)}>{date(d).getDate()}</button></div>{entries.slice(0,4).map(t=>taskLine(t,d))}{entries.length>4&&<button className="month-more" onClick={()=>setMore(d)}>+ {entries.length-4} more</button>}</div>})}</div></div>}
 <span className="cal-sr" aria-live="polite">{announcement}</span>{preview?.sidebar&&<div className="unschedule-hint">Release to move back to unscheduled</div>}
 {(agenda||more)&&<div className="cal-popover-backdrop" onPointerDown={e=>e.target===e.currentTarget&&(setAgenda(false),setMore(null))}><section className="cal-popover" role="dialog" aria-modal="true" aria-label={agenda?'Today agenda':'All tasks for date'}><header><div><p className="v2-eyebrow">{agenda?'TODAY, AT A GLANCE':'YOUR SCHEDULE'}</p><h2>{date(agenda?today():more).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2></div><button autoFocus aria-label="Close agenda" onClick={()=>{setAgenda(false);setMore(null)}}><X/></button></header>{agenda?(todayItems.length?todayItems.map(i=><button className="agenda-item" key={`${i.kind}-${i.id}`} onClick={()=>{setAgenda(false);i.kind==='class'?openNotes(i.subject):openTask(i)}}><span className="agenda-dot" style={{background:subject(i.subject).color}}/><span><strong>{i.title||i.label||i.subject}</strong><small>{i.kind==='due'?'Due today':label(i.start)} · {i.subject}{i.kind==='class'?' · Class':''}</small></span></button>):<p className="cal-empty">A quiet day. Make a little space for yourself.</p>):monthItems(more).map(t=><button className="agenda-item" key={t.id} onClick={()=>{setMore(null);openTask(t)}}><span className="agenda-dot" style={{background:subject(t.subject).color}}/><span><strong>{t.done?'✓ ':''}{t.title}</strong><small>{t.date&&t.start?label(t.start):'Due'} · {t.subject} · {t.done?'Done':'Open'}</small></span></button>)}</section></div>}
 </section>
}
