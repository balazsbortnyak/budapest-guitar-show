'use client'

import React, { useId, useState } from 'react'

export function FaqList({ items }: { items: { id: number | string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number>(0)
  const baseId = useId()

  return (
    <div className="border-t border-line">
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${baseId}-panel-${i}`
        return (
          <div key={item.id} className="border-b border-line">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-[68px] w-full items-center justify-between gap-6 py-[18px] text-left text-[17px] font-medium tracking-[-0.02em] text-white"
              >
                {item.question}
                <svg
                  className={`size-4 flex-none transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </h3>
            <div id={panelId} hidden={!isOpen}>
              <p className="pr-12 pb-[22px] text-[15px] leading-relaxed whitespace-pre-line text-muted">{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
