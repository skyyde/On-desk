// All subject identity and external destinations live here. Course-specific Canvas
// IDs and the student's ArchersHub URL are supplied through the link editor.
export const SUBJECTS = [
  { id: 'CSOPESY', name: 'CSOPESY', color: '#64463D', text: '#FFF7EE', tint: '#E9DED7' },
  { id: 'LCASEAN', name: 'LCASEAN', color: '#C98F99', text: '#422B30', tint: '#F2E0E3' },
  { id: 'NSETRON', name: 'NSETRON', color: '#E6D2AC', text: '#503B2E', tint: '#F3EBD9' },
  { id: 'CSSWENG', name: 'CSSWENG', color: '#81716B', text: '#FFF8F1', tint: '#E9E3DF' },
  { id: 'NSCOM03', name: 'NSCOM03', color: '#C6B7A9', text: '#48372D', tint: '#EEE7E0' },
  { id: 'Extracurricular', name: 'Extracurricular', color: '#B96F66', text: '#241410', tint: '#F1DEDA' },
];
export const QUICK_LINKS = [
  { id: 'gmail', title: 'Gmail', url: 'https://mail.google.com/' },
  { id: 'canvas', title: 'Canvas', url: 'https://dlsu.instructure.com/' },
  { id: 'archershub', title: 'ArchersHub', url: '' },
  { id: 'docs', title: 'Google Docs', url: 'https://docs.google.com/document/' },
  { id: 'sheets', title: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/' },
  { id: 'animohop', title: 'AnimoHop', url: 'https://animohop.netlify.app/' },
];
export const COURSE_LINKS = ['NSETRON', 'CSSWENG', 'LCASEAN', 'CSOPESY', 'NSCOM03'].map(subject => ({ id: subject, subject, title: subject, url: '' }));
export const SEMESTER_START = '2026-09-01';
export const SEMESTER_END = '2026-12-31';
export const subjectById = subject => SUBJECTS.find(item => item.id === subject) || SUBJECTS[0];

export const COURSE_DESCRIPTIONS = {NSETRON:'Practical Electricity & Electronics', CSSWENG:'Software Engineering', LCASEAN:'The Filipino and ASEAN', CSOPESY:'Introduction to Operating Systems', NSCOM03:'Data Communications'};
