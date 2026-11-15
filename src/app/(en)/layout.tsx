import type { Metadata } from 'next'
import React from 'react'

import { RootHtml } from '@/components/RootHtml'

export const metadata: Metadata = {
  title: "Budapest Guitar Show – Hungary's largest guitar event",
  description: "Hungary's largest guitar exhibition, in Budapest.",
  alternates: { languages: { hu: '/', en: '/en' } },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootHtml lang="en">{children}</RootHtml>
}
