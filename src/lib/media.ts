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

const SIZE_ORDER = ['card', 'large', 'hero'] as const
const MAX_WIDTH = { card: 640, large: 1600, hero: 2400 } as const

/**
 * Reszponzív `srcset`: a kért méretig az összes elérhető változat, hogy a böngésző
 * (mobilon) a kisebbet tölthesse le. Az eredeti fájl csak akkor kerül bele, ha nem nagyobb a kért méretnél.
 */
export function mediaSrcSet(
  media: Media | null,
  size: 'card' | 'large' | 'hero' = 'large',
): string | undefined {
  if (!media) return undefined
  const max = MAX_WIDTH[size]
  const candidates: { url: string; width: number }[] = []
  for (const name of SIZE_ORDER) {
    const s = media.sizes?.[name]
    if (s?.url && s.width && s.width <= max) candidates.push({ url: s.url, width: s.width })
  }
  if (media.url && media.width && media.width <= max)
    candidates.push({ url: media.url, width: media.width })
  const unique = [...new Map(candidates.map((c) => [c.width, c])).values()].sort(
    (a, b) => a.width - b.width,
  )
  return unique.length > 1 ? unique.map((c) => `${c.url} ${c.width}w`).join(', ') : undefined
}
