/**
 * Profile faces come in two kinds:
 *  - built-in: 128×128 `.png` files in src/assets/avatars/. The file name (lowercase letters, digits
 *    and hyphens, e.g. `sleepy-cat.png`) is the id stored on the account.
 *  - uploaded: the player's own picture, resized to 128×128 in the browser (see resizeAvatar.ts).
 *    The account stores the id `custom` and the picture lives in its own document.
 * With no built-in files yet, accounts without a picture show the first letter of their name.
 */
export interface AvatarDef {
  id: string
  url: string
}

/** The id an account stores when it uses an uploaded picture. */
export const CUSTOM_AVATAR = 'custom'
export const AVATAR_SIZE = 128

const files = import.meta.glob('../../assets/avatars/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const AVATARS: AvatarDef[] = Object.entries(files)
  .map(([path, url]) => ({ id: path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url }))
  .filter((a) => /^[a-z0-9-]{1,32}$/.test(a.id) && a.id !== CUSTOM_AVATAR)
  .sort((a, b) => a.id.localeCompare(b.id))

export const isAvatarId = (v: unknown): v is string => v === CUSTOM_AVATAR || (typeof v === 'string' && AVATARS.some((a) => a.id === v))

/** A stable built-in face for accounts that haven't picked one; null when there are none yet. */
export function defaultAvatar(uid: string): AvatarDef | null {
  if (AVATARS.length === 0) return null
  let h = 0
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0
  return AVATARS[h % AVATARS.length]
}

/** The built-in face for an id (or the account's default). Uploaded pictures go through the cache instead. */
export const resolveAvatar = (id: string | null | undefined, uid: string): AvatarDef | null =>
  AVATARS.find((a) => a.id === id) ?? (id === CUSTOM_AVATAR ? null : defaultAvatar(uid))
