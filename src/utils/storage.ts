export function getStorage<T>(key: string, fallback: T): T {
  try {
    const value = uni.getStorageSync(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T) {
  uni.setStorageSync(key, JSON.stringify(value));
}

export function removeStorage(key: string) {
  uni.removeStorageSync(key);
}
