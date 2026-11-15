/**
 * Vercel build: éles deploynál előbb lefuttatja az adatbázis-migrációkat, utána a Next.js buildet.
 * Preview deploynál a migráció kimarad, hogy egy félkész ág ne módosítsa az éles adatbázist.
 */
import { execSync } from 'node:child_process'

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: process.env })

const env = process.env

// Kötelező változók – hiányuk esetén az oldal nem működne.
const required = [
  [
    'DATABASE_URL',
    (v) => /^postgres(ql)?:\/\//.test(v),
    'Supabase Transaction pooler URL (postgresql://…:6543/postgres)',
  ],
  [
    'PAYLOAD_SECRET',
    (v) => v.length >= 32,
    'legalább 32 karakteres véletlen kulcs (openssl rand -hex 32)',
  ],
  [
    'NEXT_PUBLIC_SERVER_URL',
    (v) => /^https?:\/\//.test(v),
    'az oldal címe, pl. https://budapestguitarshow.com',
  ],
  [
    'BLOB_READ_WRITE_TOKEN',
    (v) => v.startsWith('vercel_blob_rw_'),
    'Storage → Blob tárhely a projekthez kötve',
  ],
]
// Ajánlott változók – nélkülük az oldal működik, de egy funkció kimarad.
const optional = [
  [['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'], 'e-mail értesítés a kiállítói jelentkezésekről'],
  [['GOOGLE_SHEETS_WEBHOOK_URL', 'GOOGLE_SHEETS_SECRET'], 'Google Táblázat (Bookings waiting)'],
  [['SENDER_API_TOKEN', 'SENDER_GROUP_HU'], 'Sender.net hírlevél'],
]

if (env.VERCEL_ENV === 'production') {
  const bad = required.filter(([k, ok]) => !ok(env[k] ?? ''))
  if (bad.length) {
    console.error(
      '\n✖ Hiányzó vagy hibás környezeti változók (Vercel → Settings → Environment Variables → Production):\n',
    )
    for (const [k, , hint] of bad)
      console.error(`   ${k.padEnd(24)} ${env[k] ? '(hibás érték)' : '(hiányzik)'}  – ${hint}`)
    console.error('\n   Beállítás után: Deployments → ⋯ → Redeploy.\n')
    process.exit(1)
  }
  for (const [keys, what] of optional) {
    const missing = keys.filter((k) => !env[k])
    if (missing.length) console.warn(`! ${what} kikapcsolva – hiányzik: ${missing.join(', ')}`)
  }
  console.log('▶ Adatbázis-migrációk futtatása…')
  // Opcionális: a migrációhoz külön (session pooler / közvetlen) kapcsolat adható meg.
  execSync('npx payload migrate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL,
    },
  })
} else {
  console.log(`▶ Migráció kihagyva (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'helyi'})`)
}

run('npm run build')
