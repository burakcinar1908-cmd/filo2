// Web shim for expo-secure-store (browser preview only).
// Maps the getItem/setItem/deleteItem API onto localStorage.
// Native platforms use the real module via Metro resolver.
const memoryFallback = new Map();

async function getItemAsync(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function setItemAsync(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryFallback.set(key, value);
  }
}

async function deleteItemAsync(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}

export { getItemAsync, setItemAsync, deleteItemAsync };
