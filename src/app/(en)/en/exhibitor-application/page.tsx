import type { Metadata } from 'next'

import { ExhibitorApplicationPage } from '@/components/onboarding/ExhibitorApplicationPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Exhibitor application – Budapest Guitar Show',
  description: 'Apply as an exhibitor at Budapest Guitar Show: enter your details, design your booth and see the estimated cost instantly.',
  alternates: { languages: { hu: '/kiallitoi-jelentkezes', en: '/en/exhibitor-application' } },
}

export default function Page() {
  return <ExhibitorApplicationPage locale="en" />
}
