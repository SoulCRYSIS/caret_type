import { describe, expect, it } from 'vitest'
import { AVATARS, CUSTOM_AVATAR, defaultAvatar, isAvatarId, resolveAvatar } from './avatars'

describe('avatars', () => {
  it('treats "custom" as valid but never as a built-in face', () => {
    expect(isAvatarId(CUSTOM_AVATAR)).toBe(true)
    expect(AVATARS.some((a) => a.id === CUSTOM_AVATAR)).toBe(false)
  })

  it('rejects unknown ids', () => {
    expect(isAvatarId('definitely-not-a-face')).toBe(false)
    expect(isAvatarId('')).toBe(false)
  })

  it('resolves an uploaded picture to nothing (it lives in the cache)', () => {
    expect(resolveAvatar(CUSTOM_AVATAR, 'uid1')).toBeNull()
  })

  it('falls back to a stable default per user, or nothing when the folder is empty', () => {
    expect(defaultAvatar('uid1')?.id).toBe(defaultAvatar('uid1')?.id)
    if (AVATARS.length === 0) expect(resolveAvatar(null, 'uid1')).toBeNull()
    else expect(resolveAvatar('nope', 'uid1')).toEqual(defaultAvatar('uid1'))
  })
})
