/**
 * Budapest Guitar Show – kiállítói foglalások (Google Táblázat + Apps Script)
 *
 * Mit csinál?
 *  1. A weboldal minden új jelentkezést ide küld (doPost) → új sor a „Bookings waiting” lapon,
 *     az első oszlopban egy jelölőnégyzettel.
 *  2. A „BGS foglalások” menüből (vagy egy gombból) a bepipált sorok egy kattintással átkerülnek
 *     az „Official Bookings” lapra, a jóváhagyás időpontjával.
 *
 * Beállítás: lásd docs/google-sheets-foglalasok.md a weboldal forráskódjában.
 * A titkos kulcsot a Projektbeállítások → Szkripttulajdonságok alatt kell megadni BGS_SECRET néven.
 */

const WAITING_SHEET = 'Bookings waiting'
const OFFICIAL_SHEET = 'Official Bookings'
const APPROVE_HEADER = 'Jóváhagyás'
const APPROVED_AT_HEADER = 'Jóváhagyva'
const REFERENCE_HEADER = 'Azonosító'

/* ------------------------------------------------------------------ */
/* Menü                                                                 */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BGS foglalások')
    .addItem('✅ Bepipáltak jóváhagyása', 'approveChecked')
    .addItem('✅ Összes várakozó jóváhagyása', 'approveAll')
    .addToUi()
}

/* ------------------------------------------------------------------ */
/* Webhook: új jelentkezés a weboldalról                                */
/* ------------------------------------------------------------------ */

function doPost(e) {
  const secret = PropertiesService.getScriptProperties().getProperty('BGS_SECRET')
  let body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return json_({ ok: false, error: 'Hibás JSON' })
  }
  if (!secret || body.secret !== secret) return json_({ ok: false, error: 'Jogosulatlan (rossz BGS_SECRET)' })
  if (!Array.isArray(body.columns)) return json_({ ok: false, error: 'Hiányzó oszlopok' })

  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const sheet = getSheet_(WAITING_SHEET)
    const names = body.columns.map(function (c) { return String(c[0]) })
    const headers = ensureHeaders_(sheet, [APPROVE_HEADER].concat(names))

    // Ugyanaz a jelentkezés ne kerüljön be kétszer (pl. újrapróbálkozásnál).
    if (body.reference && (hasReference_(sheet, headers, body.reference) || hasReference_(getSheet_(OFFICIAL_SHEET), null, body.reference))) {
      return json_({ ok: true, duplicate: true })
    }

    const values = {}
    body.columns.forEach(function (c) { values[c[0]] = c[1] })
    const row = headers.map(function (h) {
      if (h === APPROVE_HEADER) return false
      return h in values ? safe_(values[h]) : ''
    })
    sheet.appendRow(row)
    sheet.getRange(sheet.getLastRow(), headers.indexOf(APPROVE_HEADER) + 1).insertCheckboxes()
    return json_({ ok: true })
  } finally {
    lock.releaseLock()
  }
}

/* ------------------------------------------------------------------ */
/* Jóváhagyás                                                           */
/* ------------------------------------------------------------------ */

/** A „Jóváhagyás” oszlopban bepipált sorok áthelyezése az Official Bookings lapra. */
function approveChecked() {
  moveRows_(function (row, approveIdx) { return row[approveIdx] === true })
}

/** Minden várakozó sor áthelyezése (megerősítés után). */
function approveAll() {
  const ui = SpreadsheetApp.getUi()
  const answer = ui.alert('Összes jóváhagyása', 'Biztosan jóváhagyod az ÖSSZES várakozó foglalást?', ui.ButtonSet.YES_NO)
  if (answer !== ui.Button.YES) return
  moveRows_(function () { return true })
}

function moveRows_(shouldMove) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const waiting = getSheet_(WAITING_SHEET)
    const official = getSheet_(OFFICIAL_SHEET)
    const data = waiting.getDataRange().getValues()
    if (data.length < 2) return toast_('Nincs várakozó foglalás.')

    const headers = data[0].map(String)
    const approveIdx = headers.indexOf(APPROVE_HEADER)
    const moveHeaders = headers.filter(function (h) { return h && h !== APPROVE_HEADER })
    const officialHeaders = ensureHeaders_(official, moveHeaders.concat([APPROVED_AT_HEADER]))

    const out = []
    const rowsToDelete = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (row.every(function (v) { return v === '' || v === false })) continue
      if (!shouldMove(row, approveIdx)) continue
      const record = {}
      headers.forEach(function (h, j) { record[h] = row[j] })
      record[APPROVED_AT_HEADER] = new Date()
      out.push(officialHeaders.map(function (h) { return h in record ? safe_(record[h]) : '' }))
      rowsToDelete.push(i + 1)
    }

    if (!out.length) return toast_('Nincs bepipált foglalás. Pipáld be a „' + APPROVE_HEADER + '” oszlopban, amit jóvá szeretnél hagyni.')

    official.getRange(official.getLastRow() + 1, 1, out.length, officialHeaders.length).setValues(out)
    rowsToDelete.reverse().forEach(function (r) { waiting.deleteRow(r) })
    toast_(out.length + ' foglalás átkerült az „' + OFFICIAL_SHEET + '” lapra.')
  } finally {
    lock.releaseLock()
  }
}

/* ------------------------------------------------------------------ */
/* Segédfüggvények                                                      */
/* ------------------------------------------------------------------ */

/** Lap keresése név alapján (kis-/nagybetűtől függetlenül); ha nincs, létrehozza. */
function getSheet_(name) {
  const ss = SpreadsheetApp.getActive()
  const found = ss.getSheets().filter(function (s) { return s.getName().trim().toLowerCase() === name.toLowerCase() })[0]
  return found || ss.insertSheet(name)
}

/** Fejléc biztosítása: üres lapon létrehozza, meglévőnél a hiányzó oszlopokat a végére teszi. */
function ensureHeaders_(sheet, wanted) {
  const lastCol = sheet.getLastColumn()
  let headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : []
  if (headers.every(function (h) { return h === '' })) headers = []
  const missing = wanted.filter(function (h) { return headers.indexOf(h) === -1 })
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing])
    headers = headers.concat(missing)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff')
    sheet.setFrozenRows(1)
  }
  return headers
}

function hasReference_(sheet, headers, reference) {
  if (sheet.getLastRow() < 2) return false
  const hs = headers || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
  const col = hs.indexOf(REFERENCE_HEADER)
  if (col === -1) return false
  const refs = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues()
  return refs.some(function (r) { return r[0] === reference })
}

/** Szövegek, amelyek =, +, - vagy @ jellel kezdődnek, ne képletként kerüljenek be (pl. +36 telefonszám). */
function safe_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v
  return v
}

function toast_(msg) {
  SpreadsheetApp.getActive().toast(msg, 'BGS foglalások', 6)
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
