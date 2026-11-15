'use client'

import React, { useDeferredValue, useMemo, useState } from 'react'

import { ExhibitorCard, type ExhibitorItem } from './ExhibitorCard'

/** Ékezet- és kisbetű-független összehasonlításhoz. */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

export function ExhibitorBrowser({
  items,
  labels,
}: {
  items: ExhibitorItem[]
  labels: {
    search: string
    placeholder: string
    results: string
    noResults: string
    clear: string
    broughtBy: string
  }
}) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)

  const indexed = useMemo(
    () => items.map((item) => ({ item, key: normalize(`${item.name} ${item.exhibitor ?? ''}`) })),
    [items],
  )
  const q = normalize(deferred)
  const visible = q ? indexed.filter((x) => x.key.includes(q)).map((x) => x.item) : items

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="relative block w-full max-w-[480px] flex-[1_1_320px]">
          <span className="sr-only">{labels.search}</span>
          <svg
            className="pointer-events-none absolute top-1/2 left-[18px] size-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.placeholder}
            aria-label={labels.search}
            autoComplete="off"
            className="min-h-13 w-full rounded-full border border-[#2e2e35] bg-surface pr-12 pl-11 text-[15px] text-white placeholder:text-faint focus:border-orange focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={labels.clear}
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-orange hover:text-white"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </label>
        <p className="text-sm text-muted" aria-live="polite">
          {visible.length} {labels.results}
        </p>
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((item) => (
            <li key={item.id}>
              <ExhibitorCard item={item} broughtBy={labels.broughtBy} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[14px] border border-line px-6 py-14 text-center">
          <p className="text-[17px] text-silver">
            {labels.noResults} <strong className="text-white">„{query}”</strong>
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-5 min-h-11 rounded-full bg-orange px-5 text-[13px] font-semibold text-white transition hover:bg-accent-strong"
          >
            {labels.clear}
          </button>
        </div>
      )}
    </div>
  )
}
