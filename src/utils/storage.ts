export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  localStorage.setItem(key, JSON.stringify(value));
}
