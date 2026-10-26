import { create } from 'zustand'

/** Uploaded pictures by uid, as data URLs. Filled when an account syncs and when a standings page loads. */
export const useAvatarCache = create<{ urls: Record<string, string> }>(() => ({ urls: {} }))

export function setCustomAvatar(uid: string, url: string | null): void {
  useAvatarCache.setState((s) => {
    const urls = { ...s.urls }
    if (url) urls[uid] = url
    else delete urls[uid]
    return { urls }
  })
}

const asked = new Set<string>()

/** Fetch the uploaded pictures for these accounts, skipping ones already fetched. */
export async function loadCustomAvatars(uids: string[]): Promise<void> {
  const need = [...new Set(uids)].filter((u) => !asked.has(u))
  if (need.length === 0) return
  need.forEach((u) => asked.add(u))
  try {
    const { fetchAvatars } = await import('../leaderboard/api')
    const found = await fetchAvatars(need)
    useAvatarCache.setState((s) => ({ urls: { ...s.urls, ...found } }))
  } catch (err) {
    console.error(err)
    need.forEach((u) => asked.delete(u))
  }
}
