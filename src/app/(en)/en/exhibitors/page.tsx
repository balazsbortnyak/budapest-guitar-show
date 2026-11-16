import type { Metadata } from 'next'

import { ExhibitorsPage } from '@/components/ExhibitorsPage'
import { getSiteData } from '@/lib/getSiteData'

// Gyorsítótárazott oldal: admin-mentéskor azonnal frissül (src/hooks/revalidate.ts), tartalékként 5 percenként.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Exhibitors and brands – Budapest Guitar Show',
  description:
    'Exhibitors and brands at Budapest Guitar Show – search by name and see who brings them.',
  alternates: { languages: { hu: '/kiallitok', en: '/en/exhibitors' } },
}

export default async function Page() {
  const data = await getSiteData('en')
  return <ExhibitorsPage data={data} locale="en" />
}
