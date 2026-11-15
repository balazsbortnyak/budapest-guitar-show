import type { Metadata } from 'next'

import { ExhibitorsPage } from '@/components/ExhibitorsPage'
import { getSiteData } from '@/lib/getSiteData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Exhibitors and brands – Budapest Guitar Show',
  description: 'Exhibitors and brands at Budapest Guitar Show – search by name and see who brings them.',
  alternates: { languages: { hu: '/kiallitok', en: '/en/exhibitors' } },
}

export default async function Page() {
  const data = await getSiteData('en')
  return <ExhibitorsPage data={data} locale="en" />
}
