import { AVATAR_SIZE } from './avatars'

/** What a stored picture may weigh once encoded; the security rules enforce the same bound. */
export const MAX_AVATAR_CHARS = 100_000
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

export const DATA_PREFIX = 'data:image/png;base64,'

/**
 * Turn any picture into a square 128×128 PNG data URL: centre-cropped, then smoothly scaled.
 * Throws an Error whose message is fit to show the player.
 */
export async function resizeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') throw new Error('Choose a PNG, JPEG, WebP or GIF picture.')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('That picture is too large. Pick one under 12 MB.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error("That file couldn't be read as a picture.")
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    // Photos with lots of detail can encode large; step the size down until it fits.
    for (const size of [AVATAR_SIZE, 112, 96, 80, 64]) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const g = canvas.getContext('2d')
      if (!g) throw new Error("This browser can't resize pictures.")
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = 'high'
      g.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
      const url = canvas.toDataURL('image/png')
      if (url.length - DATA_PREFIX.length <= MAX_AVATAR_CHARS) return url
    }
    throw new Error('That picture is too detailed to shrink. Try a simpler one.')
  } finally {
    bitmap.close()
  }
}
