import { Landing } from '@/components/Landing'
import { getSiteData } from '@/lib/getSiteData'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getSiteData('en')
  return <Landing data={data} locale="en" />
}
