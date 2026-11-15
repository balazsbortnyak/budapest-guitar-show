# Kiállítói foglalások a Google Táblázatban

Minden új kiállítói jelentkezés automatikusan bekerül a **„Bookings waiting”** lapra. Onnan egy kattintással
jóváhagyhatod őket, és ekkor átkerülnek az **„Official Bookings”** lapra.

```
Weboldal ──(új jelentkezés)──▶ Bookings waiting ──(☑ + „Jóváhagyás” gomb)──▶ Official Bookings
```

Az összekötést egy kis Apps Script végzi, ami a táblázathoz tartozik. Egyszer kell beállítani, kb. 10 perc.

---

## 1. Az Apps Script bemásolása

1. Nyisd meg a táblázatot → **Bővítmények → Apps Script**.
2. A megnyíló szerkesztőben töröld ki a `Code.gs` tartalmát, és másold be helyette a
   [`google-apps-script/bgs-foglalasok.gs`](../google-apps-script/bgs-foglalasok.gs) fájl teljes tartalmát.
3. Kattints a **Mentés** (💾) ikonra.

## 2. Titkos kulcs beállítása

Ez védi a táblázatot attól, hogy bárki más sorokat írjon bele.

1. Találj ki egy hosszú, véletlenszerű jelszót, vagy generálj egyet: `openssl rand -hex 32`.
2. Az Apps Script szerkesztőben: bal oldalt **⚙️ Projektbeállítások** → lent **Szkripttulajdonságok** →
   **Szkripttulajdonság hozzáadása**
   - Tulajdonság: `BGS_SECRET`
   - Érték: a kitalált jelszó
3. **Mentés**.

## 3. Közzététel webalkalmazásként

1. Jobb felül **Telepítés → Új telepítés**.
2. A típusnál (⚙️) válaszd a **Webalkalmazás** lehetőséget.
3. Beállítások:
   - Leírás: `BGS foglalások`
   - Végrehajtás mint: **Én** (a saját fiókod)
   - Hozzáférés: **Bárki**. Ez szükséges, hogy a weboldal elérje; a titkos kulcs nélkül senki nem tud írni bele.
4. **Telepítés** → engedélyezd a hozzáférést a Google fiókoddal. Ha a „Google nem ellenőrizte ezt az alkalmazást”
   figyelmeztetés jön: **Speciális → Ugrás ide: … (nem biztonságos)**. Ez a saját scripted, nyugodtan engedélyezheted.
5. Másold ki a **Webalkalmazás URL-jét** (`https://script.google.com/macros/s/…/exec`).

## 4. A weboldal beállítása

A weboldal környezeti változóiba (Vercel → Project → Settings → Environment Variables, illetve helyben a `.env` fájlba):

```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
GOOGLE_SHEETS_SECRET=ugyanaz-a-jelszó-mint-a-BGS_SECRET
```

Utána indítsd újra, illetve deployold újra az oldalt.

## 5. A „Jóváhagyás” gomb

Frissítsd a táblázatot. A menüsorban megjelenik a **BGS foglalások** menü:

- **✅ Bepipáltak jóváhagyása**: a „Bookings waiting” lapon a *Jóváhagyás* oszlopban bepipált sorokat
  áthelyezi az „Official Bookings” lapra, a jóváhagyás időpontjával.
- **✅ Összes várakozó jóváhagyása**: minden várakozó sort áthelyez, megerősítés után.

**Saját gomb a lapra** (opcionális): **Beszúrás → Rajz** → rajzolj egy gombot (pl. „Jóváhagyás”) → **Mentés és bezárás**
→ kattints a rajzra → a jobb felső **⋮** menüben **Szkript hozzárendelése** → írd be: `approveChecked`.

Az első futtatáskor a Google még egyszer engedélyt kér.

---

## Hasznos tudnivalók

- **Oszlopok:** az első beérkező jelentkezés automatikusan létrehozza a fejlécet mindkét lapon. A sorrendet
  szabadon átrendezheted, és saját oszlopokat is felvehetsz (pl. „Fizetve”, „Standszám”): a script az oszlopneveket
  nézi, nem a pozíciót. Az „Official Bookings” lapon a saját oszlopok üresek maradnak az átkerülő sorokban.
- **Oszlopnevek:** a meglévő oszlopokat ne nevezd át, mert akkor a script újakat hoz létre a régi néven.
- **Duplikáció:** ugyanaz a jelentkezés (azonosító alapján, pl. `BGS-2026-0001`) nem kerül be kétszer.
- **Ha valami nem jut be:** az admin felületen a jelentkezés jobb oldali „Automatikus feldolgozás” részében látod,
  mikor került a táblázatba, illetve ha hiba volt, mi volt az.
- **Ha módosítod a scriptet:** **Telepítés → Telepítések kezelése → ✏️ → Verzió: Új verzió → Telepítés**.
  Így az URL nem változik.

## Az e-mail értesítés beállítása

Minden jelentkezésről e-mail megy a `BOOKING_NOTIFY_EMAIL` címre (alapból info@budapestguitarshow.com), csatolva a
generált szerződéssel. Ehhez SMTP kell. Google Workspace esetén:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=info@budapestguitarshow.com
SMTP_PASS=<alkalmazásjelszó>   # Google fiók → Biztonság → Kétlépcsős azonosítás → Alkalmazásjelszavak
EMAIL_FROM=info@budapestguitarshow.com
```

Ha ezek nincsenek kitöltve, az oldal működik, de a levél csak a szerver naplójába íródik ki, nem megy el.
