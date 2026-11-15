'use client'

import { useEffect } from 'react'

/**
 * Figyeli a [data-reveal] elemeket, és amikor a képernyőre érnek, megkapják az
 * .is-visible osztályt (a CSS animálja őket). Az egyszerre megjelenő elemek
 * lépcsőzetesen, kis késleltetéssel úsznak be.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          el.style.setProperty('--delay', `${Math.min(i, 6) * 90}ms`)
          el.classList.add('is-visible')
          io.unobserve(el)
          i++
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
