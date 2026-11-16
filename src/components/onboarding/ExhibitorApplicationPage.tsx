import config from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { dictionary, type Locale } from '@/lib/i18n'
import { toPricingConfig } from '@/lib/onboarding'
import { paths } from '@/lib/routes'

import { Logo } from '../Logo'
import { OnboardingWizard, type OnboardingContent } from './OnboardingWizard'

/** /kiallitoi-jelentkezes és /en/exhibitor-application – a tartalom és az árak a Payloadból jönnek. */
export async function ExhibitorApplicationPage({ locale }: { locale: Locale }) {
  const payload = await getPayload({ config })
  const g = await payload.findGlobal({ slug: 'exhibitor-onboarding', locale })

  if (!g.applicationsOpen) {
    const settings = await payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })
    const t = dictionary[locale].exhibitors
    return (
      <ApplicationsClosedPage
        locale={locale}
        title={g.closedTitle || t.closedTitle}
        text={g.closedText || t.closedText}
        contactLabel={t.closedContact}
        email={settings.contactEmail}
        back={t.closedBack}
      />
    )
  }

  const step = (s?: { heading?: string | null; text?: string | null } | null) => ({
    heading: s?.heading ?? '',
    text: s?.text ?? '',
  })

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
      links={{
        exit: paths.exhibitors[locale],
        home: paths.home[locale],
        lang: paths.exhibitorApplication,
      }}
    />
  )
}

/** A jelentkezési oldal, amíg a jelentkezés zárva van (Payload → Kiállítói jelentkezés → „A jelentkezés nyitva van”). */
function ApplicationsClosedPage({
  locale,
  title,
  text,
  contactLabel,
  email,
  back,
}: {
  locale: Locale
  title: string
  text: string
  contactLabel: string
  email?: string | null
  back: string
}) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink px-4 py-16 text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-orange/15 blur-3xl"
      />
      <a href={paths.home[locale]} className="relative mb-10" aria-label="Budapest Guitar Show">
        <Logo className="h-10 w-auto" />
      </a>
      <div className="anim-rise relative w-full max-w-[520px] rounded-[16px] border border-orange/40 bg-surface px-6 py-10 text-center shadow-[0_0_80px_-20px_rgba(255,106,0,0.55)] sm:px-10">
        <span
          aria-hidden="true"
          className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-orange/15 text-orange"
        >
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h1 className="text-[clamp(26px,4vw,34px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-silver">{text}</p>
        {email ? (
          <p className="mt-5 text-sm text-silver">
            {contactLabel}{' '}
            <a
              href={`mailto:${email}`}
              className="font-semibold text-white underline-offset-4 hover:text-orange hover:underline"
            >
              {email}
            </a>
          </p>
        ) : null}
        <a
          href={paths.exhibitors[locale]}
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-orange hover:text-white"
        >
          {back}
        </a>
      </div>
    </main>
  )
}
