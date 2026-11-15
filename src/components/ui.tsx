/* eslint-disable @next/next/no-img-element */
import React from 'react'

import type { Media } from '@/payload-types'
import { mediaUrl } from '@/lib/media'

const isDev = process.env.NODE_ENV !== 'production'

/** Alapértelmezett sötétítés, ha a képnél nincs beállítva (pl. régebben feltöltött képek). */
const DEFAULT_OVERLAY = 40

/**
 * Kép kitöltő módban. Ha még nincs feltöltve kép, sötét hely jelenik meg;
 * fejlesztői módban egy kis címkével, hogy látszódjon, mit kell feltölteni.
 * `overlay` esetén a képnél (Payloadban) beállított erősségű fekete réteg kerül fölé.
 */
export function Photo({
  media,
  size = 'large',
  hint,
  className = '',
  priority = false,
  overlay = false,
}: {
  media: Media | null
  size?: 'card' | 'large' | 'hero'
  hint?: string
  className?: string
  priority?: boolean
  overlay?: boolean
}) {
  const src = mediaUrl(media, size)
  if (src) {
    const opacity = Math.min(Math.max(media?.overlay ?? DEFAULT_OVERLAY, 0), 100) / 100
    return (
      <>
        <PhotoImg src={src} media={media} className={className} priority={priority} />
        {overlay && opacity > 0 ? (
          <div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity }} />
        ) : null}
      </>
    )
  }
  return (
    <div aria-hidden="true" className={`absolute inset-0 bg-surface-2 ${className}`}>
      {isDev && hint ? (
        <span className="absolute top-3 left-3 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] text-silver">
          FOTÓ – {hint}
        </span>
      ) : null}
    </div>
  )
}

function PhotoImg({ src, media, className, priority }: { src: string; media: Media | null; className: string; priority: boolean }) {
  return (
    <img
      src={src}
      alt={media?.alt ?? ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={
        media?.focalX != null && media?.focalY != null
          ? { objectPosition: `${media.focalX}% ${media.focalY}%` }
          : undefined
      }
    />
  )
}

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] uppercase ${className}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
      {children}
    </p>
  )
}

export function ArrowRight({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function Chevron({ dir = 'right', className = 'size-3' }: { dir?: 'left' | 'right' | 'down'; className?: string }) {
  const d = dir === 'left' ? 'M15 6l-6 6 6 6' : dir === 'down' ? 'M6 9l6 6 6-6' : 'M9 6l6 6-6 6'
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function PlayIcon({ className = 'size-2.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4l13 8-13 8z" />
    </svg>
  )
}

export const container = 'mx-auto w-full max-w-[1240px] px-5 sm:px-6'

export function FlagHU({ className = 'h-4 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 6 3" preserveAspectRatio="none" aria-hidden="true">
      <rect width="6" height="1" fill="#CE2939" />
      <rect y="1" width="6" height="1" fill="#FFFFFF" />
      <rect y="2" width="6" height="1" fill="#477050" />
    </svg>
  )
}

export function FlagGB({ className = 'h-4 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30 0V30M0 15H60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

/** Nyelvválasztó zászlókkal. Az aktív nyelv teljes fényerővel, a másik halványítva. */
export function LangSwitch({
  locale,
  hrefs = { hu: '/', en: '/en' },
  className = '',
  size = 'h-4 w-6',
}: {
  locale: 'hu' | 'en'
  /** Az aktuális oldal megfelelője a két nyelven (pl. /kiallitok ↔ /en/exhibitors). */
  hrefs?: { hu: string; en: string }
  className?: string
  size?: string
}) {
  const items = [
    { code: 'hu' as const, href: hrefs.hu, label: 'Magyar', Flag: FlagHU },
    { code: 'en' as const, href: hrefs.en, label: 'English', Flag: FlagGB },
  ]
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {items.map(({ code, href, label, Flag }) => {
        const active = code === locale
        return (
          <a
            key={code}
            href={href}
            hrefLang={code}
            lang={code}
            aria-label={label}
            title={label}
            aria-current={active ? 'page' : undefined}
            className={`grid min-h-10 min-w-10 place-items-center rounded-md transition ${
              active ? 'opacity-100' : 'opacity-45 hover:opacity-100'
            }`}
          >
            <Flag className={`${size} overflow-hidden rounded-[3px] ring-1 ring-white/25`} />
          </a>
        )
      })}
    </div>
  )
}
