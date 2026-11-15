import config from '@payload-config'
import { getPayload } from 'payload'

import type { Locale } from './i18n'

export async function getSiteData(locale: Locale) {
  const payload = await getPayload({ config })
  const published = { published: { equals: true } }

  const [settings, programs, performers, videos, exhibitors, faqs] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', locale, depth: 1 }),
    payload.find({ collection: 'programs', locale, where: published, sort: 'order', limit: 30, depth: 1 }),
    payload.find({ collection: 'performers', locale, where: published, sort: 'order', limit: 60, depth: 1 }),
    payload.find({ collection: 'videos', locale, where: published, sort: 'order', limit: 12, depth: 1 }),
    payload.find({ collection: 'exhibitors', locale, where: published, sort: 'name', limit: 300, depth: 1 }),
    payload.find({ collection: 'faqs', locale, where: published, sort: 'order', limit: 50 }),
  ])

  return {
    settings,
    programs: programs.docs,
    performers: performers.docs,
    videos: videos.docs,
    exhibitors: exhibitors.docs,
    faqs: faqs.docs,
  }
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>

export { asMedia, mediaUrl } from './media'
