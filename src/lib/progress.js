const KEY = 'vaani-learn-attempts';

export function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAttempt(attempt) {
  const list = loadAttempts();
  list.unshift({ ...attempt, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  return list;
}
