import config from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Locale } from '@/lib/i18n'
import { toPricingConfig } from '@/lib/onboarding'
import { paths } from '@/lib/routes'

import { OnboardingWizard, type OnboardingContent } from './OnboardingWizard'

/** /kiallitoi-jelentkezes és /en/exhibitor-application – a tartalom és az árak a Payloadból jönnek. */
export async function ExhibitorApplicationPage({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })
  const g = await payload.findGlobal({ slug: 'exhibitor-onboarding', locale })

  const step = (s?: { heading?: string | null; text?: string | null } | null) => ({ heading: s?.heading ?? '', text: s?.text ?? '' })

  const content: OnboardingContent = {
    title: g.title ?? '',
    intro: g.intro ?? '',
    welcomeHeading: g.welcomeHeading ?? '',
    welcomeText: g.welcomeText ?? '',
    stats: (g.stats ?? []).map((s) => ({ value: s.value, label: s.label })),
    steps: {
      company: step(g.stepCompany),
      contact: step(g.stepContact),
      brands: step(g.stepBrands),
      booth: step(g.stepBooth),
      extras: step(g.stepExtras),
      summary: step(g.stepSummary),
    },
    totalNote: g.totalNote ?? '',
    consentText: g.consentText ?? '',
    successHeading: g.successHeading ?? '',
    successText: g.successText ?? '',
  }

  return (
    <OnboardingWizard
      locale={locale}
      content={content}
      cfg={toPricingConfig(g)}
      links={{ exit: paths.exhibitors[locale], home: paths.home[locale], lang: paths.exhibitorApplication }}
    />
  )
}
