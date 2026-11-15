/**
 * Egyszeri átköltöztetés: helyi SQLite (bgs.db) + helyi képek  →  Postgres (Supabase) + Vercel Blob.
 *
 * Előtte a cél adatbázisban le kell futnia a migrációnak:
 *   DATABASE_URL=<supabase-url> npm run migrate
 *
 * Futtatás:
 *   TARGET_DATABASE_URL=<supabase-url> BLOB_READ_WRITE_TOKEN=<token> npm run transfer:postgres
 *
 * Kapcsolók:
 *   --force        a cél adatbázis meglévő tartalmát törli és felülírja
 *   --skip-files   a képeket/fájlokat nem tölti fel a Blobra (csak az adatbázist másolja)
 *
 * Táblánként másol (az azonosítók, a magyar/angol változatok és a kapcsolatok megmaradnak),
 * majd a helyi /media, /application-logos, /application-documents fájlokat feltölti a Vercel Blobra.
 */
import { createClient } from '@libsql/client'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import pg from 'pg'

const args = new Set(process.argv.slice(2))
const FORCE = args.has('--force')
const SKIP_FILES = args.has('--skip-files')

const target = process.env.TARGET_DATABASE_URL
const sourceUrl =
  process.env.SOURCE_DATABASE_URL ||
  (process.env.DATABASE_URL?.startsWith('file:') ? process.env.DATABASE_URL : 'file:./bgs.db')
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

/** Ezeket nem másoljuk: a migrációs napló a célé, a zárolások/munkamenetek ideiglenesek. */
const SKIP_TABLES = new Set([
  'payload_migrations',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'users_sessions',
])

/** Privát feltöltések: élesben véletlen utótagot kapnak, hogy a fájl címe ne legyen kitalálható. */
const PRIVATE_UPLOADS: Record<string, string> = {
  application_logos: 'application-logos',
  application_documents: 'application-documents',
}
const PUBLIC_UPLOAD_DIRS = ['media']

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

if (!target?.startsWith('postgres')) {
  fail('Add meg a cél adatbázist: TARGET_DATABASE_URL=postgres://… (a Supabase kapcsolati URL-je)')
}

const sqlite = createClient({ url: sourceUrl })
const db = new pg.Client({ connectionString: target })
await db.connect()

try {
  // 1. A cél séma megvan?
  const { rows: mig } = await db.query(
    `select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'payload_migrations'`,
  )
  if (!mig[0].n)
    fail('A cél adatbázisban még nincs séma. Futtasd előbb: DATABASE_URL=<url> npm run migrate')

  const { rows: tableRows } = await db.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`,
  )
  const tables = tableRows.map((r) => r.table_name).filter((t) => !SKIP_TABLES.has(t))

  const sourceTables = new Set(
    (await sqlite.execute(`select name from sqlite_master where type = 'table'`)).rows.map((r) =>
      String(r.name),
    ),
  )

  // 2. Üres a cél?
  let nonEmpty = 0
  for (const t of tables) {
    const { rows } = await db.query(`select exists(select 1 from ${q(t)}) as e`)
    if (rows[0].e) nonEmpty++
  }
  if (nonEmpty) {
    if (!FORCE)
      fail(`A cél adatbázisban már van adat (${nonEmpty} táblában). Felülíráshoz: --force`)
    console.log('… a cél adatbázis tartalmának törlése (--force)')
    await db.query(`truncate ${tables.map(q).join(', ')} restart identity cascade`)
  }

  // 3. Sorrend az idegen kulcsok alapján (előbb a hivatkozott táblák).
  const { rows: fks } = await db.query<{ child: string; parent: string }>(`
    select distinct tc.table_name as child, ccu.table_name as parent
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`)
  const deps = new Map(tables.map((t) => [t, new Set<string>()]))
  for (const { child, parent } of fks) {
    if (child !== parent && deps.has(child) && deps.has(parent)) deps.get(child)!.add(parent)
  }
  const ordered: string[] = []
  const done = new Set<string>()
  while (ordered.length < tables.length) {
    const ready = tables.filter((t) => !done.has(t) && [...deps.get(t)!].every((d) => done.has(d)))
    if (!ready.length) fail('Körkörös hivatkozás a táblák között – ez nem várt séma.')
    for (const t of ready.sort()) {
      ordered.push(t)
      done.add(t)
    }
  }

  // 4. Másolás
  const renamed: { dir: string; from: string; to: string }[] = []
  let totalRows = 0
  console.log(`\nAdatbázis másolása: ${sourceUrl} → Postgres`)
  for (const t of ordered) {
    if (!sourceTables.has(t)) continue
    const { rows: colRows } = await db.query<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = $1`,
      [t],
    )
    const srcCols = new Set(
      (await sqlite.execute(`pragma table_info(${q(t)})`)).rows.map((r) => String(r.name)),
    )
    const cols = colRows.filter((c) => srcCols.has(c.column_name))
    const missing = colRows.filter((c) => !srcCols.has(c.column_name)).map((c) => c.column_name)
    const extra = [...srcCols].filter((c) => !colRows.some((r) => r.column_name === c))
    if (missing.length)
      console.warn(`  ! ${t}: a forrásban nincs ${missing.join(', ')} (alapértéket kap)`)
    if (extra.length) console.warn(`  ! ${t}: a célban nincs ${extra.join(', ')} (kimarad)`)

    const src = await sqlite.execute(`select * from ${q(t)}`)
    if (!src.rows.length) continue

    const rows = src.rows.map((r) => {
      const row: Record<string, unknown> = {}
      for (const c of cols) {
        let v: unknown = r[c.column_name]
        if (typeof v === 'bigint') v = Number(v)
        if (v !== null && v !== undefined) {
          if (c.data_type === 'boolean') v = Boolean(Number(v))
          else if ((c.data_type === 'jsonb' || c.data_type === 'json') && typeof v !== 'string')
            v = JSON.stringify(v)
        }
        row[c.column_name] = v ?? null
      }
      // Privát fájlok: véletlen utótag a fájlnévben.
      const dir = PRIVATE_UPLOADS[t]
      if (dir && typeof row.filename === 'string') {
        const ext = path.extname(row.filename)
        const base = row.filename.slice(0, row.filename.length - ext.length)
        const from = row.filename
        const to = `${base}-${crypto.randomBytes(12).toString('hex')}${ext}`
        renamed.push({ dir, from, to })
        row.filename = to
        if (typeof row.url === 'string') {
          row.url = row.url.replace(encodeURIComponent(from), to).replace(from, to)
        }
      }
      return row
    })

    const names = cols.map((c) => c.column_name)
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200)
      const params: unknown[] = []
      const values = chunk
        .map(
          (row) => `(${names.map((n) => (params.push(row[n]), `$${params.length}`)).join(', ')})`,
        )
        .join(', ')
      await db.query(`insert into ${q(t)} (${names.map(q).join(', ')}) values ${values}`, params)
    }
    totalRows += rows.length
    console.log(`  ✓ ${t}: ${rows.length}`)
  }

  // 5. Azonosító-számlálók igazítása (hogy az új rekordok ne ütközzenek).
  for (const t of ordered) {
    const { rows } = await db.query(`select pg_get_serial_sequence($1, 'id') as seq`, [t])
    if (rows[0]?.seq) {
      await db.query(`select setval($1, coalesce((select max(id) from ${q(t)}), 0) + 1, false)`, [
        rows[0].seq,
      ])
    }
  }
  console.log(`\n✓ ${totalRows} sor átmásolva.`)

  // 6. Fájlok a Vercel Blobra
  if (SKIP_FILES) {
    console.log('Fájlok kihagyva (--skip-files).')
  } else if (!blobToken) {
    console.warn(
      '! Nincs BLOB_READ_WRITE_TOKEN → a képek nem kerültek fel, élesben nem fognak látszani.',
    )
  } else {
    const uploads: { file: string; key: string }[] = []
    for (const dir of PUBLIC_UPLOAD_DIRS) {
      const files = await fs.readdir(dir).catch(() => [] as string[])
      for (const f of files)
        if (!f.startsWith('.')) uploads.push({ file: path.join(dir, f), key: f })
    }
    for (const r of renamed) uploads.push({ file: path.join(r.dir, r.from), key: r.to })

    console.log(`\nFájlok feltöltése a Vercel Blobra: ${uploads.length} db`)
    let n = 0
    for (let i = 0; i < uploads.length; i += 8) {
      await Promise.all(
        uploads.slice(i, i + 8).map(async (u) => {
          const data = await fs.readFile(u.file).catch(() => null)
          if (!data) return console.warn(`  ! hiányzik: ${u.file}`)
          await put(u.key, data, {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
            contentType: MIME[path.extname(u.key).toLowerCase()] ?? 'application/octet-stream',
            token: blobToken,
          })
          n++
        }),
      )
      process.stdout.write(`\r  ${n}/${uploads.length}`)
    }
    console.log('\n✓ Fájlok feltöltve.')
  }

  console.log('\nKész. Ellenőrizd az oldalt és az admint az éles címen.\n')
} finally {
  await db.end()
  sqlite.close()
}
