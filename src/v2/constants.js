// All subject identity and external destinations live here. Course-specific Canvas
// IDs and the student's ArchersHub URL are supplied through the link editor.
export const SUBJECTS = [
  { id: 'CSOPESY', name: 'CSOPESY', color: '#9B8276', text: '#2F2520', tint: '#EAE0D9' },
  { id: 'LCASEAN', name: 'LCASEAN', color: '#D8A7B3', text: '#422C34', tint: '#F6E8EC' },
  { id: 'NSETRON', name: 'NSETRON', color: '#E4D1AE', text: '#51412F', tint: '#F5EDDC' },
  { id: 'CSSWENG', name: 'CSSWENG', color: '#A6B89A', text: '#30412F', tint: '#E8EEE3' },
  { id: 'NSCOM03', name: 'NSCOM03', color: '#A8ADB3', text: '#303942', tint: '#E8EAED' },
  { id: 'Extracurricular', name: 'Extracurricular', color: '#E6BDC6', text: '#51343C', tint: '#F8EBEE' },
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
