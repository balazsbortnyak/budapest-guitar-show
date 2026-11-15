import React from 'react'

import type { SiteData } from '@/lib/getSiteData'
import { dictionary, type Locale } from '@/lib/i18n'
import { homeAnchor, paths, type PageKey } from '@/lib/routes'

import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { RevealObserver } from './RevealObserver'
import { ArrowRight, LangSwitch, container } from './ui'

/** Közös keret minden oldalhoz: fix fejléc (navigáció, nyelvválasztó, jegy gomb) és lábléc. */
export function SiteShell({
  data,
  locale,
  page,
  children,
}: {
  data: SiteData
  locale: Locale
  page: PageKey
  children: React.ReactNode
}) {
  const t = dictionary[locale]
  const s = data.settings
  const home = paths.home[locale]
  const langHrefs = paths[page]

  const status = s.ticketStatus ?? 'soon'
  const onSale = status === 'onSale' && Boolean(s.ticketUrl)
  const ticketHref = onSale ? s.ticketUrl! : homeAnchor(locale, 'jegyek')
  const ticketLabel =
    status === 'onSale' ? t.ticket.onSale : status === 'soldOut' ? t.ticket.soldOut : t.ticket.soon
  const external = onSale ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  const navItems = [
    { href: homeAnchor(locale, 'program'), label: t.nav.program, show: data.programs.length > 0 },
    {
      href: homeAnchor(locale, 'fellepok'),
      label: t.nav.performers,
      show: data.performers.length > 0,
    },
    { href: paths.exhibitors[locale], label: t.nav.exhibitors, show: data.exhibitors.length > 0 },
    { href: homeAnchor(locale, 'videok'), label: t.nav.videos, show: data.videos.length > 0 },
    { href: homeAnchor(locale, 'gyik'), label: t.nav.faq, show: data.faqs.length > 0 },
    { href: '#kapcsolat', label: t.nav.contact, show: true },
  ].filter((n) => n.show)

  const socials = [
    { label: 'Facebook', href: s.facebookUrl },
    { label: 'Instagram', href: s.instagramUrl },
    { label: 'TikTok', href: s.tiktokUrl },
  ].filter((x): x is { label: string; href: string } => Boolean(x.href))

  return (
    <div className="min-h-screen overflow-x-clip">
      <RevealObserver />
      {/* ============ NAV ============ */}
      {/* Fix fejléc a hero felett: felül teljesen fekete, lefelé átlátszóvá halványul. */}
      <header className="anim-nav pointer-events-none fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black via-black/70 to-transparent pt-[env(safe-area-inset-top)] pb-8">
        <div
          className={`${container} pointer-events-auto flex items-center justify-between gap-4 py-3 sm:py-4`}
        >
          <a
            href={home}
            aria-label="Budapest Guitar Show"
            className="relative z-[60] flex-none text-white"
          >
            <Logo className="h-11 w-auto sm:h-12" />
          </a>
          <nav
            aria-label={locale === 'hu' ? 'Fő navigáció' : 'Main navigation'}
            className="hidden gap-6 text-[13px] font-medium lg:flex"
          >
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className="text-white/90 transition hover:text-orange">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="relative z-50 flex items-center gap-2 text-[13px] font-medium sm:gap-3">
            <LangSwitch locale={locale} hrefs={langHrefs} className="hidden sm:flex" />
            <a
              href={ticketHref}
              {...external}
              className="relative z-50 flex min-h-11 items-center gap-1.5 rounded-full bg-accent-strong px-4 font-semibold whitespace-nowrap text-white transition hover:bg-orange sm:px-[18px]"
            >
              <span className="sm:hidden">{t.ticket.short}</span>
              <span className="hidden sm:inline">{ticketLabel}</span>
              <ArrowRight />
            </a>
            <MobileMenu
              items={navItems}
              menuLabel={t.nav.menu}
              closeLabel={t.nav.close}
              footer={
                <LangSwitch locale={locale} hrefs={langHrefs} size="h-6 w-9" className="gap-3" />
              }
            />
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* ============ FOOTER ============ */}
      <footer id="kapcsolat" className={`${container} scroll-mt-24 pt-24 pb-9`}>
        <div
          data-reveal=""
          className="flex flex-wrap justify-between gap-12 border-b border-line pb-12"
        >
          <div className="flex max-w-[380px] flex-[1_1_300px] flex-col gap-3.5">
            <a href={home} aria-label="Budapest Guitar Show" className="self-start text-white">
              <Logo className="h-24 w-auto" />
            </a>
            <p className="text-sm leading-relaxed text-muted">{t.footer.tagline}</p>
            {s.contactEmail ? (
              <a
                href={`mailto:${s.contactEmail}`}
                className="text-sm font-medium hover:text-silver"
              >
                {s.contactEmail}
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-16 text-[13px]">
            <FooterCol title={t.footer.event} label={t.footer.event}>
              {navItems
                .filter((n) => n.href !== '#kapcsolat')
                .map((n) => (
                  <a key={n.href} href={n.href} className="hover:text-silver">
                    {n.label}
                  </a>
                ))}
            </FooterCol>
            {socials.length > 0 ? (
              <FooterCol title={t.footer.follow} label={t.footer.follow}>
                {socials.map((x) => (
                  <a
                    key={x.label}
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-silver"
                  >
                    {x.label}
                  </a>
                ))}
              </FooterCol>
            ) : null}
            <FooterCol title={t.footer.language} label={t.footer.language}>
              <LangSwitch locale={locale} hrefs={langHrefs} className="-ml-2" />
            </FooterCol>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs text-faint">
          <span>© {new Date().getFullYear()} Budapest Guitar Show</span>
          <span>
            {t.footer.privacy} · {t.footer.imprint}
          </span>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({
  title,
  label,
  children,
}: {
  title: string
  label: string
  children: React.ReactNode
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2.5">
      <span className="font-mono text-[10px] tracking-[0.1em] text-faint uppercase">{title}</span>
      {children}
    </nav>
  )
}
