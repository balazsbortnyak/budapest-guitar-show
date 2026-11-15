/* eslint-disable @next/next/no-img-element */
import React from 'react'

export type ExhibitorItem = {
  id: number | string
  name: string
  exhibitor?: string | null
  website?: string | null
  logo?: string | null
}

/** Egy márka kártyája: logó fekete csempén, alatta a név és hogy ki hozza. */
export function ExhibitorCard({ item, broughtBy }: { item: ExhibitorItem; broughtBy: string }) {
  const body = (
    <>
      <span className="relative grid aspect-[3/2] place-items-center overflow-hidden rounded-[10px] border border-line bg-black transition duration-300 group-hover:border-orange group-hover:shadow-[0_8px_40px_-12px_rgba(255,106,0,0.6)]">
        {item.logo ? (
          <img
            src={item.logo}
            alt=""
            loading="lazy"
            className="max-h-[68%] max-w-[78%] object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="px-3 text-center text-lg font-semibold tracking-[-0.02em] text-silver">
            {item.name}
          </span>
        )}
      </span>
      <span className="mt-2.5 flex flex-col gap-0.5 px-0.5">
        <span className="text-sm font-semibold tracking-[-0.01em] text-white transition group-hover:text-orange">
          {item.name}
        </span>
        {item.exhibitor ? (
          <span className="text-xs text-muted">
            {broughtBy} {item.exhibitor}
          </span>
        ) : null}
      </span>
    </>
  )

  return item.website ? (
    <a
      href={item.website}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col"
    >
      {body}
    </a>
  ) : (
    <div className="group flex flex-col">{body}</div>
  )
}

export function ExhibitorApplyBanner({
  href,
  eyebrow,
  heading,
  text,
  cta,
}: {
  href: string
  eyebrow: string
  heading: string
  text: string
  cta: string
}) {
  return (
    <div
      data-reveal=""
      className="glow-orange relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[14px] border border-orange/40 bg-surface px-6 py-10 sm:px-10 sm:py-12"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-orange/25 blur-3xl"
      />
      <div className="relative max-w-[560px] flex-[1_1_380px]">
        <p className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-orange uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-orange" />
          {eyebrow}
        </p>
        <h3 className="text-[clamp(28px,3.2vw,42px)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
          {heading}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-silver">{text}</p>
      </div>
      <a
        href={href}
        className="relative flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-orange hover:text-white"
      >
        {cta}
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  )
}
