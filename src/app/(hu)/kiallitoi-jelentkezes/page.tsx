import type { Metadata } from 'next'

import { ExhibitorApplicationPage } from '@/components/onboarding/ExhibitorApplicationPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kiállítói jelentkezés – Budapest Guitar Show',
  description: 'Jelentkezz kiállítónak a Budapest Guitar Show-ra: néhány lépésben megadhatod az adataidat, megtervezheted a standod, és azonnal látod a várható költséget.',
  alternates: { languages: { hu: '/kiallitoi-jelentkezes', en: '/en/exhibitor-application' } },
}

export default function Page() {
  return <ExhibitorApplicationPage locale="hu" />
}
