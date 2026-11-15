/**
 * Sender.net segédparancsok:
 *   npm run sender:groups   – kilistázza a Sender csoportokat és az azonosítóikat
 *   npm run sender:sync     – minden még át nem küldött feliratkozót átküld a Sendernek
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { syncSubscriberToSender } from '../lib/newsletter/sync'
import { listSenderGroups, senderConfigured } from '../lib/sender'

const cmd = process.argv.find((a) => a === 'groups' || a === 'sync')

if (!process.env.SENDER_API_TOKEN) {
  console.error('Hiányzik a SENDER_API_TOKEN a .env fájlból.')
  process.exit(1)
}

if (cmd === 'groups') {
  const groups = await listSenderGroups()
  if (!groups.length)
    console.log('Nincs még csoport a Sender fiókban. Hozz létre egyet: Subscribers → Groups.')
  for (const g of groups)
    console.log(`${g.id.padEnd(10)} ${g.title}  (${g.active} aktív feliratkozó)`)
  process.exit(0)
}

if (cmd === 'sync') {
  if (!senderConfigured()) {
    console.error('Állítsd be a SENDER_GROUP_HU (és opcionálisan SENDER_GROUP_EN) változót is.')
    process.exit(1)
  }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'subscribers',
    where: { senderSyncedAt: { exists: false } },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  let ok = 0
  for (const sub of docs) {
    if (await syncSubscriberToSender(sub.id)) ok++
    await new Promise((r) => setTimeout(r, 300)) // kíméljük a Sender API korlátját
  }
  console.log(`${ok}/${docs.length} feliratkozó átküldve a Sendernek.`)
  process.exit(0)
}

console.error('Használat: npm run sender:groups | npm run sender:sync')
process.exit(1)
