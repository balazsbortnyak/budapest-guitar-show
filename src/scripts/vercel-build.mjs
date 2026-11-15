/**
 * Vercel build: éles deploynál előbb lefuttatja az adatbázis-migrációkat, utána a Next.js buildet.
 * Preview deploynál a migráció kimarad, hogy egy félkész ág ne módosítsa az éles adatbázist.
 */
import { execSync } from 'node:child_process'

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: process.env })

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DATABASE_URL?.startsWith('postgres')) {
    console.error('✖ Éles builden a DATABASE_URL-nek Postgres (Supabase) címnek kell lennie.')
    process.exit(1)
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
