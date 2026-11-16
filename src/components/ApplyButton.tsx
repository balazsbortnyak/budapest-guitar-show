'use client'

import React, { useEffect, useRef, useState } from 'react'

export type ApplicationsClosed = {
  title: string
  text: string
  contactLabel: string
  email?: string | null
  ok: string
}

/**
 * „Kiállítóként jelentkezem” gomb. Ha a jelentkezés nyitva van, sima link a jelentkezési oldalra;
 * ha zárva (Payload → Kiállítói jelentkezés → „A jelentkezés nyitva van” kikapcsolva), felugró ablakot nyit.
 */
export function ApplyButton({
  href,
  closed,
  className,
  children,
}: {
  href: string
  closed: ApplicationsClosed | null
  className: string
  children: React.ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!closed) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={className}
      >
        {children}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="apply-closed-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-auto w-[min(520px,calc(100vw-32px))] overflow-hidden rounded-[16px] border border-orange/40 bg-surface p-0 text-white shadow-[0_0_80px_-20px_rgba(255,106,0,0.55)] backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pt-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-orange/25 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="relative mb-5 grid size-12 place-items-center rounded-full bg-orange/15 text-orange"
          >
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <h2
            id="apply-closed-title"
            className="relative text-[clamp(24px,4vw,30px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance"
          >
            {closed.title}
          </h2>
          <p className="relative mt-3 text-[15px] leading-relaxed whitespace-pre-line text-silver">
            {closed.text}
          </p>
          {closed.email ? (
            <p className="relative mt-5 text-sm text-silver">
              {closed.contactLabel}{' '}
              <a
                href={`mailto:${closed.email}`}
                className="font-semibold text-white underline-offset-4 hover:text-orange hover:underline"
              >
                {closed.email}
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-line px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => setOpen(false)}
            autoFocus
            className="min-h-11 rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-orange hover:text-white"
          >
            {closed.ok}
          </button>
        </div>
      </dialog>
    </>
  )
}
