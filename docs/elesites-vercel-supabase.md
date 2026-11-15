# Élesítés: Vercel + Supabase + Vercel Blob

```
Vercel (Next.js + Payload admin)  ──▶  Supabase Postgres (adatok)
            │
            └──▶  Vercel Blob (képek, logók, szerződések)
```

Helyben továbbra is a `bgs.db` SQLite fájllal fejlesztesz. Az éles oldal Supabase Postgrest használ.
Az adatbázis szerkezetét élesben **migrációk** hozzák létre és frissítik (`src/migrations`). Ezek minden éles deploykor
automatikusan lefutnak.

---

## 1. Supabase projekt

1. [supabase.com](https://supabase.com) → **New project**
   - **Region: Central EU (Frankfurt)**. Ez legyen ugyanaz, ahol a Vercel fut (`fra1`, be van állítva a `vercel.json`-ban).
   - Adatbázis-jelszó: generáltass erőset, és mentsd el.
   - **„Enable Data API” legyen kikapcsolva.** A Payload közvetlenül csatlakozik, a Supabase REST API-jára nincs
     szükség. Ha bekapcsolva marad, a táblák (feliratkozók, jelentkezések) elérhetők lehetnek a Supabase nyilvános API-ján
     keresztül. Ha a projekt már létezik: **Project Settings → Data API** → kapcsold ki.
     Plusz védelem (a BGS adatbázisban már megtörtént): a migráció után futtasd az SQL Editorban:
     ```sql
     revoke all on all tables in schema public from anon, authenticated;
     revoke all on all sequences in schema public from anon, authenticated;
     alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
     alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
     ```
2. A projektben fent kattints a **Connect** gombra. Két címre lesz szükséged:
   - **Transaction pooler** (port **6543**): ez a Vercel `DATABASE_URL` értéke.
   - **Session pooler** (port **5432**): ezzel futtatod a saját gépedről az átköltöztetést.

   A `[YOUR-PASSWORD]` helyére írd be a jelszót. Ha a jelszóban speciális karakter van (`@`, `#`, `/`, `%`…),
   azt URL-kódolva kell beírni, vagy válassz csak betűket és számokat tartalmazó jelszót.

> **Csomag:** az ingyenes Supabase-projekt 1 hét tétlenség után szünetel, és nincs benne letölthető napi mentés.
> Egy élő oldalnál, ahol jelentkezések és foglalások vannak, a **Pro** csomag ($25/hó) ajánlott, napi mentésekkel.

## 2. Az adatbázis feltöltése a mostani helyi tartalommal

A saját gépeden, a projekt mappájában. A `SESSION_URL` a Session pooler címe az 1. pontból.

```bash
# 1) a táblák létrehozása a Supabase-ben
DATABASE_URL="SESSION_URL" npm run migrate

# 2) a helyi tartalom (kiállítók, beállítások, képek adatai, jelentkezések, admin fiók…) átmásolása,
#    a képek feltöltése a Vercel Blobra (a token a 3. pontban lesz meg, előbb hozd létre a Blob tárhelyet)
TARGET_DATABASE_URL="SESSION_URL" BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…" npm run transfer:postgres
```

- Az azonosítók, a magyar és angol szövegek, a kapcsolatok és az admin belépésed is átkerül.
- Ha a cél adatbázisban már van adat, a script leáll. Felülíráshoz add hozzá a `-- --force` kapcsolót.
- Ha inkább üres oldallal indulnál, a 2. lépés helyett: `DATABASE_URL="SESSION_URL" npm run seed && npm run seed:exhibitors && npm run seed:onboarding`.

## 3. Vercel projekt

1. Töltsd fel a projektet egy **GitHub** repóba (a `.env`, a `bgs.db` és a `media` mappa nem kerül fel, ez így van rendben).
2. [vercel.com](https://vercel.com) → **Add New → Project** → válaszd ki a repót. A beállításokat nem kell módosítani:
   a `vercel.json` megadja a build parancsot (migráció + build) és a frankfurti régiót.
3. **Storage → Create → Blob** → kösd a projekthez. Ez automatikusan beállítja a `BLOB_READ_WRITE_TOKEN` értékét. A token a
   Blob tárhely beállításainál is látszik, a 2. ponthoz innen tudod kimásolni.
4. **Settings → Environment Variables**, a *Production* környezetnél:

| Változó | Érték |
| --- | --- |
| `DATABASE_URL` | Supabase **Transaction pooler** URL (`…pooler.supabase.com:6543/postgres`) |
| `PAYLOAD_SECRET` | hosszú véletlen kulcs: `openssl rand -hex 32` (ne a helyi legyen) |
| `NEXT_PUBLIC_SERVER_URL` | `https://budapestguitarshow.com` (a végleges domain) |
| `BLOB_READ_WRITE_TOKEN` | automatikusan beállítja a Blob (3. lépés) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | e-mail küldés (lásd `google-sheets-foglalasok.md` alja) |
| `BOOKING_NOTIFY_EMAIL` | `info@budapestguitarshow.com` |
| `GOOGLE_SHEETS_WEBHOOK_URL`, `GOOGLE_SHEETS_SECRET` | foglalási táblázat |
| `SENDER_API_TOKEN`, `SENDER_GROUP_HU`, `SENDER_GROUP_EN` | hírlevél (lásd lent) |

5. **Deploy.** Az első deploy lefuttatja a migrációkat. Ezek a 2. pont után már megvannak, így nem csinálnak semmit.
6. **Settings → Domains**: add hozzá a `budapestguitarshow.com` domaint, és állítsd át a DNS-t a Vercel által kért értékekre.

> **Vercel csomag:** a Hobby (ingyenes) csomag csak nem kereskedelmi célra használható. Egy rendezvény jegy- és
> kiállítói oldalához a **Pro** csomag ($20/hó) kell.

### Preview deployok

Az éles builden kívül (pl. egy másik ág preview-jánál) a migráció nem fut le, nehogy egy félkész változtatás módosítsa
az éles adatbázist. Ha preview-t is akarsz, adj a *Preview* környezetnek külön Supabase projektet (`DATABASE_URL`).

## 4. Később: ha módosul a gyűjtemények szerkezete

Minden olyan változtatás után, ami új mezőt vagy gyűjteményt ad hozzá, létre kell hozni egy migrációt, és együtt kell
feltölteni a kóddal:

```bash
npm run migrate:create -- rovid-leiras   # pl. uj-hirlevel-mezok
```

Ez nem igényel adatbázis-kapcsolatot. A deploy a migrációt automatikusan lefuttatja. Állapot ellenőrzése:
`DATABASE_URL="SESSION_URL" npm run migrate:status`.

Ha a Vercel build a migrációnál a Transaction poolerrel elakadna, add meg a Session pooler címét
`DATABASE_MIGRATE_URL` néven is. A migráció ekkor azt használja.

---

## Sender.net hírlevél

Az oldal feliratkozó űrlapja (jegyértesítő / hírlevél) minden új címet:

1. elment a Payload adminba (**Feliratkozók → Hírlevél-feliratkozók**), biztonsági másolatként, és
2. a háttérben átküld a **Sender.net**-be, a nyelvnek megfelelő csoportba.

Az adminban a feliratkozónál látod, mikor került át („Sender.net-be küldve”), illetve ha hiba volt, mi volt az.
Ha a Sender épp nem volt elérhető, a cím újbóli feliratkozásakor a rendszer automatikusan újrapróbálja.
Az `npm run sender:sync` paranccsal kézzel is újraküldheted.

### Beállítás

1. **Sender → Subscribers → Groups → Create group**: pl. `BGS – Magyar` és `BGS – English`.
   Ha nem kell külön angol lista, elég egy csoport.
2. **Sender → Settings → API access tokens → Create API token**. Másold ki.
3. Írd be a `.env` fájlba: `SENDER_API_TOKEN=…`, majd futtasd:
   ```bash
   npm run sender:groups
   ```
   Ez kilistázza a csoportokat az azonosítójukkal (pl. `eZVD4w   BGS – Magyar`).
4. Állítsd be a csoport-azonosítókat a `.env`-ben és a Vercelen:
   ```
   SENDER_API_TOKEN=…
   SENDER_GROUP_HU=eZVD4w
   SENDER_GROUP_EN=b2vAR1   # ha üres, az angol feliratkozók is a magyar csoportba kerülnek
   ```
5. A már összegyűlt feliratkozók átküldése: `npm run sender:sync`. Élesben a Session pooler URL-lel:
   `DATABASE_URL="SESSION_URL" npm run sender:sync`.

**Üdvözlő e-mail:** a Senderben **Automation → Create** → indító esemény: *„Subscriber joins a group”*
→ válaszd ki a csoportot. Az oldal úgy küldi át a feliratkozókat, hogy az automatizmusok elinduljanak.
