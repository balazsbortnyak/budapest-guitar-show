'use server'

import config from '@payload-config'
import { after } from 'next/server'
import { getPayload } from 'payload'

import { processNewApplication } from '@/lib/booking/process'
import { computeQuote, findTier, toPricingConfig, type ExtraSelection } from '@/lib/onboarding'

export type ApplicationResult = { status: 'success' } | { status: 'invalid' } | { status: 'error' }

/** A böngészőből érkező adatok (a fájlok külön, `logo-<index>` néven jönnek). */
export type ApplicationInput = {
  locale: 'hu' | 'en'
  applicantType: 'company' | 'individual'
  companyName: string
  taxNumber: string
  registrationNumber: string
  billingAddress: string
  contactName: string
  phone: string
  email: string
  website: string
  brands: { name: string; hasLogo: boolean }[]
  booth: { width: number; depth: number }
  extras: ExtraSelection
  message: string
  consent: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\d\s/-]{6,25}$/
const MAX_LOGO_BYTES = 3 * 1024 * 1024
const MAX_BRANDS = 30

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Fájl tényleges típusa a tartalma alapján (nem bízunk a böngésző által megadott típusban). */
function sniffImage(buf: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'image/png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf.length > 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp'
  return null
}

export async function submitExhibitorApplication(formData: FormData): Promise<ApplicationResult> {
  // Honeypot: valódi látogató nem látja ezt a mezőt.
  if (String(formData.get('nickname') ?? '').trim() !== '') return { status: 'success' }

  let raw: Partial<ApplicationInput>
  try {
    raw = JSON.parse(String(formData.get('data') ?? '{}'))
  } catch {
    return { status: 'invalid' }
  }

  const locale = raw.locale === 'en' ? 'en' : 'hu'
  const applicantType = raw.applicantType === 'individual' ? 'individual' : 'company'
  const input = {
    companyName: str(raw.companyName, 200),
    taxNumber: str(raw.taxNumber, 40),
    registrationNumber: applicantType === 'company' ? str(raw.registrationNumber, 40) : '',
    billingAddress: str(raw.billingAddress, 500),
    contactName: str(raw.contactName, 120),
    phone: str(raw.phone, 30),
    email: str(raw.email, 254).toLowerCase(),
    website: str(raw.website, 300),
    message: str(raw.message, 3000),
  }
  const brands = (Array.isArray(raw.brands) ? raw.brands : [])
    .slice(0, MAX_BRANDS)
    .map((b, i) => ({ index: i, name: str(b?.name, 100) }))
    .filter((b) => b.name)

  const width = Number(raw.booth?.width)
  const depth = Number(raw.booth?.depth)

  const payload = await getPayload({ config })
  const global = await payload.findGlobal({ slug: 'exhibitor-onboarding', locale })
  const cfg = toPricingConfig(global)

  const valid =
    raw.consent === true &&
    input.companyName &&
    input.billingAddress &&
    input.contactName &&
    PHONE_RE.test(input.phone) &&
    EMAIL_RE.test(input.email) &&
    (applicantType === 'individual' || (input.taxNumber && input.registrationNumber)) &&
    (!input.website || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(input.website)) &&
    brands.length > 0 &&
    Number.isFinite(width) &&
    Number.isFinite(depth) &&
    width >= cfg.minSide &&
    width <= cfg.maxSide &&
    depth >= cfg.minSide &&
    depth <= cfg.maxSide &&
    findTier(cfg.tiers, width * depth) !== null

  if (!valid) return { status: 'invalid' }

  // Csak a Payloadban létező szolgáltatások, ésszerű mennyiséggel.
  const extras: ExtraSelection = {}
  const rawExtras = raw.extras && typeof raw.extras === 'object' ? raw.extras : {}
  for (const extra of cfg.extras) {
    const sel = (rawExtras as ExtraSelection)[extra.id]
    const qty = Number(sel?.qty)
    if (!Number.isFinite(qty) || qty <= 0) continue
    extras[extra.id] = {
      qty: Math.min(Math.floor(qty), extra.maxQuantity),
      variant: str(sel?.variant, 60) || undefined,
    }
  }

  const labels =
    locale === 'hu' ? { booth: 'Standterület', sqm: 'm²' } : { booth: 'Booth space', sqm: 'm²' }
  const quote = computeQuote(cfg, { width, depth }, extras, labels)

  try {
    // Logók: típus- és méretellenőrzés után a nem publikus jelentkezői logók közé.
    const brandRows: { name: string; logo?: number }[] = []
    for (const brand of brands) {
      const file = formData.get(`logo-${brand.index}`)
      let logoId: number | undefined
      if (file instanceof File && file.size > 0 && file.size <= MAX_LOGO_BYTES) {
        const buf = Buffer.from(await file.arrayBuffer())
        const mimetype = sniffImage(buf)
        if (mimetype) {
          const ext = mimetype.split('/')[1].replace('jpeg', 'jpg')
          const safeName =
            brand.name
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') || 'logo'
          const doc = await payload.create({
            collection: 'application-logos',
            data: { alt: brand.name },
            file: { data: buf, mimetype, name: `${safeName}.${ext}`, size: buf.length },
            overrideAccess: true,
          })
          logoId = doc.id
        }
      }
      brandRows.push({ name: brand.name, logo: logoId })
    }

    const created = await payload.create({
      collection: 'exhibitor-applications',
      overrideAccess: true,
      data: {
        status: 'new',
        locale,
        applicantType,
        ...input,
        website:
          input.website && !/^https?:\/\//i.test(input.website)
            ? `https://${input.website}`
            : input.website,
        brands: brandRows,
        boothWidth: width,
        boothDepth: depth,
        boothArea: quote.area,
        tier: quote.tier?.label,
        boothBadges: quote.tier?.badges,
        boothTickets: quote.tier?.tickets,
        boothParking: quote.tier?.parking,
        boothPerks: quote.tier?.perks.join('\n'),
        lines: quote.lines.map((l) => ({
          label: l.label,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
        })),
        totalNet: quote.net,
        totalVat: quote.vat,
        totalGross: quote.gross,
      },
    })
    // Szerződés, e-mail és Google Táblázat a háttérben – a jelentkező nem vár rájuk.
    after(() =>
      processNewApplication(created.id).catch((err) =>
        console.error('[exhibitor-application:process]', err),
      ),
    )
    return { status: 'success' }
  } catch (err) {
    console.error('[exhibitor-application]', err)
    return { status: 'error' }
  }
}
