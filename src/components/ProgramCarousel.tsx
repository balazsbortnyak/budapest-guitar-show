'use client'

import React, { useRef } from 'react'

import { Chevron } from './ui'

export function ProgramCarousel({
  heading,
  allLabel,
  prevLabel,
  nextLabel,
  children,
}: {
  heading: string
  allLabel: string
  prevLabel: string
  nextLabel: string
  children: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 740), behavior: 'smooth' })
  }

  return (
    <section id="program" className="scroll-mt-24 pt-10">
      <div data-reveal="" className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 pb-5 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h2 className="text-[22px] font-semibold tracking-[-0.035em]">{heading}</h2>
          <a href="#program" className="flex items-center gap-1 text-xs font-medium whitespace-nowrap text-muted hover:text-white">
            {allLabel}
            <Chevron />
          </a>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={prevLabel}
            className="grid size-11 place-items-center rounded-full bg-raised text-white transition hover:bg-orange"
          >
            <Chevron dir="left" className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={nextLabel}
            className="grid size-11 place-items-center rounded-full bg-raised text-white transition hover:bg-orange"
          >
            <Chevron className="size-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-5 pr-5 pl-5 sm:scroll-px-6 sm:pl-6 xl:scroll-pl-[calc((100vw-1240px)/2+24px)] xl:pl-[calc((100vw-1240px)/2+24px)]"
      >
        {children}
      </div>
    </section>
  )
}
