# Budapest Guitar Show – weboldal

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + **Payload CMS 3** admin felület.
A weboldal és az admin egy projekt: az admin a `/admin` címen érhető el.

## Gyors indítás (saját gépen)

Kell hozzá: **Node.js 22 vagy újabb** (`node -v`).

```bash
npm install
cp .env.example .env
# A .env-ben a PAYLOAD_SECRET mögé írj egy hosszú véletlen kulcsot:
openssl rand -hex 32
npm run seed      # kezdő tartalom a mostani oldalról (márkák, GYIK, videók, programok)
npm run dev
```

- Weboldal: http://localhost:3000 (angolul: http://localhost:3000/en)
- Admin: http://localhost:3000/admin – első belépéskor itt hozod létre az admin fiókot.

## Mit lehet szerkeszteni az adminban?

| Menü | Tartalom |
| --- | --- |
| **Esemény és főoldal** | dátum, helyszín, jegyállapot (hamarosan / kapható / elfogyott), jegylink, hero cím és kép, szekciók szövegei és képei, kapcsolat, közösségi linkek |
| **Programok** | a „Két nap, ami felhangol” kártyák (cím, leírás, kép, sorrend) |
| **Fellépők** | név, zenekar, nap, portré – a szekció csak akkor jelenik meg, ha van fellépő |
| **Videók** | YouTube-azonosító, cím, opcionális saját előnézeti kép |
| **Kiállítók és márkák** | név, logó, weboldal |
| **GYIK** | kérdés–válasz párok |
| **Képek** | feltöltött fotók (fókuszpont állítható, a méretezett változatok automatikusan készülnek) |
| **Hírlevél-feliratkozók** | akik az oldalon feliratkoztak (automatikusan a Sender.net-be is átkerülnek) – csak admin láthatja |
| **Felhasználók** | admin / szerkesztő fiókok |

Minden szöveg **magyarul és angolul** is megadható (a szerkesztő jobb felső sarkában lehet nyelvet váltani).
Ha egy angol mező üres, a magyar szöveg jelenik meg.

Ha a jegyállapotot „Jegyek kaphatók”-ra állítod és megadod a jegylinket, az oldal összes jegygombja
automatikusan a jegyvásárlásra visz, a feliratkozó űrlap helyett pedig vásárlás gomb jelenik meg.

## Biztonság – mi van beállítva

- Nincs nyilvános regisztráció: új felhasználót csak admin hozhat létre (az első fiókot a `/admin` oldalon, amíg nincs egy sem).
- Két szerepkör: **admin** (mindenhez hozzáfér) és **szerkesztő** (csak tartalom, a feliratkozókat és más felhasználókat nem látja).
- Brute-force védelem: 5 hibás belépés után 15 percre zárol a fiók.
- A feliratkozók listája kívülről (API-n) nem olvasható és nem írható; új feliratkozót csak a weboldal
  szerveroldali űrlapja hozhat létre (e-mail ellenőrzéssel, bot-csapdával, és nem árulja el, ha egy cím már fel van iratkozva).
- CORS / CSRF csak a saját domainre, GraphQL kikapcsolva.
- Biztonsági HTTP fejlécek (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- A betűtípusok saját szerverről töltődnek (nem a Google-tól) – GDPR-barát.
- Élesben a `PAYLOAD_SECRET` nélkül (vagy 32 karakternél rövidebbel) el sem indul az oldal.

Javasolt még élesítés előtt: erős admin jelszó, e-mail küldő beállítása (jelszó-visszaállításhoz),
adatvédelmi tájékoztató és impresszum oldal.

## Élesítés (Vercel + Supabase + Vercel Blob)

Lépésről lépésre: **[docs/elesites-vercel-supabase.md](docs/elesites-vercel-supabase.md)**. Ugyanitt van a
Sender.net hírlevél beállítása. A kiállítói foglalási táblázat leírása: [docs/google-sheets-foglalasok.md](docs/google-sheets-foglalasok.md).

## Hasznos parancsok

```bash
npm run dev               # fejlesztői szerver
npm run build && npm start
npm run seed              # kezdő tartalom (csak üres gyűjteményeket tölt fel)
npm run generate:types    # TypeScript típusok újragenerálása a gyűjtemények módosítása után
npm run generate:importmap
npm run migrate:create -- nev   # Postgres migráció a gyűjtemények módosítása után (élesítéshez kell)
npm run transfer:postgres # helyi tartalom átmásolása Supabase-be + képek a Vercel Blobra
npm run sender:groups     # Sender.net csoportok és azonosítóik
npm run sender:sync       # még át nem küldött feliratkozók átküldése a Sendernek
```

## Felépítés

```
src/
  app/(hu)/          magyar főoldal  → /
  app/(en)/en/       angol főoldal   → /en
  app/(payload)/     admin + REST API (Payload)
  app/actions/       szerveroldali űrlapkezelés (jegyértesítő)
  collections/       admin gyűjtemények (Programok, Videók, Kiállítók, GYIK, Feliratkozók, Képek, Felhasználók)
  globals/           „Esemény és főoldal” beállítások
  components/        a landing oldal komponensei (Tailwind)
  lib/               adatlekérés, fordítások
  seed/              kezdő tartalom
```
