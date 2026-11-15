import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import { hu } from '@payloadcms/translations/languages/hu'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Exhibitors, Faqs, Performers, Programs, Subscribers, Videos } from './collections/Content'
import {
  ApplicationDocuments,
  ApplicationLogos,
  ExhibitorApplications,
} from './collections/ExhibitorApplications'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { ExhibitorOnboarding } from './globals/ExhibitorOnboarding'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUrl = process.env.DATABASE_URL || 'file:./bgs.db'
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

if (process.env.NODE_ENV === 'production' && (process.env.PAYLOAD_SECRET || '').length < 32) {
  throw new Error('PAYLOAD_SECRET hiányzik vagy túl rövid (legalább 32 karakter kell).')
}

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – Budapest Guitar Show admin' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [
    Programs,
    Performers,
    Videos,
    Exhibitors,
    Faqs,
    Media,
    Subscribers,
    ExhibitorApplications,
    ApplicationLogos,
    ApplicationDocuments,
    Users,
  ],
  globals: [SiteSettings, ExhibitorOnboarding],
  editor: lexicalEditor(),
  // E-mail küldés SMTP-n keresztül (pl. Google Workspace). Ha nincs beállítva, a levelek csak a konzolra íródnak.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'info@budapestguitarshow.com',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Budapest Guitar Show',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  i18n: {
    supportedLanguages: { hu, en },
    fallbackLanguage: 'hu',
  },
  localization: {
    locales: [
      { code: 'hu', label: 'Magyar' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'hu',
    fallback: true,
  },
  // Csak a saját domainről érkező kéréseket fogadja el cookie-s hitelesítéssel.
  cors: [serverURL],
  csrf: [serverURL],
  // GraphQL nem kell az oldalhoz → kikapcsolva (kisebb támadási felület).
  graphQL: { disable: true },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Éles: Postgres (Supabase). Helyben: SQLite fájl.
  // Postgresnél a séma migrációkkal változik (src/migrations, lásd docs/elesites-vercel-supabase.md).
  db: databaseUrl.startsWith('postgres')
    ? postgresAdapter({
        pool: {
          connectionString: databaseUrl,
          // Serverless (Vercel): kevés, gyorsan elengedett kapcsolat a Supabase pooler felé.
          max: Number(process.env.DATABASE_POOL_MAX || 5),
          idleTimeoutMillis: 10_000,
        },
        migrationDir: path.resolve(dirname, 'migrations'),
        // Élesben soha ne módosítsa automatikusan a sémát – csak migrációval.
        push: false,
      })
    : sqliteAdapter({ client: { url: databaseUrl } }),
  sharp,
  plugins: [
    // Éles környezetben (Vercel) a képek a Vercel Blob tárhelyre kerülnek.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // A séma ne függjön attól, be van-e állítva a token (helyben nincs, élesben van).
      alwaysInsertFields: true,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
    // Jelentkezői logók és szerződések: a letöltést a Payload jogosultsága védi (/api/.../file/…),
    // a Blobon pedig véletlen utótagot kapnak, így a közvetlen cím nem kitalálható.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // A séma ne függjön attól, be van-e állítva a token (helyben nincs, élesben van).
      alwaysInsertFields: true,
      collections: { 'application-logos': true, 'application-documents': true },
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
