/**
 * A kiállítói szerződés .docx SABLONJAINAK előállítása (HU + EN).
 * Futtatás: npx tsx src/contracts/build-templates.ts
 *
 * A kész sablonok (kiallitoi-szerzodes.hu.docx / .en.docx) Wordben is szabadon szerkeszthetők:
 * a {kapcsos} helyőrzőket a rendszer tölti ki a jelentkezés adataival (docxtemplater).
 * Elérhető helyőrzők: lásd src/lib/booking/contract.ts → contractData().
 * Ha a sablont kézzel szerkeszted Wordben, EZT a scriptet már ne futtasd újra, mert felülírja.
 */
import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

type Run = string | { t: string; b?: boolean; i?: boolean; color?: string }
type POpts = { align?: 'center' | 'right'; size?: number; bold?: boolean; after?: number; before?: number; keepNext?: boolean }

function run(r: Run, o: POpts = {}) {
  const x = typeof r === 'string' ? { t: r } : r
  const props = [
    x.b || o.bold ? '<w:b/>' : '',
    x.i ? '<w:i/>' : '',
    x.color ? `<w:color w:val="${x.color}"/>` : '',
    o.size ? `<w:sz w:val="${o.size * 2}"/><w:szCs w:val="${o.size * 2}"/>` : '',
  ].join('')
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(x.t)}</w:t></w:r>`
}

function p(runs: Run | Run[], o: POpts = {}) {
  const list = Array.isArray(runs) ? runs : [runs]
  const pPr = [
    o.keepNext ? '<w:keepNext/>' : '',
    `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 120}"/>`,
    o.align ? `<w:jc w:val="${o.align}"/>` : '',
  ].join('')
  return `<w:p><w:pPr>${pPr}</w:pPr>${list.map((r) => run(r, o)).join('')}</w:p>`
}

const h = (t: string) => p(t, { bold: true, size: 12, before: 280, after: 120, keepNext: true })

function cell(text: string, o: { w: number; bold?: boolean; align?: 'right'; shade?: boolean }) {
  return `<w:tc><w:tcPr><w:tcW w:w="${o.w}" w:type="dxa"/>${o.shade ? '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' : ''}</w:tcPr>${p(text, { bold: o.bold, align: o.align, after: 40 })}</w:tc>`
}

function table(head: string[], rows: string[][], widths: number[], rightCols: number[]) {
  const border = '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/>'
  const tr = (cells: string[], bold = false, shade = false) =>
    `<w:tr>${cells.map((c, i) => cell(c, { w: widths[i], bold, shade, align: rightCols.includes(i) ? 'right' : undefined })).join('')}</w:tr>`
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${border}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths
    .map((w) => `<w:gridCol w:w="${w}"/>`)
    .join('')}</w:tblGrid>${tr(head, true, true)}${rows.map((r, i) => tr(r, i === rows.length - 1 && r[0].startsWith('{#') === false)).join('')}</w:tbl>`
}

const T = {
  hu: {
    title: 'KIÁLLÍTÓI SZERZŐDÉS',
    number: 'Szerződésszám: ',
    intro: 'amely létrejött egyrészről',
    organizer: 'Szervező: ',
    organizerData: '[Szervező cég neve, székhelye, adószáma, cégjegyzékszáma, képviselője – KITÖLTENDŐ]',
    organizerSuffix: '(a továbbiakban: Szervező),',
    other: 'másrészről',
    exhibitor: 'Kiállító: ',
    labels: ['Számlázási cím: ', 'Adószám: ', 'Cégjegyzékszám: ', 'Weboldal: ', 'Kapcsolattartó: '],
    exhibitorSuffix: '(a továbbiakban: Kiállító) között az alábbi feltételekkel.',
    s1: '1. A szerződés tárgya',
    s1t: 'A Szervező a {eventName} rendezvényen ({dateLabel}, {venue}) kiállítói területet és az alább felsorolt szolgáltatásokat biztosítja a Kiállító részére.',
    s2: '2. Bérelt kiállítói terület',
    s2t: 'A stand mérete: {width} × {depth} m, azaz {area} m² ({tier}).',
    s2inc: 'A standdíj tartalmazza: {badges} db kiállítói badge, {tickets} db belépő, {parking} db parkolóhely.',
    perk: '• {.}',
    s3: '3. Képviselt márkák',
    s4: '4. Megrendelt szolgáltatások és díjak',
    head: ['Tétel', 'Mennyiség', 'Egységár (nettó)', 'Összesen (nettó)'],
    net: 'Nettó összesen',
    vat: 'ÁFA ({vatRate}%)',
    gross: 'Bruttó végösszeg',
    s5: '5. Fizetési feltételek',
    s5t: '[Előleg, fizetési határidő, számlázás módja – KITÖLTENDŐ]',
    s6: '6. Egyéb feltételek',
    s6t: '[Lemondás, felelősség, építés és bontás, házirend – KITÖLTENDŐ]',
    note: 'A Kiállító megjegyzése: ',
    place: 'Kelt: Budapest, {date}',
    sign: ['Szervező', 'Kiállító'],
  },
  en: {
    title: 'EXHIBITOR AGREEMENT',
    number: 'Agreement no.: ',
    intro: 'concluded between',
    organizer: 'Organiser: ',
    organizerData: '[Organiser company name, registered office, tax number, registration number, representative – TO BE COMPLETED]',
    organizerSuffix: '(hereinafter: Organiser),',
    other: 'and',
    exhibitor: 'Exhibitor: ',
    labels: ['Billing address: ', 'Tax / VAT number: ', 'Company registration no.: ', 'Website: ', 'Contact: '],
    exhibitorSuffix: '(hereinafter: Exhibitor) under the following terms.',
    s1: '1. Subject of the agreement',
    s1t: 'The Organiser provides exhibition space and the services listed below to the Exhibitor at {eventName} ({dateLabel}, {venue}).',
    s2: '2. Rented exhibition space',
    s2t: 'Booth size: {width} × {depth} m, i.e. {area} m² ({tier}).',
    s2inc: 'The booth fee includes: {badges} exhibitor badge(s), {tickets} ticket(s), {parking} parking space(s).',
    perk: '• {.}',
    s3: '3. Brands represented',
    s4: '4. Ordered services and fees',
    head: ['Item', 'Quantity', 'Unit price (net)', 'Total (net)'],
    net: 'Net total',
    vat: 'VAT ({vatRate}%)',
    gross: 'Gross total',
    s5: '5. Payment terms',
    s5t: '[Deposit, payment deadline, invoicing – TO BE COMPLETED]',
    s6: '6. Other terms',
    s6t: '[Cancellation, liability, build-up and dismantling, house rules – TO BE COMPLETED]',
    note: "Exhibitor's note: ",
    place: 'Budapest, {date}',
    sign: ['Organiser', 'Exhibitor'],
  },
}

function document(t: (typeof T)['hu']) {
  const body = [
    p(t.title, { bold: true, size: 18, align: 'center', after: 60 }),
    p([t.number, { t: '{reference}', b: true }], { align: 'center', after: 360 }),
    p(t.intro),
    p([{ t: t.organizer, b: true }, t.organizerData]),
    p(t.organizerSuffix, { after: 200 }),
    p(t.other),
    p([{ t: t.exhibitor, b: true }, { t: '{companyName}', b: true }]),
    p([t.labels[0], '{billingAddress}'], { after: 40 }),
    p('{#taxNumber}', { after: 0 }),
    p([t.labels[1], '{taxNumber}'], { after: 40 }),
    p('{/taxNumber}', { after: 0 }),
    p('{#registrationNumber}', { after: 0 }),
    p([t.labels[2], '{registrationNumber}'], { after: 40 }),
    p('{/registrationNumber}', { after: 0 }),
    p('{#website}', { after: 0 }),
    p([t.labels[3], '{website}'], { after: 40 }),
    p('{/website}', { after: 0 }),
    p([t.labels[4], '{contactName}, {phone}, {email}'], { after: 120 }),
    p(t.exhibitorSuffix, { after: 200 }),

    h(t.s1),
    p(t.s1t),

    h(t.s2),
    p(t.s2t),
    p(t.s2inc),
    p('{#perks}', { after: 0 }),
    p(t.perk, { after: 40 }),
    p('{/perks}', { after: 0 }),

    h(t.s3),
    p('{#brands}', { after: 0 }),
    p('• {name}', { after: 40 }),
    p('{/brands}', { after: 0 }),

    h(t.s4),
    table(
      t.head,
      [
        ['{#lines}{label}', '{quantity}', '{unitPrice}', '{total}{/lines}'],
        [t.net, '', '', '{net}'],
        [t.vat, '', '', '{vat}'],
        [t.gross, '', '', '{gross}'],
      ],
      [4300, 1500, 1700, 1800],
      [1, 2, 3],
    ),

    h(t.s5),
    p(t.s5t),
    h(t.s6),
    p(t.s6t),

    p('{#message}', { after: 0 }),
    p([{ t: t.note, b: true }, '{message}'], { before: 200 }),
    p('{/message}', { after: 0 }),

    p(t.place, { before: 480, after: 720 }),
    `<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4650"/><w:gridCol w:w="4650"/></w:tblGrid><w:tr>${t.sign
      .map(
        (s) =>
          `<w:tc><w:tcPr><w:tcW w:w="4650" w:type="dxa"/></w:tcPr>${p('………………………………………', { align: 'center', after: 40 })}${p(s, { align: 'center', bold: true })}</w:tc>`,
      )
      .join('')}</w:tr></w:tbl>`,
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1300" w:bottom="1300" w:left="1300" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`
}

const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="hu-HU"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`

for (const lang of ['hu', 'en'] as const) {
  const zip = new PizZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
  )
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  )
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  )
  zip.file('word/styles.xml', styles)
  zip.file('word/document.xml', document(T[lang]))
  const out = path.join(dirname, `kiallitoi-szerzodes.${lang}.docx`)
  fs.writeFileSync(out, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
  console.log('kész:', out)
}
