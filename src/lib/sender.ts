/**
 * Sender.net (hírlevél) – feliratkozó felvétele egy csoportba.
 * API: https://api.sender.net/  (base: https://api.sender.net/v2/)
 *
 * Környezeti változók:
 *   SENDER_API_TOKEN   – Sender → Settings → API access tokens
 *   SENDER_GROUP_HU    – a magyar feliratkozók csoportjának azonosítója (pl. „eZVD4w”)
 *   SENDER_GROUP_EN    – az angol feliratkozók csoportja (ha üres, a magyar csoportba kerülnek)
 */

const API = 'https://api.sender.net/v2'

export function senderConfigured() {
  return Boolean(
    process.env.SENDER_API_TOKEN && (process.env.SENDER_GROUP_HU || process.env.SENDER_GROUP_EN),
  )
}

function groupFor(locale: 'hu' | 'en') {
  const hu = process.env.SENDER_GROUP_HU || ''
  const en = process.env.SENDER_GROUP_EN || ''
  return (locale === 'en' ? en || hu : hu || en) || null
}

async function call(path: string, init: { method: 'GET' | 'POST'; body?: unknown }) {
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${process.env.SENDER_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    /* nem JSON válasz */
  }
  return { ok: res.ok && json.success !== false, status: res.status, json, text }
}

function describe(r: { status: number; json: Record<string, unknown>; text: string }) {
  const errors = r.json.errors ? ` ${JSON.stringify(r.json.errors)}` : ''
  const msg = typeof r.json.message === 'string' ? r.json.message : r.text.slice(0, 200)
  return `Sender ${r.status}: ${msg}${errors}`
}

/**
 * Feliratkozó hozzáadása a nyelvének megfelelő csoporthoz.
 * Ha a cím már létezik a Senderben, a csoporthoz adja hozzá.
 * Hibánál kivételt dob (a hívó naplózza).
 */
export async function addToSender(email: string, locale: 'hu' | 'en') {
  const group = groupFor(locale)
  if (!process.env.SENDER_API_TOKEN || !group) throw new Error('Sender nincs beállítva')

  const created = await call('/subscribers', {
    method: 'POST',
    body: { email, groups: [group], trigger_automation: true },
  })
  if (created.ok) return

  // Már létező feliratkozó (vagy más 4xx): próbáljuk a csoporthoz adni.
  if (created.status === 400 || created.status === 422) {
    const added = await call(`/subscribers/groups/${encodeURIComponent(group)}`, {
      method: 'POST',
      body: { subscribers: [email], trigger_automation: true },
    })
    if (added.ok) return
    throw new Error(`${describe(created)} | csoporthoz adás: ${describe(added)}`)
  }
  throw new Error(describe(created))
}

/** A fiók csoportjai (a csoportazonosítók megkereséséhez). */
export async function listSenderGroups(): Promise<{ id: string; title: string; active: number }[]> {
  const out: { id: string; title: string; active: number }[] = []
  for (let page = 1; page <= 20; page++) {
    const r = await call(`/groups?page=${page}`, { method: 'GET' })
    if (!r.ok) throw new Error(describe(r))
    const data = (r.json.data as { id: string; title: string; active_subscribers?: number }[]) ?? []
    out.push(...data.map((g) => ({ id: g.id, title: g.title, active: g.active_subscribers ?? 0 })))
    const meta = r.json.meta as { last_page?: number } | undefined
    if (!meta?.last_page || page >= meta.last_page) break
  }
  return out
}
