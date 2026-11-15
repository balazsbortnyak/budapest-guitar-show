import config from '@payload-config'
import { getPayload } from 'payload'

import type { ExhibitorApplication } from '@/payload-types'

import { formatHuf, formatNumber } from '../onboarding'
import { generateContract } from './contract'

const NOTIFY_TO = process.env.BOOKING_NOTIFY_EMAIL || 'info@budapestguitarshow.com'
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const adminUrl = (id: number | string) =>
  `${SERVER_URL}/admin/collections/exhibitor-applications/${id}`

/**
 * Egy új jelentkezés automatikus feldolgozása (a beküldés után, a háttérben fut):
 * 1. azonosító (BGS-2026-0001), 2. szerződés .docx, 3. e-mail az info@ címre, 4. Google Táblázat.
 * Minden lépés külön próbálkozik; a hibák a jelentkezés „Automatikus feldolgozás” mezőjébe kerülnek.
 */
export async function processNewApplication(id: number) {
  const payload = await getPayload({ config })
  const errors: string[] = []
  const log = (step: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`${step}: ${msg}`)
    payload.logger.error(`[jelentkezés #${id}] ${step}: ${msg}`)
  }

  let app = await payload.findByID({
    collection: 'exhibitor-applications',
    id,
    depth: 0,
    overrideAccess: true,
  })

  // 1. Azonosító
  if (!app.reference) {
    const year = new Date(app.createdAt).getFullYear()
    app = await payload.update({
      collection: 'exhibitor-applications',
      id,
      data: { reference: `BGS-${year}-${String(id).padStart(4, '0')}` },
      overrideAccess: true,
      depth: 0,
    })
  }

  // 2. Szerződés
  let contract: { buffer: Buffer; filename: string } | null = null
  try {
    const [settings, onboarding] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings', locale: app.locale === 'en' ? 'en' : 'hu' }),
      payload.findGlobal({ slug: 'exhibitor-onboarding' }),
    ])
    const buffer = await generateContract(app, settings, onboarding.vatRate ?? 27)
    const filename = `${app.reference}-szerzodes.docx`
    const doc = await payload.create({
      collection: 'application-documents',
      data: { title: `${app.reference} – ${app.companyName}` },
      file: {
        data: buffer,
        name: filename,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'exhibitor-applications',
      id,
      data: { contract: doc.id },
      overrideAccess: true,
    })
    contract = { buffer, filename }
  } catch (err) {
    log('Szerződés', err)
  }

  // 3. E-mail
  let emailSentAt: string | undefined
  try {
    await payload.sendEmail({
      to: NOTIFY_TO,
      replyTo: app.email,
      subject: `Új kiállítói jelentkezés: ${app.companyName} – ${formatNumber(app.boothArea ?? 0, 'hu')} m² (${app.reference})`,
      html: emailHtml(app),
      attachments: contract
        ? [{ filename: contract.filename, content: contract.buffer }]
        : undefined,
    })
    emailSentAt = new Date().toISOString()
  } catch (err) {
    log('E-mail', err)
  }

  // 4. Google Táblázat
  let sheetSyncedAt: string | undefined
  try {
    if (await pushToSheet(app)) sheetSyncedAt = new Date().toISOString()
  } catch (err) {
    log('Google Táblázat', err)
  }

  await payload.update({
    collection: 'exhibitor-applications',
    id,
    data: { emailSentAt, sheetSyncedAt, processingLog: errors.join('\n') || undefined },
    overrideAccess: true,
  })
}

/** A táblázat oszlopai – ebben a sorrendben jönnek létre a „Bookings waiting” lapon. */
export function sheetColumns(app: ExhibitorApplication): [string, string | number][] {
  const brands = (app.brands ?? []).map((b) => b.name).join(', ')
  const extras = (app.lines ?? [])
    .slice(1) // az első sor maga a standterület
    .map((l) => `${l.label} × ${formatNumber(l.quantity ?? 0, 'hu')}`)
    .join('; ')
  return [
    ['Azonosító', app.reference ?? ''],
    [
      'Beérkezett',
      new Date(app.createdAt).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }),
    ],
    ['Típus', app.applicantType === 'individual' ? 'Magánszemély' : 'Cég'],
    ['Cégnév / név', app.companyName],
    ['Adószám', app.taxNumber ?? ''],
    ['Cégjegyzékszám', app.registrationNumber ?? ''],
    ['Számlázási cím', app.billingAddress],
    ['Weboldal', app.website ?? ''],
    ['Kapcsolattartó', app.contactName],
    ['Telefon', app.phone],
    ['E-mail', app.email],
    ['Márkák', brands],
    [
      'Stand (m)',
      `${formatNumber(app.boothWidth ?? 0, 'hu')} × ${formatNumber(app.boothDepth ?? 0, 'hu')}`,
    ],
    ['Terület (m²)', app.boothArea ?? 0],
    ['Kategória', app.tier ?? ''],
    ['Badge', app.boothBadges ?? 0],
    ['Belépő', app.boothTickets ?? 0],
    ['Parkoló', app.boothParking ?? 0],
    ['Szolgáltatások', extras],
    ['Nettó (Ft)', app.totalNet ?? 0],
    ['ÁFA (Ft)', app.totalVat ?? 0],
    ['Bruttó (Ft)', app.totalGross ?? 0],
    ['Nyelv', app.locale === 'en' ? 'EN' : 'HU'],
    ['Üzenet', app.message ?? ''],
    ['Admin link', adminUrl(app.id)],
  ]
}

/** Új sor a Google Táblázat „Bookings waiting” lapjára (Apps Script webhookon keresztül). */
async function pushToSheet(app: ExhibitorApplication): Promise<boolean> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  const secret = process.env.GOOGLE_SHEETS_SECRET
  if (!url || !secret) return false // nincs beállítva → kihagyjuk (nem hiba)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, reference: app.reference, columns: sheetColumns(app) }),
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  })
  const text = await res.text()
  let body: { ok?: boolean; error?: string } = {}
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`Váratlan válasz (${res.status}): ${text.slice(0, 200)}`)
  }
  if (!body.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return true
}

function emailHtml(app: ExhibitorApplication) {
  const row = (k: string, v: unknown) =>
    v || v === 0
      ? `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;vertical-align:top">${esc(v).replace(/\n/g, '<br>')}</td></tr>`
      : ''
  const lines = (app.lines ?? [])
    .map(
      (l) =>
        `<tr><td style="padding:6px 8px;border-top:1px solid #eee">${esc(l.label)}</td><td style="padding:6px 8px;border-top:1px solid #eee;text-align:right;white-space:nowrap">${esc(
          formatNumber(l.quantity ?? 0, 'hu'),
        )} × ${esc(formatHuf(l.unitPrice ?? 0))}</td><td style="padding:6px 8px;border-top:1px solid #eee;text-align:right;white-space:nowrap"><b>${esc(formatHuf(l.total ?? 0))}</b></td></tr>`,
    )
    .join('')

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;max-width:640px">
<h2 style="margin:0 0 4px">Új kiállítói jelentkezés</h2>
<p style="margin:0 0 20px;color:#666">${esc(app.reference)} · ${esc(new Date(app.createdAt).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }))}</p>
<table style="border-collapse:collapse">
${row('Típus', app.applicantType === 'individual' ? 'Magánszemély' : 'Cég')}
${row('Cégnév / név', app.companyName)}
${row('Adószám', app.taxNumber)}
${row('Cégjegyzékszám', app.registrationNumber)}
${row('Számlázási cím', app.billingAddress)}
${row('Weboldal', app.website)}
${row('Kapcsolattartó', app.contactName)}
${row('Telefon', app.phone)}
${row('E-mail', app.email)}
${row('Márkák', (app.brands ?? []).map((b) => b.name).join(', '))}
${row('Stand', `${formatNumber(app.boothWidth ?? 0, 'hu')} × ${formatNumber(app.boothDepth ?? 0, 'hu')} m = ${formatNumber(app.boothArea ?? 0, 'hu')} m² (${app.tier ?? ''})`)}
${row('Üzenet', app.message)}
</table>
<h3 style="margin:24px 0 8px">Tételek</h3>
<table style="border-collapse:collapse;width:100%">${lines}
<tr><td style="padding:10px 8px 4px;border-top:2px solid #111" colspan="2">Nettó összesen</td><td style="padding:10px 8px 4px;border-top:2px solid #111;text-align:right"><b>${esc(formatHuf(app.totalNet ?? 0))}</b></td></tr>
<tr><td style="padding:4px 8px" colspan="2">ÁFA</td><td style="padding:4px 8px;text-align:right">${esc(formatHuf(app.totalVat ?? 0))}</td></tr>
<tr><td style="padding:4px 8px" colspan="2"><b>Bruttó végösszeg</b></td><td style="padding:4px 8px;text-align:right;color:#e05a00"><b>${esc(formatHuf(app.totalGross ?? 0))}</b></td></tr>
</table>
<p style="margin:28px 0 0"><a href="${esc(adminUrl(app.id))}" style="background:#ff6a00;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Megnyitás az adminban</a></p>
<p style="margin:20px 0 0;color:#888;font-size:12px">A generált szerződés csatolva. A márkák logói az adminban érhetők el. Erre a levélre válaszolva a jelentkezőnek írsz.</p>
</div>`
}
