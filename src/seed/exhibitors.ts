/**
 * A 2026-os kiállítók és márkák importja (a régi budapestguitarshow.com oldalról gyűjtve).
 * Futtatás: npm run seed:exhibitors
 *
 * FIGYELEM: a meglévő kiállítókat törli, és a listát újra létrehozza.
 * A logókat feltölti a Képek közé (ha már fel vannak töltve ugyanazzal a fájlnévvel, újrahasználja őket).
 */
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type Row = { name: string; exhibitor: string | null; website: string | null; logo: string | null }
const rows: Row[] = JSON.parse(fs.readFileSync(path.join(dirname, 'exhibitors-2026.json'), 'utf8'))

// A főoldalon megjelenő kiemelt márkák
const featured = new Set([
  'Ibanez', 'Taylor', 'PRS', 'Boss', 'Kemper', 'Vox',
  'Seymour Duncan', 'Ortega', 'Dunlop', 'Neural DSP', 'Universal Audio', 'Warwick',
])

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[kiállítók] ${m}`)

  const old = await payload.delete({ collection: 'exhibitors', where: { id: { exists: true } } })
  log(`${old.docs.length} régi bejegyzés törölve`)

  for (const row of rows) {
    let logoId: number | undefined
    if (row.logo) {
      const existing = await payload.find({ collection: 'media', where: { filename: { equals: row.logo } }, limit: 1 })
      if (existing.docs[0]) {
        logoId = existing.docs[0].id
      } else {
        const media = await payload.create({
          collection: 'media',
          locale: 'hu',
          data: { alt: `${row.name} logó`, overlay: 0 },
          filePath: path.join(dirname, 'exhibitor-logos', row.logo),
        })
        await payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: `${row.name} logo` } })
        logoId = media.id
      }
    }
    await payload.create({
      collection: 'exhibitors',
      data: {
        name: row.name,
        exhibitor: row.exhibitor ?? undefined,
        website: row.website ?? undefined,
        logo: logoId,
        featured: featured.has(row.name),
        published: true,
      },
    })
  }
  log(`${rows.length} márka importálva (${rows.filter((r) => r.logo).length} logóval)`)
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
