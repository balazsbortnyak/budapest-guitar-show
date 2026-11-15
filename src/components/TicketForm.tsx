'use client'

import React, { useActionState } from 'react'

import { subscribe, type SubscribeState } from '@/app/actions/subscribe'
import type { Dictionary, Locale } from '@/lib/i18n'

export function TicketForm({ locale, t }: { locale: Locale; t: Dictionary['tickets'] }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: 'idle' })

  if (state.status === 'success') {
    return (
      <p role="status" className="max-w-[420px] rounded-2xl border border-line bg-ink px-5 py-4 text-[15px] text-silver">
        {t.success}
      </p>
    )
  }

  return (
    <form action={action} className="flex w-full max-w-[440px] flex-col gap-2" noValidate>
      <label htmlFor="ticket-email" className="text-xs font-medium text-silver">
        {t.emailLabel}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="ticket-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder={t.emailPlaceholder}
          aria-invalid={state.status === 'invalid'}
          aria-describedby="ticket-email-msg"
          className="min-h-12 min-w-0 flex-[1_1_200px] rounded-full border border-[#2e2e35] bg-ink px-[18px] text-[15px] text-white placeholder:text-faint focus:border-white/40 focus:outline-none"
        />
        <input type="hidden" name="locale" value={locale} />
        {/* honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full bg-accent-strong px-[22px] text-sm font-semibold text-white transition hover:bg-orange disabled:opacity-60"
        >
          {pending ? t.sending : t.submit}
        </button>
      </div>
      <p id="ticket-email-msg" className="text-xs text-faint" aria-live="polite">
        {state.status === 'invalid' ? (
          <span className="text-[#ff8a66]">{t.invalid}</span>
        ) : state.status === 'error' ? (
          <span className="text-[#ff8a66]">{t.error}</span>
        ) : (
          t.privacy
        )}
      </p>
    </form>
  )
}
