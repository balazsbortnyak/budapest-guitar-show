'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { submitExhibitorApplication } from '@/app/actions/exhibitorApplication'
import {
  computeQuote,
  findTier,
  formatHuf,
  formatNumber,
  type ExtraSelection,
  type PricingConfig,
} from '@/lib/onboarding'
import { onboardingDict, type OnboardingDict } from '@/lib/onboardingI18n'

import { Logo } from '../Logo'
import { LangSwitch } from '../ui'
import { BoothDesigner } from './BoothDesigner'

export type OnboardingContent = {
  title: string
  intro: string
  welcomeHeading: string
  welcomeText: string
  stats: { value: string; label: string }[]
  steps: Record<
    'company' | 'contact' | 'brands' | 'booth' | 'extras' | 'summary',
    { heading: string; text: string }
  >
  totalNote: string
  consentText: string
  successHeading: string
  successText: string
}

type StepKey = 'welcome' | 'company' | 'contact' | 'brands' | 'booth' | 'extras' | 'summary'
const STEPS: StepKey[] = ['welcome', 'company', 'contact', 'brands', 'booth', 'extras', 'summary']

type FormState = {
  applicantType: 'company' | 'individual'
  companyName: string
  taxNumber: string
  registrationNumber: string
  billingAddress: string
  contactName: string
  phone: string
  email: string
  website: string
  brands: { key: string; name: string }[]
  width: number
  depth: number
  extras: ExtraSelection
  message: string
  consent: boolean
}

type Errors = Partial<Record<string, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\d\s/-]{6,25}$/
const WEB_RE = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i
const DRAFT_KEY = 'bgs-exhibitor-application-v1'

let keySeq = 0
const newKey = () => `b${Date.now().toString(36)}${keySeq++}`

const initialState = (cfg: PricingConfig): FormState => ({
  applicantType: 'company',
  companyName: '',
  taxNumber: '',
  registrationNumber: '',
  billingAddress: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  brands: [{ key: 'b0', name: '' }],
  width: Math.max(3, cfg.minSide),
  depth: Math.max(3, cfg.minSide),
  extras: {},
  message: '',
  consent: false,
})

/** Logó kicsinyítése a böngészőben (max. 800 px, WEBP) – gyors feltöltés, kis méret. */
async function shrinkLogo(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    // WEBP, ahol a böngésző tud ilyet kódolni (Safari nem – ott PNG lesz belőle).
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9))
    if (blob && (blob.type === 'image/webp' || blob.type === 'image/png')) {
      const ext = blob.type === 'image/webp' ? 'webp' : 'png'
      return new File([blob], `${file.name.replace(/\.\w+$/, '')}.${ext}`, { type: blob.type })
    }
  } catch {
    // ha a böngésző nem tudja átméretezni, az eredeti megy (a szerver ellenőrzi a méretet)
  }
  return file
}

export function OnboardingWizard({
  locale,
  content,
  cfg,
  links,
}: {
  locale: 'hu' | 'en'
  content: OnboardingContent
  cfg: PricingConfig
  links: { exit: string; home: string; lang: { hu: string; en: string } }
}) {
  const t = onboardingDict[locale]
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [form, setForm] = useState<FormState>(() => initialState(cfg))
  const [logos, setLogos] = useState<Record<string, { file: File; url: string }>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'error' | 'invalid' | 'done'>('idle')
  const [pending, startTransition] = useTransition()
  const cardRef = useRef<HTMLDivElement>(null)
  // Csak a piszkozat visszatöltése után mentünk – különben az üres kezdőállapot felülírná.
  const [hydrated, setHydrated] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Mobilon a vízszintes lépéslista az aktuális lépéshez gördül.
  useEffect(() => {
    const nav = navRef.current
    const btn = nav?.querySelector<HTMLElement>('[aria-current="step"]')
    if (nav && btn && nav.scrollWidth > nav.clientWidth) {
      const left =
        btn.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - 20
      nav.scrollTo({ left, behavior: 'smooth' })
    }
  }, [step])

  // Piszkozat visszatöltése (fájlok nélkül), hogy egy frissítés ne vesszen el semmit.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.form) setForm((f) => ({ ...f, ...parsed.form, consent: false }))
        if (typeof parsed?.maxReached === 'number') setMaxReached(parsed.maxReached)
      }
    } catch {}
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated || status === 'done') return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, maxReached }))
    } catch {}
  }, [form, maxReached, status, hydrated])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const minArea = cfg.tiers[0]?.minArea ?? 4
  const quote = useMemo(
    () =>
      computeQuote(cfg, { width: form.width, depth: form.depth }, form.extras, {
        booth: t.booth.boothLine,
        sqm: t.booth.sqm,
      }),
    [cfg, form.width, form.depth, form.extras, t.booth.boothLine, t.booth.sqm],
  )

  const key = STEPS[step]
  const isCompany = form.applicantType === 'company'

  function validate(k: StepKey): Errors {
    const e: Errors = {}
    const req = (field: keyof FormState) => {
      if (!String(form[field] ?? '').trim()) e[field] = t.errors.required
    }
    if (k === 'company') {
      req('companyName')
      req('billingAddress')
      if (isCompany) {
        req('taxNumber')
        req('registrationNumber')
      }
      if (form.website.trim() && !WEB_RE.test(form.website.trim())) e.website = t.errors.website
    }
    if (k === 'contact') {
      req('contactName')
      if (!PHONE_RE.test(form.phone.trim()))
        e.phone = form.phone.trim() ? t.errors.phone : t.errors.required
      if (!EMAIL_RE.test(form.email.trim()))
        e.email = form.email.trim() ? t.errors.email : t.errors.required
    }
    if (k === 'brands' && !form.brands.some((b) => b.name.trim())) e.brands = t.errors.brands
    if (k === 'booth' && !findTier(cfg.tiers, form.width * form.depth))
      e.booth = t.errors.area.replace('{min}', formatNumber(minArea, locale))
    if (k === 'summary' && !form.consent) e.consent = t.errors.consent
    return e
  }

  function go(to: number) {
    setStep(to)
    setMaxReached((m) => Math.max(m, to))
    setStatus('idle')
    requestAnimationFrame(() => {
      const top = (cardRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 90
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
    })
  }

  function next() {
    const e = validate(key)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        cardRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    if (key === 'summary') return submit()
    go(step + 1)
  }

  function jumpTo(i: number) {
    if (i <= maxReached) go(i)
  }

  function submit() {
    // Minden lépés újraellenőrzése (pl. egy visszatöltött piszkozatnál)
    for (let i = 1; i < STEPS.length; i++) {
      const e = validate(STEPS[i])
      if (Object.keys(e).length) {
        setErrors(e)
        go(i)
        return
      }
    }
    const brands = form.brands.filter((b) => b.name.trim())
    const fd = new FormData()
    fd.set(
      'data',
      JSON.stringify({
        locale,
        applicantType: form.applicantType,
        companyName: form.companyName,
        taxNumber: form.taxNumber,
        registrationNumber: form.registrationNumber,
        billingAddress: form.billingAddress,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        website: form.website,
        brands: brands.map((b) => ({ name: b.name, hasLogo: Boolean(logos[b.key]) })),
        booth: { width: form.width, depth: form.depth },
        extras: form.extras,
        message: form.message,
        consent: form.consent,
      }),
    )
    brands.forEach((b, i) => {
      if (logos[b.key]) fd.set(`logo-${i}`, logos[b.key].file)
    })
    fd.set(
      'nickname',
      (document.getElementById('ob-nickname') as HTMLInputElement | null)?.value ?? '',
    )

    startTransition(async () => {
      try {
        const res = await submitExhibitorApplication(fd)
        if (res.status === 'success') {
          setStatus('done')
          try {
            localStorage.removeItem(DRAFT_KEY)
          } catch {}
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else setStatus(res.status)
      } catch {
        setStatus('error')
      }
    })
  }

  const titleLines = content.title.split('\n')
  const stepLabel = (i: number) => String(i + 1).padStart(2, '0')
  const showTotal = step >= STEPS.indexOf('booth') && quote.tier

  return (
    <div className="min-h-svh overflow-x-clip bg-ink">
      {/* háttér: halvány narancs fény */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(255,106,0,0.12),transparent_70%)]"
      />

      <header className="relative z-10 border-b border-line">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href={links.home} aria-label="Budapest Guitar Show" className="text-white">
            <Logo className="h-10 w-auto sm:h-11" />
          </a>
          <div className="flex items-center gap-2">
            <LangSwitch locale={locale} hrefs={links.lang} />
            <a
              href={links.exit}
              aria-label={t.exit}
              className="grid size-11 place-items-center rounded-xl border border-line bg-surface transition hover:border-orange hover:bg-orange"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-8 px-5 pt-8 pb-16 sm:px-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14 lg:pt-14">
        {/* ============ BAL OLDAL ============ */}
        <aside className="flex flex-col lg:sticky lg:top-8 lg:self-start">
          <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.14em] text-orange uppercase">
            {t.eyebrow} · {stepLabel(status === 'done' ? STEPS.length - 1 : step)}/
            {String(STEPS.length).padStart(2, '0')}
          </p>
          <h1 className="text-[clamp(40px,4.6vw,64px)] leading-[0.95] font-semibold tracking-display">
            {titleLines.map((line, i) => (
              <span key={i} className={`block ${i > 0 ? 'text-orange' : ''}`}>
                {line}
              </span>
            ))}
          </h1>
          {content.intro ? (
            <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed text-silver">
              {content.intro}
            </p>
          ) : null}

          {status !== 'done' ? (
            <nav
              ref={navRef}
              aria-label={t.eyebrow}
              className="no-scrollbar -mx-5 mt-7 overflow-x-auto px-5 lg:mx-0 lg:mt-10 lg:overflow-visible lg:px-0"
            >
              <ol className="flex gap-1.5 lg:flex-col lg:gap-1">
                {STEPS.map((s, i) => {
                  const active = i === step
                  const done = i < step || (i <= maxReached && i !== step)
                  const reachable = i <= maxReached
                  return (
                    <li key={s} className="flex-none">
                      <button
                        type="button"
                        onClick={() => jumpTo(i)}
                        disabled={!reachable}
                        aria-current={active ? 'step' : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition lg:w-full lg:text-sm ${
                          active
                            ? 'bg-surface text-white'
                            : reachable
                              ? 'text-silver hover:bg-surface/60 hover:text-white'
                              : 'text-faint'
                        } disabled:cursor-default`}
                      >
                        <span
                          className={`grid size-8 flex-none place-items-center rounded-lg border font-mono text-[11px] ${
                            active
                              ? 'border-orange bg-orange text-white'
                              : done
                                ? 'border-orange/50 text-orange'
                                : 'border-line'
                          }`}
                        >
                          {done && !active ? (
                            <svg
                              className="size-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          ) : (
                            stepLabel(i)
                          )}
                        </span>
                        <span className="whitespace-nowrap">{t.steps[s]}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </nav>
          ) : null}

          {showTotal && status !== 'done' ? (
            <div className="mt-8 hidden rounded-[14px] border border-orange/40 bg-surface p-5 lg:block">
              <p className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">
                {t.summary.estimate}
              </p>
              <p className="mt-2 text-[30px] leading-none font-semibold tracking-[-0.03em]">
                {formatHuf(quote.net)}{' '}
                <span className="text-base font-medium text-muted">{t.summary.vatIncl}</span>
              </p>
              <p className="mt-2 text-sm text-silver">
                {formatHuf(quote.gross)} {t.summary.grossShort}
              </p>
            </div>
          ) : null}
        </aside>

        {/* ============ KÁRTYA ============ */}
        <div
          ref={cardRef}
          className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-[22px] border border-line bg-surface/90 shadow-2xl backdrop-blur"
        >
          {status === 'done' ? (
            <Success content={content} t={t} links={links} />
          ) : (
            <>
              <div className="h-[3px] bg-line" aria-hidden="true">
                <div
                  className="h-full bg-orange transition-[width] duration-500 ease-out"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  next()
                }}
              >
                {/* honeypot */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px overflow-hidden"
                >
                  <label>
                    Nickname
                    <input id="ob-nickname" type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <div key={step} className="anim-rise px-5 pt-8 pb-8 sm:px-10 sm:pt-12">
                  {key === 'welcome' ? (
                    <Welcome content={content} />
                  ) : (
                    <StepHeader
                      index={stepLabel(step)}
                      label={t.steps[key]}
                      heading={content.steps[key].heading}
                      text={content.steps[key].text}
                    />
                  )}

                  {key === 'company' ? (
                    <CompanyStep form={form} set={set} errors={errors} t={t} />
                  ) : null}
                  {key === 'contact' ? (
                    <ContactStep form={form} set={set} errors={errors} t={t} />
                  ) : null}
                  {key === 'brands' ? (
                    <BrandsStep
                      form={form}
                      setForm={setForm}
                      logos={logos}
                      setLogos={setLogos}
                      errors={errors}
                      setErrors={setErrors}
                      t={t}
                    />
                  ) : null}
                  {key === 'booth' ? (
                    <BoothStep
                      form={form}
                      cfg={cfg}
                      minArea={minArea}
                      locale={locale}
                      t={t}
                      error={errors.booth}
                      onChange={({ width, depth }) => {
                        setForm((f) => ({ ...f, width, depth }))
                        setErrors((e) => ({ ...e, booth: undefined }))
                      }}
                    />
                  ) : null}
                  {key === 'extras' ? (
                    <ExtrasStep
                      form={form}
                      setForm={setForm}
                      cfg={cfg}
                      area={quote.area}
                      locale={locale}
                      t={t}
                    />
                  ) : null}
                  {key === 'summary' ? (
                    <SummaryStep
                      form={form}
                      set={set}
                      errors={errors}
                      quote={quote}
                      cfg={cfg}
                      logos={logos}
                      content={content}
                      locale={locale}
                      t={t}
                      jumpTo={(k) => go(STEPS.indexOf(k))}
                    />
                  ) : null}

                  {status === 'invalid' || status === 'error' ? (
                    <p
                      role="alert"
                      className="mt-6 rounded-xl border border-[#ff8a66]/40 bg-[#ff8a66]/10 px-4 py-3 text-sm text-[#ffb59e]"
                    >
                      {status === 'invalid' ? t.errors.invalid : t.errors.submit}
                    </p>
                  ) : null}
                </div>

                {/* lábléc: vissza / összeg / tovább – mobilon a képernyő aljára tapad */}
                <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:px-10">
                  {step === 0 ? (
                    <a
                      href={links.exit}
                      className="flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition hover:text-white"
                    >
                      <ArrowLeft />
                      {t.exit}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go(step - 1)}
                      className="flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition hover:text-white"
                    >
                      <ArrowLeft />
                      {t.back}
                    </button>
                  )}

                  {showTotal ? (
                    <p className="hidden text-right text-xs leading-tight text-muted sm:block lg:hidden">
                      {t.summary.estimate}
                      <br />
                      <strong className="text-sm text-white">{formatHuf(quote.net)}</strong>{' '}
                      {t.summary.vatIncl}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className="group flex min-h-12 items-center gap-3 rounded-xl bg-orange py-1.5 pr-1.5 pl-5 text-[15px] font-semibold text-white shadow-[0_8px_30px_-10px_rgba(255,106,0,0.8)] transition hover:bg-accent-strong disabled:opacity-60"
                  >
                    {key === 'welcome'
                      ? t.start
                      : key === 'summary'
                        ? pending
                          ? t.sending
                          : t.submit
                        : t.next}
                    <span className="grid size-9 place-items-center rounded-lg bg-black/25 transition group-hover:translate-x-0.5">
                      <ArrowRight />
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function StepHeader({
  index,
  label,
  heading,
  text,
}: {
  index: string
  label: string
  heading: string
  text: string
}) {
  return (
    <div className="mb-8">
      <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.14em] text-orange uppercase">
        {index} · {label}
      </p>
      <h2 className="text-[clamp(30px,3.6vw,48px)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
        {heading}
      </h2>
      {text ? (
        <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-silver">{text}</p>
      ) : null}
    </div>
  )
}

function Welcome({ content }: { content: OnboardingContent }) {
  return (
    <div>
      <h2 className="text-[clamp(32px,4vw,54px)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
        {content.welcomeHeading}
      </h2>
      {content.welcomeText ? (
        <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed whitespace-pre-line text-silver">
          {content.welcomeText}
        </p>
      ) : null}
      {content.stats.length ? (
        <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {content.stats.map((s, i) => (
            <div
              key={i}
              style={{ '--delay': `${150 + i * 120}ms` } as React.CSSProperties}
              className="anim-rise flex flex-col justify-between gap-6 rounded-[16px] border border-line bg-ink p-6"
            >
              <dd className="text-[clamp(48px,5.4vw,72px)] leading-none font-semibold tracking-[-0.05em] text-orange">
                {s.value}
              </dd>
              <dt className="text-sm font-medium text-silver">{s.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

function Field({
  id,
  label,
  error,
  required,
  hint,
  className = '',
  children,
  t,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
  t: OnboardingDict
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-silver">
        {label}
        {required ? (
          <span className="text-orange" aria-label={t.required}>
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-[#ff8a66]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

const inputCls =
  'min-h-[54px] w-full rounded-xl border border-[#2e2e35] bg-ink px-4 text-[15px] text-white transition placeholder:text-faint focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,106,0,0.18)] focus:outline-none aria-[invalid=true]:border-[#ff8a66]'

function TextInput({
  id,
  value,
  onChange,
  error,
  ...rest
}: { id: string; value: string; onChange: (v: string) => void; error?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
>) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-err` : undefined}
      className={inputCls}
      {...rest}
    />
  )
}

type SetFn = <K extends keyof FormState>(key: K, value: FormState[K]) => void

function CompanyStep({
  form,
  set,
  errors,
  t,
}: {
  form: FormState
  set: SetFn
  errors: Errors
  t: OnboardingDict
}) {
  const isCompany = form.applicantType === 'company'
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-[13px] font-medium text-silver">{t.type.label}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['company', 'individual'] as const).map((v) => {
            const active = form.applicantType === v
            return (
              <label
                key={v}
                className={`flex cursor-pointer items-start gap-3.5 rounded-[14px] border p-4 transition ${
                  active ? 'border-orange bg-orange/10' : 'border-line bg-ink hover:border-white/30'
                }`}
              >
                <input
                  type="radio"
                  name="applicantType"
                  value={v}
                  checked={active}
                  onChange={() => set('applicantType', v)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 grid size-5 flex-none place-items-center rounded-full border-2 ${active ? 'border-orange' : 'border-faint'}`}
                >
                  {active ? <span className="size-2.5 rounded-full bg-orange" /> : null}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-white">{t.type[v]}</span>
                  <span className="block text-[13px] text-muted">
                    {v === 'company' ? t.type.companyHint : t.type.individualHint}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="ob-companyName"
          label={isCompany ? t.fields.companyName : t.fields.fullName}
          required
          error={errors.companyName}
          t={t}
          className="sm:col-span-2"
        >
          <TextInput
            id="ob-companyName"
            value={form.companyName}
            onChange={(v) => set('companyName', v)}
            error={errors.companyName}
            placeholder={isCompany ? t.placeholders.companyName : t.placeholders.fullName}
            autoComplete={isCompany ? 'organization' : 'name'}
            maxLength={200}
          />
        </Field>
        <Field
          id="ob-taxNumber"
          label={isCompany ? t.fields.taxNumber : t.fields.taxNumberIndividual}
          required={isCompany}
          error={errors.taxNumber}
          t={t}
        >
          <TextInput
            id="ob-taxNumber"
            value={form.taxNumber}
            onChange={(v) => set('taxNumber', v)}
            error={errors.taxNumber}
            placeholder={t.placeholders.taxNumber}
            maxLength={40}
          />
        </Field>
        {isCompany ? (
          <Field
            id="ob-registrationNumber"
            label={t.fields.registrationNumber}
            required
            error={errors.registrationNumber}
            t={t}
          >
            <TextInput
              id="ob-registrationNumber"
              value={form.registrationNumber}
              onChange={(v) => set('registrationNumber', v)}
              error={errors.registrationNumber}
              placeholder={t.placeholders.registrationNumber}
              maxLength={40}
            />
          </Field>
        ) : null}
        <Field
          id="ob-billingAddress"
          label={t.fields.billingAddress}
          required
          error={errors.billingAddress}
          t={t}
          className="sm:col-span-2"
        >
          <textarea
            id="ob-billingAddress"
            value={form.billingAddress}
            onChange={(e) => set('billingAddress', e.target.value)}
            aria-invalid={errors.billingAddress ? true : undefined}
            aria-describedby={errors.billingAddress ? 'ob-billingAddress-err' : undefined}
            placeholder={t.fields.billingPlaceholder}
            autoComplete="street-address"
            rows={2}
            maxLength={500}
            className={`${inputCls} resize-none py-3.5`}
          />
        </Field>
        <Field
          id="ob-website"
          label={t.fields.website}
          error={errors.website}
          t={t}
          className="sm:col-span-2"
        >
          <TextInput
            id="ob-website"
            type="url"
            value={form.website}
            onChange={(v) => set('website', v)}
            error={errors.website}
            placeholder={t.placeholders.website}
            autoComplete="url"
            maxLength={300}
          />
        </Field>
      </div>
    </div>
  )
}

function ContactStep({
  form,
  set,
  errors,
  t,
}: {
  form: FormState
  set: SetFn
  errors: Errors
  t: OnboardingDict
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        id="ob-contactName"
        label={t.fields.contactName}
        required
        error={errors.contactName}
        t={t}
        className="sm:col-span-2"
      >
        <TextInput
          id="ob-contactName"
          value={form.contactName}
          onChange={(v) => set('contactName', v)}
          error={errors.contactName}
          placeholder={t.placeholders.contactName}
          autoComplete="name"
          maxLength={120}
        />
      </Field>
      <Field id="ob-phone" label={t.fields.phone} required error={errors.phone} t={t}>
        <TextInput
          id="ob-phone"
          type="tel"
          value={form.phone}
          onChange={(v) => set('phone', v)}
          error={errors.phone}
          placeholder={t.placeholders.phone}
          autoComplete="tel"
          maxLength={25}
        />
      </Field>
      <Field id="ob-email" label={t.fields.email} required error={errors.email} t={t}>
        <TextInput
          id="ob-email"
          type="email"
          value={form.email}
          onChange={(v) => set('email', v)}
          error={errors.email}
          placeholder={t.placeholders.email}
          autoComplete="email"
          maxLength={254}
        />
      </Field>
    </div>
  )
}

function BrandsStep({
  form,
  setForm,
  logos,
  setLogos,
  errors,
  setErrors,
  t,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  logos: Record<string, { file: File; url: string }>
  setLogos: React.Dispatch<React.SetStateAction<Record<string, { file: File; url: string }>>>
  errors: Errors
  setErrors: React.Dispatch<React.SetStateAction<Errors>>
  t: OnboardingDict
}) {
  const [logoError, setLogoError] = useState<Record<string, string>>({})

  const update = (k: string, name: string) => {
    setForm((f) => ({ ...f, brands: f.brands.map((b) => (b.key === k ? { ...b, name } : b)) }))
    if (errors.brands) setErrors((e) => ({ ...e, brands: undefined }))
  }
  const remove = (k: string) => {
    setForm((f) => ({
      ...f,
      brands:
        f.brands.length > 1 ? f.brands.filter((b) => b.key !== k) : [{ key: newKey(), name: '' }],
    }))
    dropLogo(k)
  }
  const dropLogo = (k: string) =>
    setLogos((l) => {
      if (l[k]) URL.revokeObjectURL(l[k].url)
      const { [k]: _, ...rest } = l
      return rest
    })

  async function pick(k: string, file?: File | null) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      return setLogoError((e) => ({ ...e, [k]: t.errors.logoType }))
    if (file.size > 8 * 1024 * 1024) return setLogoError((e) => ({ ...e, [k]: t.errors.logoSize }))
    setLogoError((e) => ({ ...e, [k]: '' }))
    const small = await shrinkLogo(file)
    if (small.size > 3 * 1024 * 1024) return setLogoError((e) => ({ ...e, [k]: t.errors.logoSize }))
    setLogos((l) => {
      if (l[k]) URL.revokeObjectURL(l[k].url)
      return { ...l, [k]: { file: small, url: URL.createObjectURL(small) } }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {form.brands.map((b, i) => {
        const logo = logos[b.key]
        const inputId = `ob-brand-${b.key}`
        const fileId = `ob-logo-${b.key}`
        return (
          <div
            key={b.key}
            className="grid gap-4 rounded-[16px] border border-line bg-ink p-4 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <div>
              <label htmlFor={inputId} className="mb-2 block text-[13px] font-medium text-silver">
                {t.brands.name} {i === 0 ? <span className="text-orange">*</span> : null}
              </label>
              <input
                id={inputId}
                value={b.name}
                onChange={(e) => update(b.key, e.target.value)}
                placeholder={t.brands.namePlaceholder}
                aria-invalid={errors.brands && i === 0 ? true : undefined}
                maxLength={100}
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor={fileId}
                className="group relative grid h-[54px] w-[120px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-[#3a3a42] bg-black text-xs text-muted transition hover:border-orange hover:text-white"
              >
                {logo ? (
                  <img
                    src={logo.url}
                    alt=""
                    className="max-h-[42px] max-w-[100px] object-contain"
                  />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                    </svg>
                    {t.brands.logo}
                  </span>
                )}
                <span className="sr-only">{logo ? t.brands.change : t.brands.upload}</span>
              </label>
              <input
                id={fileId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => pick(b.key, e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => remove(b.key)}
                aria-label={`${t.brands.remove}: ${b.name || i + 1}`}
                className="grid size-[54px] place-items-center rounded-xl border border-line text-muted transition hover:border-orange hover:text-white"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
            {logoError[b.key] ? (
              <p className="text-xs text-[#ff8a66] sm:col-span-2">{logoError[b.key]}</p>
            ) : null}
          </div>
        )
      })}
      {errors.brands ? (
        <p id="ob-brands-err" className="text-xs text-[#ff8a66]">
          {errors.brands}
        </p>
      ) : (
        <p className="text-xs text-faint">{t.brands.logoHint}</p>
      )}
      {form.brands.length < 30 ? (
        <button
          type="button"
          onClick={() =>
            setForm((f) => ({ ...f, brands: [...f.brands, { key: newKey(), name: '' }] }))
          }
          className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#3a3a42] text-sm font-semibold text-silver transition hover:border-orange hover:text-white"
        >
          <span className="text-lg leading-none text-orange">+</span>
          {t.brands.add}
        </button>
      ) : null}
    </div>
  )
}

function BoothStep({
  form,
  cfg,
  minArea,
  locale,
  t,
  error,
  onChange,
}: {
  form: FormState
  cfg: PricingConfig
  minArea: number
  locale: 'hu' | 'en'
  t: OnboardingDict
  error?: string
  onChange: (v: { width: number; depth: number }) => void
}) {
  const area = form.width * form.depth
  const active = findTier(cfg.tiers, area)
  const range = (tier: PricingConfig['tiers'][number]) =>
    tier.maxArea != null
      ? `${formatNumber(tier.minArea, locale)}–${formatNumber(tier.maxArea, locale)} m²`
      : `${formatNumber(tier.minArea, locale)}+ m²`

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="ob-designer">
        <h3 id="ob-designer" className="mb-4 text-lg font-semibold tracking-[-0.02em]">
          {t.booth.designer}
        </h3>
        <BoothDesigner
          width={form.width}
          depth={form.depth}
          minSide={cfg.minSide}
          maxSide={cfg.maxSide}
          minArea={minArea}
          locale={locale}
          t={t.booth}
          onChange={onChange}
        />
        {error ? <p className="mt-3 text-xs text-[#ff8a66]">{error}</p> : null}
      </section>

      <section aria-labelledby="ob-pricing">
        <h3 id="ob-pricing" className="mb-4 text-lg font-semibold tracking-[-0.02em]">
          {t.booth.pricing}
        </h3>

        {/* asztali nézet: táblázat */}
        <div className="hidden overflow-hidden rounded-[14px] border border-line md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink font-mono text-[10px] tracking-[0.08em] text-faint uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">{t.booth.size}</th>
                <th className="px-4 py-3 font-medium">{t.booth.price}</th>
                <th className="px-3 py-3 text-center font-medium">{t.booth.badges}</th>
                <th className="px-3 py-3 text-center font-medium">{t.booth.tickets}</th>
                <th className="px-3 py-3 text-center font-medium">{t.booth.parking}</th>
                <th className="px-4 py-3 font-medium">{t.booth.perks}</th>
              </tr>
            </thead>
            <tbody>
              {cfg.tiers.map((tier) => {
                const on = tier.id === active?.id
                return (
                  <tr
                    key={tier.id}
                    className={`border-t border-line align-top transition ${on ? 'bg-orange/10' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <span className={`block font-semibold ${on ? 'text-orange' : 'text-white'}`}>
                        {range(tier)}
                      </span>
                      <span className="text-xs text-muted">{tier.label}</span>
                      {on ? (
                        <span className="mt-1.5 inline-block rounded-full bg-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                          {t.booth.selected}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-semibold whitespace-nowrap">
                      {formatHuf(tier.pricePerSqm)}
                    </td>
                    <td className="px-3 py-4 text-center text-[17px] font-semibold">
                      {tier.badges}
                    </td>
                    <td className="px-3 py-4 text-center text-[17px] font-semibold">
                      {tier.tickets}
                    </td>
                    <td className="px-3 py-4 text-center text-[17px] font-semibold">
                      {tier.parking}
                    </td>
                    <td className="px-4 py-4">
                      <Perks perks={tier.perks} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* mobil nézet: kártyák */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {cfg.tiers.map((tier) => {
            const on = tier.id === active?.id
            return (
              <div
                key={tier.id}
                className={`rounded-[14px] border p-4 ${on ? 'border-orange bg-orange/10' : 'border-line bg-ink'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`font-semibold ${on ? 'text-orange' : ''}`}>{range(tier)}</p>
                    <p className="text-xs text-muted">{tier.label}</p>
                  </div>
                  <p className="text-right text-sm font-semibold">
                    {formatHuf(tier.pricePerSqm)}
                    <span className="block text-[11px] font-normal text-muted">/ m²</span>
                  </p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      [t.booth.badges, tier.badges],
                      [t.booth.tickets, tier.tickets],
                      [t.booth.parking, tier.parking],
                    ] as const
                  ).map(([label, n]) => (
                    <div key={label} className="rounded-lg bg-black/40 py-2">
                      <dd className="text-lg font-semibold">{n}</dd>
                      <dt className="text-[10px] tracking-wide text-muted uppercase">{label}</dt>
                    </div>
                  ))}
                </dl>
                {tier.perks.length ? (
                  <div className="mt-3">
                    <Perks perks={tier.perks} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Perks({ perks }: { perks: string[] }) {
  if (!perks.length) return null
  return (
    <ul className="flex flex-col gap-1 text-[13px] text-silver">
      {perks.map((p) => (
        <li key={p} className="flex gap-2">
          <span aria-hidden="true" className="text-orange">
            ✓
          </span>
          {p}
        </li>
      ))}
    </ul>
  )
}

function ExtrasStep({
  form,
  setForm,
  cfg,
  area,
  locale,
  t,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  cfg: PricingConfig
  area: number
  locale: 'hu' | 'en'
  t: OnboardingDict
}) {
  const setExtra = (id: string, qty: number, variant?: string) =>
    setForm((f) => ({
      ...f,
      extras: { ...f.extras, [id]: { qty, variant: variant ?? f.extras[id]?.variant } },
    }))

  return (
    <ul className="flex flex-col gap-2.5">
      {cfg.extras.map((x) => {
        const sel = form.extras[x.id]
        const qty = sel?.qty ?? 0
        const on = qty > 0
        const priceLabel =
          x.price === 0
            ? t.extras.free
            : x.kind === 'quantity'
              ? `${formatHuf(x.price)} / ${x.unit || t.booth.pcs}`
              : x.kind === 'perSqm'
                ? `${formatHuf(x.price)} / m²`
                : formatHuf(x.price)
        const lineTotal =
          x.kind === 'quantity'
            ? qty * x.price
            : x.kind === 'perSqm'
              ? on
                ? area * x.price
                : 0
              : on
                ? x.price
                : 0
        return (
          <li
            key={x.id}
            className={`rounded-[16px] border p-4 transition sm:p-5 ${on ? 'border-orange/60 bg-orange/[0.07]' : 'border-line bg-ink'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-[1_1_240px]">
                <p className="text-[15px] font-semibold text-white">{x.label}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  <span className="font-semibold text-silver">{priceLabel}</span>
                  {x.kind === 'perSqm' ? (
                    <> · {t.extras.perSqmHint.replace('{area}', formatNumber(area, locale))}</>
                  ) : null}
                  {x.description ? <> · {x.description}</> : null}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {on && lineTotal > 0 ? (
                  <span className="hidden text-sm font-semibold text-orange sm:inline">
                    {formatHuf(lineTotal)}
                  </span>
                ) : null}
                {x.kind === 'quantity' ? (
                  <Stepper
                    value={qty}
                    max={x.maxQuantity}
                    label={x.label}
                    t={t}
                    onChange={(v) => setExtra(x.id, v)}
                  />
                ) : (
                  <YesNo
                    value={on}
                    t={t}
                    label={x.label}
                    onChange={(v) => setExtra(x.id, v ? 1 : 0)}
                  />
                )}
              </div>
            </div>
            {on && x.variants.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <span className="mr-1 text-xs text-muted">{t.extras.variant}:</span>
                {x.variants.map((v) => {
                  const chosen = (sel?.variant ?? x.variants[0]) === v
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => setExtra(x.id, qty, v)}
                      className={`min-h-9 rounded-full border px-3.5 text-xs font-semibold transition ${
                        chosen
                          ? 'border-orange bg-orange text-white'
                          : 'border-line text-silver hover:border-orange'
                      }`}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function Stepper({
  value,
  max,
  label,
  t,
  onChange,
}: {
  value: number
  max: number
  label: string
  t: OnboardingDict
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.max(0, Math.min(max, Math.floor(v || 0)))
  return (
    <div className="flex items-center rounded-xl border border-line bg-black">
      <button
        type="button"
        aria-label={`${t.booth.decrease}: ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 1))}
        className="grid size-11 place-items-center rounded-l-xl text-lg transition hover:bg-orange disabled:opacity-30 disabled:hover:bg-transparent"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        className="h-11 w-12 bg-transparent text-center text-[15px] font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`${t.booth.increase}: ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="grid size-11 place-items-center rounded-r-xl text-lg transition hover:bg-orange disabled:opacity-30 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  )
}

function YesNo({
  value,
  label,
  t,
  onChange,
}: {
  value: boolean
  label: string
  t: OnboardingDict
  onChange: (v: boolean) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-xl border border-line bg-black p-1"
    >
      {[false, true].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`min-h-9 min-w-14 rounded-lg px-3 text-[13px] font-semibold transition ${value === v ? (v ? 'bg-orange text-white' : 'bg-raised text-white') : 'text-muted hover:text-white'}`}
        >
          {v ? t.extras.yes : t.extras.no}
        </button>
      ))}
    </div>
  )
}

function SummaryStep({
  form,
  set,
  errors,
  quote,
  cfg,
  logos,
  content,
  locale,
  t,
  jumpTo,
}: {
  form: FormState
  set: SetFn
  errors: Errors
  quote: ReturnType<typeof computeQuote>
  cfg: PricingConfig
  logos: Record<string, { file: File; url: string }>
  content: OnboardingContent
  locale: 'hu' | 'en'
  t: OnboardingDict
  jumpTo: (k: StepKey) => void
}) {
  const brands = form.brands.filter((b) => b.name.trim())
  const tier = quote.tier
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryCard
          title={t.summary.exhibitor}
          edit={t.summary.edit}
          onEdit={() => jumpTo('company')}
        >
          <p className="font-semibold text-white">{form.companyName}</p>
          <p className="text-xs text-faint">
            {form.applicantType === 'company' ? t.summary.company : t.summary.individual}
          </p>
          {form.taxNumber ? <p>{form.taxNumber}</p> : null}
          {form.registrationNumber ? <p>{form.registrationNumber}</p> : null}
          <p className="whitespace-pre-line">{form.billingAddress}</p>
          {form.website ? <p className="break-all">{form.website}</p> : null}
        </SummaryCard>
        <SummaryCard
          title={t.summary.contact}
          edit={t.summary.edit}
          onEdit={() => jumpTo('contact')}
        >
          <p className="font-semibold text-white">{form.contactName}</p>
          <p>{form.phone}</p>
          <p className="break-all">{form.email}</p>
        </SummaryCard>
        <SummaryCard title={t.summary.brands} edit={t.summary.edit} onEdit={() => jumpTo('brands')}>
          <ul className="flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <li
                key={b.key}
                className="flex items-center gap-2 rounded-full border border-line bg-black py-1 pr-3 pl-1.5 text-[13px] text-white"
              >
                {logos[b.key] ? (
                  <img src={logos[b.key].url} alt="" className="h-5 w-8 rounded object-contain" />
                ) : (
                  <span className="size-1.5 rounded-full bg-orange" />
                )}
                {b.name}
              </li>
            ))}
          </ul>
        </SummaryCard>
        <SummaryCard title={t.summary.booth} edit={t.summary.edit} onEdit={() => jumpTo('booth')}>
          <p className="text-[22px] leading-tight font-semibold text-white">
            {formatNumber(form.width, locale)} × {formatNumber(form.depth, locale)} m{' '}
            <span className="text-orange">· {formatNumber(quote.area, locale)} m²</span>
          </p>
          {tier ? (
            <p>
              {tier.label} · {tier.badges} {t.booth.badges.toLowerCase()} · {tier.tickets}{' '}
              {t.booth.tickets.toLowerCase()} · {tier.parking} {t.booth.parking.toLowerCase()}
            </p>
          ) : null}
        </SummaryCard>
      </div>

      <section aria-labelledby="ob-costs">
        <h3 id="ob-costs" className="mb-3 text-lg font-semibold tracking-[-0.02em]">
          {t.summary.costs}
        </h3>
        <div className="overflow-hidden rounded-[14px] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink font-mono text-[10px] tracking-[0.08em] text-faint uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t.summary.item}</th>
                <th className="px-4 py-3 text-right font-medium">{t.summary.total}</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-4 py-3 text-silver">
                    <span className="text-white">{l.label}</span>
                    <span className="block text-xs text-muted">
                      {formatNumber(l.quantity, locale)} {l.unit} × {formatHuf(l.unitPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {formatHuf(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line">
                <td className="px-4 pt-4 pb-1 text-silver">{t.summary.net}</td>
                <td className="px-4 pt-4 pb-1 text-right font-semibold whitespace-nowrap">
                  {formatHuf(quote.net)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-1 text-silver">
                  {t.summary.vat} ({cfg.vatRate}%)
                </td>
                <td className="px-4 py-1 text-right whitespace-nowrap text-silver">
                  {formatHuf(quote.vat)}
                </td>
              </tr>
              <tr className="bg-orange/10">
                <td className="px-4 py-4 font-semibold text-white">{t.summary.gross}</td>
                <td className="px-4 py-4 text-right text-[20px] font-semibold whitespace-nowrap text-orange">
                  {formatHuf(quote.gross)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {content.totalNote ? (
          <p className="mt-3 text-xs leading-relaxed text-faint">{content.totalNote}</p>
        ) : null}
      </section>

      <Field id="ob-message" label={t.fields.message} t={t}>
        <textarea
          id="ob-message"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder={t.fields.messagePlaceholder}
          rows={3}
          maxLength={3000}
          className={`${inputCls} resize-y py-3.5`}
        />
      </Field>

      <div>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 transition ${errors.consent ? 'border-[#ff8a66]' : form.consent ? 'border-orange/60 bg-orange/[0.07]' : 'border-line'}`}
        >
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'ob-consent-err' : undefined}
            className="mt-0.5 size-5 flex-none accent-[#ff6a00]"
          />
          <span className="text-[13px] leading-relaxed text-silver">{content.consentText}</span>
        </label>
        {errors.consent ? (
          <p id="ob-consent-err" className="mt-1.5 text-xs text-[#ff8a66]">
            {errors.consent}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  edit,
  onEdit,
  children,
}: {
  title: string
  edit: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-line bg-ink p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.1em] text-faint uppercase">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-orange underline-offset-4 hover:underline"
        >
          {edit}
        </button>
      </div>
      <div className="flex flex-col gap-0.5 text-[13px] text-silver">{children}</div>
    </div>
  )
}

function Success({
  content,
  t,
  links,
}: {
  content: OnboardingContent
  t: OnboardingDict
  links: { exit: string; home: string }
}) {
  return (
    <div className="anim-rise flex flex-col items-start px-5 py-14 sm:px-10 sm:py-20">
      <span className="glow-orange grid size-16 place-items-center rounded-full bg-orange text-white">
        <svg
          className="size-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
      <h2
        role="status"
        className="mt-8 text-[clamp(32px,4vw,54px)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance"
      >
        {content.successHeading}
      </h2>
      {content.successText ? (
        <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed whitespace-pre-line text-silver">
          {content.successText}
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={links.exit}
          className="flex min-h-12 items-center rounded-full bg-orange px-6 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          {t.success.again}
        </a>
        <a
          href={links.home}
          className="flex min-h-12 items-center rounded-full border border-white/30 px-6 text-sm font-semibold transition hover:border-orange hover:bg-orange"
        >
          {t.success.home}
        </a>
      </div>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}
