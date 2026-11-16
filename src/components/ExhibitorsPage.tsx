import React from 'react'

import { applyClosedInfo, type SiteData } from '@/lib/getSiteData'
import { dictionary, type Locale } from '@/lib/i18n'
import { asMedia, mediaUrl } from '@/lib/media'
import { exhibitorApplyHref, paths } from '@/lib/routes'

import { ExhibitorApplyBanner } from './ExhibitorCard'
import { ExhibitorBrowser } from './ExhibitorBrowser'
import { SiteShell } from './SiteShell'
import { Chevron, Eyebrow, container } from './ui'

/** /kiallitok és /en/exhibitors – az összes kiállító és márka, névre kereshető listával. */
export function ExhibitorsPage({ data, locale }: { data: SiteData; locale: Locale }) {
  const t = dictionary[locale]
  const s = data.settings

  // Logós márkák elöl, a csak névvel szereplők a végén – mindkét csoporton belül ábécérendben.
  const items = data.exhibitors
    .map((e) => ({
      id: e.id,
      name: e.name,
      exhibitor: e.exhibitor ?? null,
      website: e.website ?? null,
      logo: mediaUrl(asMedia(e.logo), 'card'),
    }))
    .sort((a, b) => Number(!a.logo) - Number(!b.logo) || a.name.localeCompare(b.name, locale))

  // Kiállítók: a forgalmazó, vagy ha a márka saját standdal jött, maga a márka.
  // A csak névvel (logó és kiállító nélkül) szereplő márkák nem számítanak külön kiállítónak.
  const exhibitorCount = new Set(
    data.exhibitors.filter((e) => e.exhibitor || asMedia(e.logo)).map((e) => e.exhibitor || e.name),
  ).size

  return (
    <SiteShell data={data} locale={locale} page="exhibitors">
      <section className={`${container} pt-36 sm:pt-40`}>
        <a
          href={paths.home[locale]}
          className="anim-rise mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-orange"
        >
          <Chevron dir="left" />
          {t.exhibitors.back}
        </a>
        <div
          style={{ '--delay': '100ms' } as React.CSSProperties}
          className="anim-rise mb-12 flex flex-wrap items-end justify-between gap-8"
        >
          <div className="max-w-[760px] flex-[1_1_480px]">
            <Eyebrow className="mb-[18px] text-silver">{t.exhibitors.pageTitle}</Eyebrow>
            <h1 className="text-[clamp(40px,5.6vw,76px)] leading-[0.98] font-semibold tracking-display text-balance">
              {s.exhibitorsListTitle || t.exhibitors.listFallback}
            </h1>
            <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-silver">
              {t.exhibitors.pageIntro}
            </p>
          </div>
          <dl className="flex gap-10">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase">
                {t.exhibitors.brands}
              </dt>
              <dd className="text-[44px] leading-none font-semibold tracking-[-0.04em] text-orange">
                {items.length}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase">
                {t.exhibitors.exhibitors}
              </dt>
              <dd className="text-[44px] leading-none font-semibold tracking-[-0.04em]">
                {exhibitorCount}
              </dd>
            </div>
          </dl>
        </div>

        <div style={{ '--delay': '250ms' } as React.CSSProperties} className="anim-rise">
          <ExhibitorBrowser
            items={items}
            labels={{
              search: t.exhibitors.search,
              placeholder: t.exhibitors.searchPlaceholder,
              results: t.exhibitors.results,
              noResults: t.exhibitors.noResults,
              clear: t.exhibitors.clear,
              broughtBy: t.exhibitors.broughtBy,
            }}
          />
        </div>

        <div className="mt-24">
          <ExhibitorApplyBanner
            href={exhibitorApplyHref(locale, s.contactEmail)}
            eyebrow={t.exhibitors.applyEyebrow}
            heading={t.exhibitors.applyHeading}
            text={t.exhibitors.applyText}
            cta={t.exhibitors.apply}
            closed={applyClosedInfo(data, locale)}
          />
        </div>
      </section>
    </SiteShell>
  )
}
