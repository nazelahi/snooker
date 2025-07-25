
// A simple wrapper for localStorage that handles serialization and SSR.

export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch (e) {
      console.error(`Error parsing JSON from localStorage for key "${key}"`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const item = JSON.stringify(value);
    localStorage.setItem(key, item);
  } catch (e) {
    console.error(`Error saving to localStorage for key "${key}"`, e);
  }
}
