import Docxtemplater from 'docxtemplater'
import fs from 'fs/promises'
import path from 'path'
import PizZip from 'pizzip'

import type { ExhibitorApplication, SiteSetting } from '@/payload-types'

import { formatHuf, formatNumber } from '../onboarding'

/**
 * A szerződéssablonok helye. Wordben szerkeszthetők; a {helyőrzőket} a contractData() tölti ki.
 * (Vercelen a next.config outputFileTracingIncludes gondoskodik róla, hogy a fájlok felkerüljenek.)
 */
const TEMPLATE_DIR = path.join(process.cwd(), 'src', 'contracts')

/** A sablonban használható összes helyőrző. */
export function contractData(
  app: ExhibitorApplication,
  settings: Pick<SiteSetting, 'eventName' | 'dateLabel' | 'venue'>,
  vatRate: number,
) {
  const locale = app.locale === 'en' ? 'en' : 'hu'
  const date = new Date(app.createdAt)
  return {
    reference: app.reference ?? '',
    eventName: settings.eventName ?? 'Budapest Guitar Show',
    dateLabel: settings.dateLabel ?? '',
    venue: settings.venue ?? '',
    applicantType:
      app.applicantType === 'individual'
        ? locale === 'hu'
          ? 'Magánszemély'
          : 'Individual'
        : locale === 'hu'
          ? 'Cég'
          : 'Company',
    companyName: app.companyName,
    taxNumber: app.taxNumber ?? '',
    registrationNumber: app.registrationNumber ?? '',
    billingAddress: app.billingAddress,
    website: app.website ?? '',
    contactName: app.contactName,
    phone: app.phone,
    email: app.email,
    width: formatNumber(app.boothWidth ?? 0, locale),
    depth: formatNumber(app.boothDepth ?? 0, locale),
    area: formatNumber(app.boothArea ?? 0, locale),
    tier: app.tier ?? '',
    badges: app.boothBadges ?? 0,
    tickets: app.boothTickets ?? 0,
    parking: app.boothParking ?? 0,
    perks: (app.boothPerks ?? '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
    brands: (app.brands ?? []).map((b) => ({ name: b.name })),
    lines: (app.lines ?? []).map((l) => ({
      label: l.label ?? '',
      quantity: formatNumber(l.quantity ?? 0, locale),
      unitPrice: formatHuf(l.unitPrice ?? 0),
      total: formatHuf(l.total ?? 0),
    })),
    net: formatHuf(app.totalNet ?? 0),
    vat: formatHuf(app.totalVat ?? 0),
    gross: formatHuf(app.totalGross ?? 0),
    vatRate,
    message: app.message ?? '',
    date:
      locale === 'hu'
        ? `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}.`
        : date.toISOString().slice(0, 10),
  }
}

export async function generateContract(
  app: ExhibitorApplication,
  settings: Pick<SiteSetting, 'eventName' | 'dateLabel' | 'venue'>,
  vatRate: number,
): Promise<Buffer> {
  const locale = app.locale === 'en' ? 'en' : 'hu'
  const template = await fs.readFile(path.join(TEMPLATE_DIR, `kiallitoi-szerzodes.${locale}.docx`))
  const doc = new Docxtemplater(new PizZip(template), {
    paragraphLoop: true,
    linebreaks: true,
    // Ismeretlen helyőrző esetén üres szöveg, ne „undefined”.
    nullGetter: () => '',
  })
  doc.render(contractData(app, settings, vatRate))
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer
}
