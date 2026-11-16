/* eslint-disable @next/next/no-img-element */
import React from 'react'

import { applyClosedInfo, type SiteData } from '@/lib/getSiteData'
import { asMedia, mediaUrl } from '@/lib/media'
import { dictionary, type Locale } from '@/lib/i18n'

import { FaqList } from './FaqList'
import { ProgramCarousel } from './ProgramCarousel'
import { TicketForm } from './TicketForm'
import { exhibitorApplyHref, paths } from '@/lib/routes'

import { ExhibitorApplyBanner, ExhibitorCard } from './ExhibitorCard'
import { SiteShell } from './SiteShell'
import { VideoLightbox } from './VideoLightbox'
import { ArrowRight, Eyebrow, Photo, PlayIcon, container } from './ui'

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`

export function Landing({ data, locale }: { data: SiteData; locale: Locale }) {
  const t = dictionary[locale]
  const s = data.settings
  const status = s.ticketStatus ?? 'soon'
  const onSale = status === 'onSale' && Boolean(s.ticketUrl)
  const ticketHref = onSale ? s.ticketUrl! : '#jegyek'
  const external = onSale ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  const pillars = (s.pillars ?? []).map((p) => p.label).filter(Boolean)

  // Főoldalon csak néhány kiemelt márka; ha nincs kiemelt, az első 12 logós.
  const withLogo = data.exhibitors.filter((e) => mediaUrl(asMedia(e.logo), 'card'))
  const featured = (
    withLogo.some((e) => e.featured) ? withLogo.filter((e) => e.featured) : withLogo
  ).slice(0, 12)
  const exhibitorList = s.exhibitorsListTitle || t.exhibitors.listFallback

  return (
    <SiteShell data={data} locale={locale} page="home">
      {/* ============ HERO ============ */}
      <section
        id="top"
        className="relative flex min-h-[max(600px,100svh)] flex-col justify-end overflow-hidden sm:min-h-[max(680px,92svh)]"
      >
        <Photo
          media={asMedia(s.heroImage)}
          size="hero"
          priority
          overlay
          className="anim-hero-zoom"
          hint="gitáros közelről, színpadi fényben"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        />
        <div
          className={`${container} relative flex flex-wrap items-end justify-between gap-8 pt-32 pb-10 sm:pb-14`}
        >
          <div className="max-w-[760px] flex-[1_1_520px]">
            <p
              style={{ '--delay': '250ms' } as React.CSSProperties}
              className="anim-rise mb-4 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[13px] text-silver sm:mb-[18px]"
            >
              {s.dateLabel ? (
                <span className="flex items-center gap-[7px]">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                  {s.dateLabel}
                </span>
              ) : null}
              {s.venue ? (
                <span className="flex items-center gap-[7px]">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {s.venue}
                </span>
              ) : null}
            </p>
            <h1
              style={{ '--delay': '400ms' } as React.CSSProperties}
              className="anim-rise text-[clamp(38px,5.6vw,80px)] leading-[0.98] font-semibold tracking-display text-balance"
            >
              {s.heroHeadline}
            </h1>
            <div style={{ '--delay': '600ms' } as React.CSSProperties} className="anim-rise">
              <a
                href={ticketHref}
                {...external}
                className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-[22px] text-sm font-semibold text-ink transition hover:bg-orange sm:inline-flex sm:w-auto"
              >
                {onSale ? t.hero.buy : t.hero.notify}
              </a>
            </div>
          </div>

          {/* Videókártya (pl. előző évi recap) – lejátszás felugró ablakban */}
          {s.nextEventVideoId ? (
            <div
              style={{ '--delay': '800ms' } as React.CSSProperties}
              className="anim-rise flex w-full flex-col gap-3 sm:max-w-[400px]"
            >
              <Eyebrow className="text-[11px] text-white">
                {s.heroCardLabel || t.hero.recap}
              </Eyebrow>
              <VideoLightbox
                videoId={s.nextEventVideoId}
                title={s.heroCardTitle || t.hero.recap}
                closeLabel={t.hero.close}
                className="glow-orange group relative flex min-h-[180px] items-end justify-between gap-3 overflow-hidden rounded-[12px] border border-orange/50 bg-[#0c0c10] p-4 text-white transition duration-300 hover:-translate-y-1 hover:border-orange sm:min-h-[225px] sm:p-5"
              >
                {asMedia(s.nextEventImage) ? (
                  <Photo
                    media={asMedia(s.nextEventImage)}
                    size="card"
                    overlay
                    className="transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={`https://i.ytimg.com/vi/${s.nextEventVideoId}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"
                />
                <span className="relative flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-silver">
                    BUDAPEST GUITAR SHOW
                  </span>
                  <span className="text-[30px] leading-none font-semibold tracking-[-0.03em] sm:text-[34px]">
                    {s.heroCardTitle || t.hero.recap}
                  </span>
                </span>
                <span className="relative flex min-h-10 flex-none items-center gap-2 rounded-full bg-orange px-4 text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(255,106,0,0.5)] transition group-hover:scale-105">
                  <PlayIcon />
                  {t.hero.video}
                </span>
              </VideoLightbox>
            </div>
          ) : null}
        </div>
      </section>

      {/* ============ PROGRAM ============ */}
      {data.programs.length > 0 ? (
        <ProgramCarousel
          heading={t.program.heading}
          allLabel={t.program.all}
          prevLabel={t.program.prev}
          nextLabel={t.program.next}
        >
          {data.programs.map((p) => (
            <article
              key={p.id}
              data-reveal=""
              className="relative flex h-[350px] w-[238px] flex-none snap-start flex-col items-center justify-end overflow-hidden rounded-[10px] px-[18px] pb-[22px] text-center"
            >
              <Photo media={asMedia(p.image)} size="card" overlay hint="program" />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
              />
              <span className="relative text-[9px] font-semibold tracking-[0.2em] text-silver">
                BUDAPEST GUITAR SHOW
              </span>
              <h3 className="relative mt-1.5 mb-2.5 text-[28px] leading-none font-semibold tracking-[-0.035em]">
                {p.title}
              </h3>
              {p.description ? (
                <p className="relative text-xs leading-snug text-silver">{p.description}</p>
              ) : null}
            </article>
          ))}
        </ProgramCarousel>
      ) : null}

      {/* ============ STATEMENT ============ */}
      {s.statementHeading ? (
        <section className="relative mt-14 flex min-h-[600px] items-center justify-center text-center">
          <Photo
            media={asMedia(s.statementImage)}
            size="hero"
            overlay
            hint="kéz a fogólapon, közönség"
          />
          <div
            data-reveal=""
            className="relative flex max-w-[760px] flex-col items-center px-6 py-20"
          >
            <h2 className="text-[clamp(40px,5.2vw,72px)] leading-none font-semibold tracking-[-0.05em] whitespace-pre-line">
              {s.statementHeading}
            </h2>
            {s.statementText ? (
              <p className="mt-[18px] max-w-[440px] text-[15px] leading-normal text-silver">
                {s.statementText}
              </p>
            ) : null}
            <a
              href="#program"
              className="mt-[26px] flex min-h-11 items-center rounded-full bg-white px-[22px] text-[13px] font-semibold text-ink transition hover:bg-orange"
            >
              {t.statement.cta}
            </a>
          </div>
        </section>
      ) : null}

      {/* ============ PILLARS ============ */}
      {pillars.length > 0 ? (
        <section className="bg-white text-ink">
          <div className={`${container} flex flex-wrap items-center gap-12 py-16`}>
            <div className="flex-[1_1_440px]">
              <p
                data-reveal=""
                className="mb-[34px] font-mono text-[11px] tracking-[0.04em] uppercase"
              >
                ● {t.pillars.label}
              </p>
              <ul>
                {pillars.map((label, i) => (
                  <li
                    key={i}
                    data-reveal=""
                    className="text-[clamp(36px,3.6vw,50px)] leading-[1.08] font-medium tracking-display"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              {s.pillarsText ? (
                <p
                  data-reveal=""
                  className="mt-[34px] max-w-[400px] text-[15px] leading-relaxed text-graphite"
                >
                  {s.pillarsText}
                </p>
              ) : null}
            </div>
            <div
              data-reveal="clip"
              className="relative min-h-[480px] flex-[1_1_460px] overflow-hidden rounded-[10px] sm:min-h-[600px]"
            >
              <Photo
                media={asMedia(s.pillarsImage)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                hint="fellépő háttal, előtte a közönség"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ PERFORMERS ============ */}
      {data.performers.length > 0 ? (
        <section id="fellepok" className={`${container} scroll-mt-24 pt-24`}>
          <div data-reveal="">
            <Eyebrow className="mb-[18px] text-silver">{t.performers.label}</Eyebrow>
          </div>
          <h2
            data-reveal=""
            className="mb-10 max-w-[720px] text-[clamp(36px,4.2vw,56px)] leading-none font-semibold tracking-[-0.05em]"
          >
            {t.performers.heading}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {data.performers.map((p) => (
              <article key={p.id} data-reveal="" className="flex flex-col gap-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[10px]">
                  <Photo media={asMedia(p.photo)} size="card" hint="portré" />
                  {p.day ? (
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] tracking-wider text-white uppercase">
                      {p.day}. {t.performers.day}
                    </span>
                  ) : null}
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{p.name}</h3>
                  {p.role ? <p className="text-[13px] text-muted">{p.role}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============ VIDEOS ============ */}
      {data.videos.length > 0 ? (
        <section id="videok" className={`${container} scroll-mt-24 pt-24`}>
          <div data-reveal="" className="mb-5 flex items-baseline gap-3.5">
            <h2 className="text-[22px] font-semibold tracking-[-0.035em]">{t.videos.heading}</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.videos.map((v) => {
              const thumb =
                mediaUrl(asMedia(v.thumbnail), 'card') ??
                `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`
              return (
                <a
                  key={v.id}
                  href={yt(v.youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-reveal=""
                  className="group flex flex-col gap-2.5 text-white"
                >
                  <span className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-[10px] bg-surface-2">
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                    <span className="relative flex min-h-[34px] items-center gap-1.5 rounded-full bg-black/45 px-3.5 text-xs font-semibold backdrop-blur">
                      <PlayIcon />
                      {t.videos.play}
                    </span>
                  </span>
                  <span className="text-sm font-medium tracking-[-0.01em]">{v.title}</span>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ============ EXHIBITORS ============ */}
      {data.exhibitors.length > 0 ? (
        <section id="kiallitok" className={`${container} scroll-mt-24 pt-[120px]`}>
          <div data-reveal="" className="mb-12 flex flex-wrap items-end justify-between gap-8">
            <div className="flex-[1_1_480px]">
              <Eyebrow className="mb-[18px] text-silver">{t.exhibitors.label}</Eyebrow>
              <h2 className="text-[clamp(40px,4.6vw,64px)] leading-none font-semibold tracking-[-0.05em] whitespace-pre-line">
                {s.exhibitorsHeading}
              </h2>
            </div>
            {s.exhibitorsText ? (
              <p className="flex-[0_1_360px] text-[15px] leading-relaxed text-silver">
                {s.exhibitorsText}
              </p>
            ) : null}
          </div>

          <h3 data-reveal="" className="mb-5 text-[22px] font-semibold tracking-[-0.035em]">
            {exhibitorList}
          </h3>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((e) => (
              <li key={e.id} data-reveal="">
                <ExhibitorCard
                  broughtBy={t.exhibitors.broughtBy}
                  item={{
                    id: e.id,
                    name: e.name,
                    exhibitor: e.exhibitor,
                    website: e.website,
                    logo: mediaUrl(asMedia(e.logo), 'card'),
                  }}
                />
              </li>
            ))}
          </ul>

          <div data-reveal="" className="mt-10 flex justify-center">
            <a
              href={paths.exhibitors[locale]}
              className="flex min-h-12 items-center gap-2 rounded-full bg-orange px-7 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(255,106,0,0.7)] transition hover:bg-accent-strong"
            >
              {t.exhibitors.all}
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                {data.exhibitors.length}
              </span>
              <ArrowRight />
            </a>
          </div>

          <div className="mt-16">
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
      ) : null}

      {/* ============ FAQ ============ */}
      {data.faqs.length > 0 ? (
        <section id="gyik" className={`${container} flex scroll-mt-24 flex-wrap gap-12 pt-[120px]`}>
          <div data-reveal="" className="flex-[1_1_320px]">
            <Eyebrow className="mb-[18px] text-silver">{t.faq.label}</Eyebrow>
            <h2 className="text-[clamp(36px,3.8vw,52px)] leading-none font-semibold tracking-[-0.05em]">
              {t.faq.heading}
            </h2>
            {s.contactEmail ? (
              <p className="mt-[18px] text-[15px] leading-relaxed text-muted">
                {t.faq.more}{' '}
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="text-white underline underline-offset-4"
                >
                  {t.faq.write}
                </a>
                .
              </p>
            ) : null}
          </div>
          <div data-reveal="" className="flex-[2_1_560px]">
            <FaqList
              items={data.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
            />
          </div>
        </section>
      ) : null}

      {/* ============ TICKETS ============ */}
      <section id="jegyek" className={`${container} scroll-mt-24 pt-[120px]`}>
        <div
          data-reveal=""
          className="flex flex-wrap items-end justify-between gap-10 rounded-[14px] bg-surface px-6 py-12 sm:px-10 sm:py-14"
        >
          <div className="flex-[1_1_440px]">
            <Eyebrow className="mb-[18px] text-silver">{t.tickets.label}</Eyebrow>
            <h2 className="text-[clamp(40px,4.6vw,64px)] leading-none font-semibold tracking-[-0.05em]">
              {onSale
                ? t.tickets.onSaleHeading
                : status === 'soldOut'
                  ? t.tickets.soldOutHeading
                  : t.tickets.soonHeading}
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-silver">
              {onSale
                ? t.tickets.onSaleText
                : status === 'soldOut'
                  ? t.tickets.soldOutText
                  : t.tickets.soonText}
            </p>
          </div>
          {onSale ? (
            <a
              href={s.ticketUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center gap-2 rounded-full bg-accent-strong px-6 text-sm font-semibold text-white transition hover:bg-orange"
            >
              {t.hero.buy}
              <ArrowRight />
            </a>
          ) : (
            <TicketForm locale={locale} t={t.tickets} />
          )}
        </div>
      </section>
    </SiteShell>
  )
}
