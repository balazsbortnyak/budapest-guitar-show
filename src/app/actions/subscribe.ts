'use server'

import config from '@payload-config'
import { after } from 'next/server'
import { getPayload } from 'payload'

import { syncSubscriberToSender } from '@/lib/newsletter/sync'

export type SubscribeState = { status: 'idle' | 'success' | 'invalid' | 'error' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Honeypot: a valódi látogatók nem látják ezt a mezőt, a botok kitöltik.
  if (String(formData.get('company') ?? '').trim() !== '') return { status: 'success' }

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const locale = formData.get('locale') === 'en' ? 'en' : 'hu'

  if (email.length > 254 || !EMAIL_RE.test(email)) return { status: 'invalid' }

  try {
    const payload = await getPayload({ config })
    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    // Már feliratkozott címnél is "sikert" mutatunk, hogy ne lehessen címeket kifürkészni.
    let id: number | null = null
    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'subscribers',
        data: { email, locale },
        overrideAccess: true,
      })
      id = created.id
    } else if (!existing.docs[0].senderSyncedAt) {
      // Korábban nem sikerült átküldeni a Sendernek → most újrapróbáljuk.
      id = existing.docs[0].id
    }
    // A Sender.net-be küldés a válasz után, a háttérben fut (nem lassítja az űrlapot).
    if (id !== null) {
      const subscriberId = id
      after(() =>
        syncSubscriberToSender(subscriberId).catch((err) => console.error('[Sender]', err)),
      )
    }
    return { status: 'success' }
  } catch (err) {
    console.error('[subscribe]', err)
    return { status: 'error' }
  }
}
