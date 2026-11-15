import type { Metadata } from 'next'
import React from 'react'

import { RootHtml } from '@/components/RootHtml'

export const metadata: Metadata = {
  title: 'Budapest Guitar Show – Magyarország legnagyobb gitáros eseménye',
  description: 'Magyarország legnagyobb gitárkiállítása, Budapesten.',
  alternates: { languages: { hu: '/', en: '/en' } },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootHtml lang="hu">{children}</RootHtml>
}
