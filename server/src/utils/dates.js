export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
export function startOfWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
