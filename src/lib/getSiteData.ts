import config from '@payload-config'
import { getPayload } from 'payload'

import type { ApplicationsClosed } from '@/components/ApplyButton'

import { dictionary, type Locale } from './i18n'

export async function getSiteData(locale: Locale) {
  const payload = await getPayload({ config })
  const published = { published: { equals: true } }

  const [settings, programs, performers, videos, exhibitors, faqs, onboarding] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', locale, depth: 1 }),
    payload.find({
      collection: 'programs',
      locale,
      where: published,
      sort: 'order',
      limit: 30,
      depth: 1,
    }),
    payload.find({
      collection: 'performers',
      locale,
      where: published,
      sort: 'order',
      limit: 60,
      depth: 1,
    }),
    payload.find({
      collection: 'videos',
      locale,
      where: published,
      sort: 'order',
      limit: 12,
      depth: 1,
    }),
    payload.find({
      collection: 'exhibitors',
      locale,
      where: published,
      sort: 'name',
      limit: 300,
      depth: 1,
    }),
    payload.find({ collection: 'faqs', locale, where: published, sort: 'order', limit: 50 }),
    payload.findGlobal({
      slug: 'exhibitor-onboarding',
      locale,
      depth: 0,
      select: { applicationsOpen: true, closedTitle: true, closedText: true },
    }),
  ])

  return {
    settings,
    programs: programs.docs,
    performers: performers.docs,
    videos: videos.docs,
    exhibitors: exhibitors.docs,
    faqs: faqs.docs,
    applications: {
      open: Boolean(onboarding.applicationsOpen),
      closedTitle: onboarding.closedTitle ?? '',
      closedText: onboarding.closedText ?? '',
    },
  }
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>

/** A „jelentkezés zárva” felugró ablak tartalma (Payload szöveg, vagy az alapértelmezett), ill. null, ha nyitva van. */
export function applyClosedInfo(data: SiteData, locale: Locale): ApplicationsClosed | null {
  if (data.applications.open) return null
  const t = dictionary[locale].exhibitors
  return {
    title: data.applications.closedTitle || t.closedTitle,
    text: data.applications.closedText || t.closedText,
    contactLabel: t.closedContact,
    email: data.settings.contactEmail,
    ok: t.closedOk,
  }
}

export { asMedia, mediaUrl } from './media'
