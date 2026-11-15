import type { Locale } from './i18n'

/** Az oldalak útvonalai nyelvenként – a nyelvválasztó ezek között vált. */
export const paths = {
  home: { hu: '/', en: '/en' },
  exhibitors: { hu: '/kiallitok', en: '/en/exhibitors' },
  exhibitorApplication: { hu: '/kiallitoi-jelentkezes', en: '/en/exhibitor-application' },
} as const

export type PageKey = keyof typeof paths

/** Főoldali szekcióra mutató link, ami aloldalról is működik (pl. /#program, /en#program). */
export const homeAnchor = (locale: Locale, id: string) => `${locale === 'hu' ? '/' : '/en'}#${id}`

/** Kiállítói jelentkezés oldala (az e-mail paraméter a régi hívások miatt maradt, már nem használt). */
export const exhibitorApplyHref = (locale: Locale, _email?: string | null) => paths.exhibitorApplication[locale]
