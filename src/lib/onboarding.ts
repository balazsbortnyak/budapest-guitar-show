/**
 * Kiállítói jelentkezés – közös típusok és árkalkuláció.
 * Ugyanez a kód fut a böngészőben (élő végösszeg) és a szerveren (beküldéskor újraszámolás),
 * így a jelentkezésbe mindig a Payloadban beállított árak kerülnek, nem a böngésző által küldöttek.
 */
import type { ExhibitorOnboarding } from '@/payload-types'

export type Tier = {
  id: string
  label: string
  minArea: number
  maxArea: number | null
  pricePerSqm: number
  badges: number
  tickets: number
  parking: number
  perks: string[]
}

export type Extra = {
  id: string
  label: string
  description: string | null
  price: number
  kind: 'quantity' | 'toggle' | 'perSqm'
  unit: string | null
  maxQuantity: number
  variants: string[]
}

export type PricingConfig = {
  tiers: Tier[]
  extras: Extra[]
  vatRate: number
  minSide: number
  maxSide: number
}

/** A kiválasztott szolgáltatások: darabszám (igen/nem esetén 0 vagy 1) és a választott változat. */
export type ExtraSelection = Record<string, { qty: number; variant?: string }>

export type QuoteLine = { label: string; quantity: number; unit: string; unitPrice: number; total: number }

export type Quote = {
  area: number
  tier: Tier | null
  lines: QuoteLine[]
  net: number
  vat: number
  gross: number
}

const lines = (s?: string | null) =>
  (s ?? '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

/** Payload globalból a kalkulátorhoz szükséges, szerializálható konfiguráció. */
export function toPricingConfig(g: ExhibitorOnboarding): PricingConfig {
  return {
    tiers: (g.tiers ?? [])
      .map((t, i) => ({
        id: t.id ?? String(i),
        label: t.label,
        minArea: t.minArea,
        maxArea: t.maxArea ?? null,
        pricePerSqm: t.pricePerSqm,
        badges: t.badges ?? 0,
        tickets: t.tickets ?? 0,
        parking: t.parking ?? 0,
        perks: lines(t.perks),
      }))
      .sort((a, b) => a.minArea - b.minArea),
    extras: (g.extras ?? []).map((e, i) => ({
      id: e.id ?? String(i),
      label: e.label,
      description: e.description ?? null,
      price: e.price ?? 0,
      kind: e.kind ?? 'quantity',
      unit: e.unit ?? null,
      maxQuantity: e.maxQuantity ?? 50,
      variants: (e.variants ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    })),
    vatRate: g.vatRate ?? 27,
    minSide: g.minSide ?? 2,
    maxSide: g.maxSide ?? 20,
  }
}

export const roundArea = (n: number) => Math.round(n * 100) / 100

export function findTier(tiers: Tier[], area: number): Tier | null {
  return tiers.find((t) => area >= t.minArea && (t.maxArea == null || area < t.maxArea)) ?? null
}

export function computeQuote(
  cfg: PricingConfig,
  booth: { width: number; depth: number },
  selection: ExtraSelection,
  labels: { booth: string; sqm: string },
): Quote {
  const area = roundArea(booth.width * booth.depth)
  const tier = findTier(cfg.tiers, area)
  const out: QuoteLine[] = []

  if (tier) {
    out.push({
      label: `${labels.booth} – ${tier.label}`,
      quantity: area,
      unit: labels.sqm,
      unitPrice: tier.pricePerSqm,
      total: Math.round(area * tier.pricePerSqm),
    })
  }

  for (const extra of cfg.extras) {
    const sel = selection[extra.id]
    if (!sel || sel.qty <= 0) continue
    const qty =
      extra.kind === 'quantity' ? Math.min(Math.floor(sel.qty), extra.maxQuantity) : extra.kind === 'perSqm' ? area : 1
    const variant = sel.variant && extra.variants.includes(sel.variant) ? ` (${sel.variant})` : ''
    out.push({
      label: extra.label + variant,
      quantity: qty,
      unit: extra.kind === 'perSqm' ? labels.sqm : extra.kind === 'quantity' ? (extra.unit ?? '') : '',
      unitPrice: extra.price,
      total: Math.round(qty * extra.price),
    })
  }

  const net = out.reduce((sum, l) => sum + l.total, 0)
  const vat = Math.round((net * cfg.vatRate) / 100)
  return { area, tier, lines: out, net, vat, gross: net + vat }
}

/** 1234567 → „1 234 567 Ft” (nem törő szóközökkel; szerveren és böngészőben azonos kimenet). */
export function formatHuf(n: number): string {
  return `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
}

/** Tizedes vessző magyarul, pont angolul (pl. 4,5 m). */
export const formatNumber = (n: number, locale: 'hu' | 'en') =>
  locale === 'hu' ? String(roundArea(n)).replace('.', ',') : String(roundArea(n))
