const namespace = 'askr-ride'

export const localStorageRepository = {
  read<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(`${namespace}:${key}`) ?? '') as T } catch { return fallback }
  },
  write<T>(key: string, value: T) {
    try { localStorage.setItem(`${namespace}:${key}`, JSON.stringify(value)) } catch { /* Storage is an enhancement. */ }
  },
}

// Keep screens dependent on this interface so a Supabase repository can replace it later.
export type RideRepository = typeof localStorageRepository
