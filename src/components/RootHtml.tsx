import React from 'react'

// Saját szerverről kiszolgált betűtípusok (nem a Google-tól töltődnek → GDPR-barát).
import '@fontsource-variable/inter/opsz.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-ext-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-ext-500.css'
import '../app/globals.css'

export function RootHtml({ lang, children }: { lang: 'hu' | 'en'; children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: a lenti inline script még a hidratálás előtt hozzáadja
    // a `js` osztályt a <html>-hez, ezért ennek az egy elemnek az attribútumai szándékosan
    // eltérnek a szerver által rendereltől. (Csak erre az elemre vonatkozik, a gyerekeire nem.)
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Jelzi a CSS-nek, hogy fut JS → a görgetéses animációk elrejthetik az elemeket. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
