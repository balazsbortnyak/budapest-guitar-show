import type { Metadata } from 'next'

import { ExhibitorsPage } from '@/components/ExhibitorsPage'
import { getSiteData } from '@/lib/getSiteData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kiállítók és márkák – Budapest Guitar Show',
  description: 'A Budapest Guitar Show kiállítói és márkái – keress név szerint, és nézd meg, ki hozza őket.',
  alternates: { languages: { hu: '/kiallitok', en: '/en/exhibitors' } },
}

export default async function Page() {
  const data = await getSiteData('hu')
  return <ExhibitorsPage data={data} locale="hu" />
}
