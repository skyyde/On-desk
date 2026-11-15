export const PLANNER_SUBJECTS = ['NSETRON', 'CSOPESY', 'NSCOM03', 'CSSWENG', 'LCASEAN'];
export const WEEK_STATUSES = ['—', 'To do', 'In progress', 'Done'];
export const DEADLINE_STATUSES = ['—', 'Not Started', 'In Progress', 'Done'];
export const plannerId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const blankWeek = (label = 'New week') => ({id: plannerId(), label, topics: Object.fromEntries(PLANNER_SUBJECTS.map(id=>[id,''])), statuses: Object.fromEntries(PLANNER_SUBJECTS.map(id=>[id,'To do'])), deadline:''});
export const blankDeadline = (subject = 'NSETRON') => ({id:plannerId(),subject,type:'',deliverable:'',timing:'',date:'',weight:'',note:'',status:'Not Started'});
export const blankComponent = () => ({id:plannerId(),name:'',weight:'',note:''});
const topicSeeds = {
 NSETRON:['Network models and protocols','Signals and transmission','Data link fundamentals','Ethernet and switching','IP addressing','Subnetting workshop','Routing fundamentals','Midterm review','Transport protocols','Application protocols','Wireless networks','Network security','Network design project','Project presentations','Final review'],
 CSOPESY:['Operating systems overview','Processes and threads','CPU scheduling','Synchronization','Deadlocks','Memory management','Virtual memory','Midterm review','File systems','I/O systems','Storage management','Protection and security','Systems project','Project demonstrations','Final review'],
 NSCOM03:['Communication foundations','Technical vocabulary','Reading and analysis','Audience and purpose','Presentation structure','Evidence and argument','Speaking workshop','Midterm assessment','Collaborative communication','Technical writing','Visual communication','Draft workshop','Final presentation preparation','Presentations','Reflection and review'],
 CSSWENG:['Software engineering overview','Requirements gathering','User stories','Analysis and modeling','Architecture','Interface design','Implementation planning','Project checkpoint','Testing fundamentals','Integration testing','Quality assurance','Deployment planning','Project refinement','Final demonstration','Project retrospective'],
 LCASEAN:['Introducing ASEAN','Regional history','Institutions and cooperation','Cultural diversity','Regional identities','Economic integration','Social issues','Midterm review','Environment and sustainability','Regional security','Mobility and migration','Case study workshop','Research presentations','Synthesis','Final assessment'],
};
export function createPlanner(){
 const weeks=Array.from({length:15},(_,i)=>({...blankWeek(i===14?'Finals Week':`Week ${i+1}`),topics:Object.fromEntries(PLANNER_SUBJECTS.map(s=>[s,topicSeeds[s][i]])),deadline:i===7?'Example: midterm assessments':i===13?'Example: project presentations':i===14?'Example: final assessments':''}));
 const deadlines=PLANNER_SUBJECTS.flatMap((subject,i)=>[{...blankDeadline(subject),type:'Project',deliverable:`Example ${subject} project checkpoint`,timing:'Week 8',date:`2026-10-${String(19+i).padStart(2,'0')}`,weight:'20',note:'Example only — confirm against your syllabus.'},{...blankDeadline(subject),type:'Assessment',deliverable:`Example ${subject} final assessment`,timing:'Finals Week',date:`2026-12-${String(14+i).padStart(2,'0')}`,weight:'30',note:'Tentative example date — replace with the official schedule.'}]);
 const grading=Object.fromEntries(PLANNER_SUBJECTS.map(subject=>[subject,[{id:plannerId(),name:'Coursework',weight:'30',note:'Example weighting'},{id:plannerId(),name:'Project',weight:'30',note:'Replace with your syllabus'},{id:plannerId(),name:'Assessments',weight:'40',note:'Example weighting'}]]));
 return {weeks,deadlines,grading};
}
