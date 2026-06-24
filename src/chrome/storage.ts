export function getStorageValue<T>(key: string): Promise<T | undefined> {
  return chrome.storage.sync.get(key).then(
    (data) => data[key] as T | undefined,
  )
}

export function setStorageValue(key: string, value: unknown): Promise<void> {
  return chrome.storage.sync.set({ [key]: value })
}
