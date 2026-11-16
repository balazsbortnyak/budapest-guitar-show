import { Landing } from '@/components/Landing'
import { getSiteData } from '@/lib/getSiteData'

// Gyorsítótárazott oldal: admin-mentéskor azonnal frissül (src/hooks/revalidate.ts), tartalékként 5 percenként.
export const revalidate = 300

export default async function Page() {
  const data = await getSiteData('hu')
  return <Landing data={data} locale="hu" />
}
