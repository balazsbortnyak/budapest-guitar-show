import config from '@payload-config'
import { getPayload } from 'payload'

import { addToSender, senderConfigured } from '../sender'

/**
 * Egy feliratkozó átküldése a Sender.net-be; az eredmény a feliratkozó adatlapjára kerül
 * (Sender.net-be küldve / Sender.net hiba). Ha a Sender nincs beállítva, nem csinál semmit.
 */
export async function syncSubscriberToSender(id: number) {
  if (!senderConfigured()) return false
  const payload = await getPayload({ config })
  const sub = await payload.findByID({
    collection: 'subscribers',
    id,
    depth: 0,
    overrideAccess: true,
  })
  try {
    await addToSender(sub.email, sub.locale === 'en' ? 'en' : 'hu')
    await payload.update({
      collection: 'subscribers',
      id,
      data: { senderSyncedAt: new Date().toISOString(), senderError: null },
      overrideAccess: true,
    })
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    payload.logger.error(`[Sender] ${sub.email}: ${msg}`)
    await payload.update({
      collection: 'subscribers',
      id,
      data: { senderError: `${new Date().toISOString()} – ${msg}` },
      overrideAccess: true,
    })
    return false
  }
}
