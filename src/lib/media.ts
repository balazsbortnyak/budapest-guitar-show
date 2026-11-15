import type { Media } from '@/payload-types'

/** Feltöltés-mezőből használható kép (vagy null, ha nincs megadva). */
export function asMedia(value: unknown): Media | null {
  if (value && typeof value === 'object' && 'url' in value) return value as Media
  return null
}

export function mediaUrl(media: Media | null, size?: 'card' | 'large' | 'hero'): string | null {
  if (!media) return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size]!.url!
  return media.url ?? null
}
