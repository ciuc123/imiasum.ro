import y2024 from './2024.json';
export const posts=[...y2024].sort((a,b)=>b.date.localeCompare(a.date));
