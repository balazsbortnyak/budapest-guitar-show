'use client'

import React, { useEffect, useState } from 'react'

/**
 * Mobil menü: teljes szélességű lenyíló panel nagy érintési felületekkel.
 * Linkre kattintva, Escape-re vagy a háttérre kattintva bezáródik.
 */
export function MobileMenu({
  items,
  menuLabel,
  closeLabel,
  footer,
}: {
  items: { href: string; label: string }[]
  menuLabel: string
  closeLabel: string
  footer?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : menuLabel}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 grid size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-orange"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <div
        hidden={!open}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 top-0 z-40 max-h-svh overflow-y-auto rounded-b-2xl border-b border-line bg-ink px-5 pt-[calc(env(safe-area-inset-top)+84px)] pb-6 shadow-2xl"
      >
        <nav className="flex flex-col">
          {items.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center border-b border-line text-[22px] font-semibold tracking-[-0.03em] transition hover:text-orange"
            >
              {n.label}
            </a>
          ))}
        </nav>
        {footer ? <div className="mt-5" onClick={() => setOpen(false)}>{footer}</div> : null}
      </div>
    </div>
  )
}
