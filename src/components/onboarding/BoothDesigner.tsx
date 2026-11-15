'use client'

import React from 'react'

import { formatNumber } from '@/lib/onboarding'
import type { OnboardingDict } from '@/lib/onboardingI18n'

const PRESETS: [number, number][] = [
  [2, 2],
  [3, 2],
  [3, 3],
  [4, 3],
  [6, 4],
  [6, 6],
  [8, 6],
]

export function BoothDesigner({
  width,
  depth,
  minSide,
  maxSide,
  minArea,
  locale,
  t,
  onChange,
}: {
  width: number
  depth: number
  minSide: number
  maxSide: number
  minArea: number
  locale: 'hu' | 'en'
  t: OnboardingDict['booth']
  onChange: (next: { width: number; depth: number }) => void
}) {
  const area = width * depth
  const tooSmall = area < minArea
  const fmt = (n: number) => formatNumber(n, locale)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
      <div className="flex flex-col gap-5">
        <SideInput label={t.width} value={width} min={minSide} max={maxSide} t={t} locale={locale} onChange={(w) => onChange({ width: w, depth })} />
        <SideInput label={t.depth} value={depth} min={minSide} max={maxSide} t={t} locale={locale} onChange={(d) => onChange({ width, depth: d })} />
        <div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.06em] text-faint uppercase">{t.presets}</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.filter(([w, d]) => w >= minSide && d >= minSide && w <= maxSide && d <= maxSide && w * d >= minArea).map(([w, d]) => {
              const active = w === width && d === depth
              return (
                <button
                  key={`${w}x${d}`}
                  type="button"
                  onClick={() => onChange({ width: w, depth: d })}
                  aria-pressed={active}
                  className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${
                    active ? 'border-orange bg-orange text-white' : 'border-line bg-ink text-silver hover:border-orange hover:text-white'
                  }`}
                >
                  {w}×{d}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[12px] border border-line bg-[#08080b]">
        <BoothSvg width={width} depth={depth} tooSmall={tooSmall} t={t} fmt={fmt} />
        <div className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-right backdrop-blur" aria-live="polite">
          <span className={`text-lg font-semibold tracking-[-0.02em] ${tooSmall ? 'text-[#ff8a66]' : 'text-white'}`}>
            {fmt(area)} {t.sqm}
          </span>
        </div>
        {tooSmall ? (
          <p className="absolute inset-x-3 bottom-3 rounded-lg bg-black/80 px-3 py-2 text-center text-xs text-[#ff8a66]">
            {t.tooSmall.replace('{min}', fmt(minArea))}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SideInput({
  label,
  value,
  min,
  max,
  t,
  locale,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  t: OnboardingDict['booth']
  locale: 'hu' | 'en'
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 2) / 2))
  const id = `booth-${label}`
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-silver">
        {label} ({t.m})
      </label>
      <div className="flex items-center gap-2">
        <StepButton label={t.decrease} disabled={value <= min} onClick={() => onChange(clamp(value - 0.5))}>
          −
        </StepButton>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={0.5}
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value.replace(',', '.'))
            if (Number.isFinite(v)) onChange(clamp(v))
          }}
          className="min-h-12 w-full min-w-0 rounded-xl border border-[#2e2e35] bg-ink text-center text-lg font-semibold text-white [appearance:textfield] focus:border-orange focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-describedby={`${id}-range`}
        />
        <StepButton label={t.increase} disabled={value >= max} onClick={() => onChange(clamp(value + 0.5))}>
          +
        </StepButton>
      </div>
      <p id={`${id}-range`} className="sr-only">
        {formatNumber(min, locale)}–{formatNumber(max, locale)} {t.m}
      </p>
    </div>
  )
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-12 flex-none place-items-center rounded-xl border border-line bg-raised text-xl text-white transition hover:border-orange hover:bg-orange disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  )
}

/** Felülnézeti rajz: 1 m-es rács, a stand narancs téglalapként, méretvonalakkal, hátfallal és folyosóval. */
function BoothSvg({
  width,
  depth,
  tooSmall,
  t,
  fmt,
}: {
  width: number
  depth: number
  tooSmall: boolean
  t: OnboardingDict['booth']
  fmt: (n: number) => string
}) {
  // 10 m-ig állandó a lépték (így látszik a méretkülönbség), afölött a rajz „kizoomol”.
  const span = Math.max(10, width, depth)
  const pad = 2.2
  const S = 40 // px / m a viewBoxban
  const vw = (span + pad * 2) * S
  const bw = width * S
  const bd = depth * S
  const x = (vw - bw) / 2
  const y = 1.9 * S // felül hely a szélesség-méretvonalnak és a léptéknek
  const aisleY = y + bd + 0.35 * S
  // Legalább 6 m mélységnyi helyet hagyunk, hogy a rajz ne ugráljon kis standoknál.
  const vh = y + Math.max(bd, Math.max(6, span * 0.6) * S) + 2 * S
  const color = tooSmall ? '#ff8a66' : '#ff6a00'

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="block h-auto w-full" role="img" aria-label={`${fmt(width)} × ${fmt(depth)} ${t.m}`}>
      <defs>
        <pattern id="booth-grid" width={S} height={S} patternUnits="userSpaceOnUse">
          <path d={`M ${S} 0 L 0 0 0 ${S}`} fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#booth-grid)" />

      {/* Folyosó a stand előtt */}
      <rect x={0} y={aisleY} width={vw} height={1.2 * S} fill="#ffffff" fillOpacity="0.035" />
      <text x={vw / 2} y={aisleY + 0.75 * S} textAnchor="middle" fill="#8a8a8f" fontSize={13} fontFamily="ui-monospace, monospace" letterSpacing="2">
        {t.aisle.toUpperCase()}
      </text>

      {/* Stand */}
      <g style={{ transition: 'all 300ms cubic-bezier(0.2,0.7,0.2,1)' }}>
        <rect x={x} y={y} width={bw} height={bd} rx={4} fill={color} fillOpacity="0.14" stroke={color} strokeWidth={2} />
        {/* méterenkénti osztás a standon belül */}
        {Array.from({ length: Math.ceil(width) - 1 }, (_, i) => (
          <line key={`v${i}`} x1={x + (i + 1) * S} y1={y} x2={x + (i + 1) * S} y2={y + bd} stroke={color} strokeOpacity="0.18" />
        ))}
        {Array.from({ length: Math.ceil(depth) - 1 }, (_, i) => (
          <line key={`h${i}`} x1={x} y1={y + (i + 1) * S} x2={x + bw} y2={y + (i + 1) * S} stroke={color} strokeOpacity="0.18" />
        ))}
        {/* hátfal */}
        <rect x={x} y={y - 5} width={bw} height={6} rx={2} fill={color} />
        <text x={x + bw / 2} y={y + bd / 2 + 6} textAnchor="middle" fill="#fff" fontSize={Math.min(26, Math.max(14, bw / 6))} fontWeight={600}>
          {fmt(width * depth)} {t.sqm}
        </text>
      </g>

      {/* méretvonal: szélesség (felül) */}
      <g stroke="#a3a3a8" strokeWidth={1}>
        <line x1={x} y1={y - 0.75 * S} x2={x + bw} y2={y - 0.75 * S} />
        <line x1={x} y1={y - 0.95 * S} x2={x} y2={y - 0.55 * S} />
        <line x1={x + bw} y1={y - 0.95 * S} x2={x + bw} y2={y - 0.55 * S} />
      </g>
      <text x={x + bw / 2} y={y - 0.95 * S} textAnchor="middle" fill="#d3d3d3" fontSize={14} fontWeight={600}>
        {fmt(width)} {t.m}
      </text>

      {/* méretvonal: mélység (bal) */}
      <g stroke="#a3a3a8" strokeWidth={1}>
        <line x1={x - 0.75 * S} y1={y} x2={x - 0.75 * S} y2={y + bd} />
        <line x1={x - 0.95 * S} y1={y} x2={x - 0.55 * S} y2={y} />
        <line x1={x - 0.95 * S} y1={y + bd} x2={x - 0.55 * S} y2={y + bd} />
      </g>
      <text
        x={x - 0.95 * S}
        y={y + bd / 2}
        textAnchor="middle"
        fill="#d3d3d3"
        fontSize={14}
        fontWeight={600}
        transform={`rotate(-90 ${x - 0.95 * S} ${y + bd / 2})`}
      >
        {fmt(depth)} {t.m}
      </text>

      {/* lépték */}
      <g transform={`translate(${0.6 * S} ${0.6 * S})`}>
        <line x1={0} y1={0} x2={S} y2={0} stroke="#8a8a8f" strokeWidth={2} />
        <text x={S + 8} y={5} fill="#8a8a8f" fontSize={12} fontFamily="ui-monospace, monospace">
          1 {t.m}
        </text>
      </g>
    </svg>
  )
}
