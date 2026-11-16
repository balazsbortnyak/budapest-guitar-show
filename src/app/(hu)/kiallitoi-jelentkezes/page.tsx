import type { Metadata } from 'next'

import { ExhibitorApplicationPage } from '@/components/onboarding/ExhibitorApplicationPage'

// Gyorsítótárazott oldal: admin-mentéskor azonnal frissül (src/hooks/revalidate.ts), tartalékként 5 percenként.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Kiállítói jelentkezés – Budapest Guitar Show',
  description:
    'Jelentkezz kiállítónak a Budapest Guitar Show-ra: néhány lépésben megadhatod az adataidat, megtervezheted a standod, és azonnal látod a várható költséget.',
  alternates: { languages: { hu: '/kiallitoi-jelentkezes', en: '/en/exhibitor-application' } },
}

export default function Page() {
  return <ExhibitorApplicationPage locale="hu" />
}
