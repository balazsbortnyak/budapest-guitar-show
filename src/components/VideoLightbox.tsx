'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * Link, ami kattintásra az oldalon belül, felugró ablakban játssza le a YouTube videót.
 * A YouTube (youtube-nocookie) csak kattintás után töltődik be. JS nélkül sima link a YouTube-ra.
 */
export function VideoLightbox({
  videoId,
  title,
  closeLabel,
  className = '',
  children,
}: {
  videoId: string
  title: string
  closeLabel: string
  className?: string
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

  return (
    <>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return
          e.preventDefault()
          setOpen(true)
        }}
        className={className}
      >
        {children}
      </a>
      <dialog
        ref={dialog}
        aria-label={title}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-auto w-[min(1100px,calc(100vw-32px))] overflow-visible bg-transparent p-0 text-white backdrop:bg-black/85 backdrop:backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={closeLabel}
          className="absolute -top-14 right-0 grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-orange"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-[10px] bg-black">
          {open ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full"
            />
          ) : null}
        </div>
      </dialog>
    </>
  )
}
