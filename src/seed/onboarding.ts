/**
 * A kiállítói jelentkezés kezdő tartalma (szövegek, standdíjak, szolgáltatások) mindkét nyelven.
 * Futtatás: npm run seed:onboarding
 * Csak akkor tölt fel, ha még nincs kitöltve (nem írja felül a Payloadban már szerkesztett tartalmat).
 * Kényszerített újratöltés: npm run seed:onboarding -- --force
 *
 * FIGYELEM: a standdíjak (m²-árak, badge/belépő/parkoló darabszámok) HELYKITÖLTŐK – a Payloadban állítsd be a valósakat.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const tiers = [
  {
    minArea: 4,
    maxArea: 12,
    pricePerSqm: 24000,
    badges: 2,
    tickets: 2,
    parking: 1,
    hu: { label: 'Kis stand', perks: 'Áramcsatlakozás\nMegjelenés a kiállítói listában' },
    en: { label: 'Small booth', perks: 'Power connection\nListing on the exhibitors page' },
  },
  {
    minArea: 12,
    maxArea: 36,
    pricePerSqm: 21000,
    badges: 4,
    tickets: 4,
    parking: 2,
    hu: { label: 'Közepes stand', perks: 'Áramcsatlakozás\nMegjelenés a kiállítói listában\nLogó a főoldalon' },
    en: { label: 'Medium booth', perks: 'Power connection\nListing on the exhibitors page\nLogo on the home page' },
  },
  {
    minArea: 36,
    maxArea: null,
    pricePerSqm: 18000,
    badges: 8,
    tickets: 8,
    parking: 3,
    hu: { label: 'Nagy stand', perks: 'Áramcsatlakozás\nLogó a főoldalon\nKiemelt hely a csarnokban\nSocial media bemutatkozás' },
    en: { label: 'Large booth', perks: 'Power connection\nLogo on the home page\nPrime location in the hall\nSocial media feature' },
  },
]

const extras = [
  { price: 5000, kind: 'quantity', maxQuantity: 30, hu: { label: 'Asztal', unit: 'db' }, en: { label: 'Table', unit: 'pcs' } },
  {
    price: 12000,
    kind: 'quantity',
    maxQuantity: 30,
    hu: { label: 'Asztal elasztikus huzattal', unit: 'db', variants: 'Fekete, Fehér' },
    en: { label: 'Table with stretch cover', unit: 'pcs', variants: 'Black, White' },
  },
  { price: 1500, kind: 'quantity', maxQuantity: 60, hu: { label: 'Konferenciaszék', unit: 'db' }, en: { label: 'Conference chair', unit: 'pcs' } },
  {
    price: 3000,
    kind: 'quantity',
    maxQuantity: 60,
    hu: { label: 'Konferenciaszék elasztikus huzattal', unit: 'db', variants: 'Fekete, Fehér' },
    en: { label: 'Conference chair with stretch cover', unit: 'pcs', variants: 'Black, White' },
  },
  { price: 5000, kind: 'perSqm', hu: { label: 'Padlószőnyegezés' }, en: { label: 'Carpeting' } },
  { price: 5000, kind: 'quantity', maxQuantity: 20, hu: { label: 'Extra 2 napos belépő', unit: 'fő' }, en: { label: 'Extra 2-day pass', unit: 'people' } },
  {
    price: 0,
    kind: 'toggle',
    hu: { label: 'Erősítőt szeretnék elhelyezni a hangos szobában', description: 'Hangos demózáshoz kialakított külön terem' },
    en: { label: "I'd like to place an amp in the loud room", description: 'A separate room for loud demos' },
  },
  {
    price: 45000,
    kind: 'toggle',
    hu: { label: 'Demo slot (30 perces)', description: 'Saját bemutató a színpadon' },
    en: { label: 'Demo slot (30 minutes)', description: 'Your own demo on stage' },
  },
] as const

const text = {
  hu: {
    title: 'Állíts ki\nnálunk.',
    intro: 'Néhány lépésben végigvezetünk a jelentkezésen – a végén azonnal látod a várható költséget.',
    welcomeHeading: 'Üdvözlünk! Örülünk, hogy érdeklődsz.',
    welcomeText:
      'A Budapest Guitar Show Magyarország legnagyobb gitáros eseménye. Ha szeretnéd megmutatni a hangszereidet, termékeidet a hazai gitáros közösségnek, jó helyen jársz. Pár perc az egész.',
    stats: ['látogató 2026-ban', 'márka egy helyen', 'nap gitár, zene, közösség'],
    stepCompany: { heading: 'Ki állít ki?', text: 'Kezdjük az alapokkal: kinek a nevére szóljon a jelentkezés és a számla.' },
    stepContact: { heading: 'Kivel tartsuk a kapcsolatot?', text: 'Ide küldjük a visszaigazolást és a végleges ajánlatot.' },
    stepBrands: { heading: 'Milyen márkákat hozol?', text: 'Sorold fel a képviselt márkákat – ha van, töltsd fel a logójukat is, így könnyebben bemutatjuk őket.' },
    stepBooth: { heading: 'Mekkora standot szeretnél?', text: 'Add meg a stand méretét – a rajzon látod, mekkora lesz, a táblázatban pedig, hogy mi jár hozzá.' },
    stepExtras: { heading: 'Kell még valami?', text: 'Válaszd ki a további szolgáltatásokat. Az árak nettó árak.' },
    stepSummary: { heading: 'Nézzük át!', text: 'Ellenőrizd az adatokat, és küldd el a jelentkezést. Ezzel még nem kötelezed el magad.' },
    totalNote:
      'A végösszeg tájékoztató jellegű. A jelentkezés beérkezése után felvesszük veled a kapcsolatot, és e-mailben küldjük a végleges ajánlatot és a helyszínrajzot.',
    consentText:
      'Hozzájárulok, hogy a Budapest Guitar Show szervezői a megadott adataimat a kiállítói jelentkezés feldolgozásához és a kapcsolattartáshoz kezeljék.',
    successHeading: 'Köszönjük, megkaptuk a jelentkezésed!',
    successText: 'Hamarosan felvesszük veled a kapcsolatot a megadott e-mail címen, és elküldjük a végleges ajánlatot.',
  },
  en: {
    title: 'Exhibit\nwith us.',
    intro: "We'll walk you through the application in a few steps – and show you the estimated cost at the end.",
    welcomeHeading: "Welcome! We're glad you're interested.",
    welcomeText:
      "Budapest Guitar Show is Hungary's largest guitar event. If you'd like to show your instruments and products to the guitar community, you're in the right place. It only takes a few minutes.",
    stats: ['visitors in 2026', 'brands in one place', 'days of guitars, music and community'],
    stepCompany: { heading: 'Who is exhibiting?', text: "Let's start with the basics: who the application and the invoice should be for." },
    stepContact: { heading: 'Who should we contact?', text: "We'll send the confirmation and the final offer here." },
    stepBrands: { heading: 'Which brands are you bringing?', text: 'List the brands you represent – upload their logos too, if you have them, so we can feature them.' },
    stepBooth: { heading: 'How big should your booth be?', text: "Set the size of your booth – the drawing shows how big it is, and the table shows what's included." },
    stepExtras: { heading: 'Anything else?', text: 'Choose any additional services. All prices are net.' },
    stepSummary: { heading: "Let's review!", text: "Check your details and submit your application. This isn't a binding commitment yet." },
    totalNote:
      "The total is an estimate. Once we receive your application, we'll get in touch and email you the final offer and floor plan.",
    consentText: 'I agree that the organisers of Budapest Guitar Show may process the data I provided to handle my exhibitor application and to contact me.',
    successHeading: 'Thank you, we received your application!',
    successText: "We'll get in touch soon at the email address you provided and send you the final offer.",
  },
}

const statValues = ['2500+', '90+', '2']

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[jelentkezés] ${m}`)
  const force = process.argv.includes('--force')

  const existing = await payload.findGlobal({ slug: 'exhibitor-onboarding', locale: 'hu' })
  if (existing.welcomeHeading && !force) {
    log('Már ki van töltve – nem írom felül (újratöltés: --force).')
    process.exit(0)
  }

  const hu = text.hu
  const saved = await payload.updateGlobal({
    slug: 'exhibitor-onboarding',
    locale: 'hu',
    data: {
      title: hu.title,
      intro: hu.intro,
      welcomeHeading: hu.welcomeHeading,
      welcomeText: hu.welcomeText,
      stats: statValues.map((value, i) => ({ value, label: hu.stats[i] })),
      stepCompany: hu.stepCompany,
      stepContact: hu.stepContact,
      stepBrands: hu.stepBrands,
      stepBooth: hu.stepBooth,
      stepExtras: hu.stepExtras,
      stepSummary: hu.stepSummary,
      totalNote: hu.totalNote,
      consentText: hu.consentText,
      successHeading: hu.successHeading,
      successText: hu.successText,
      tiers: tiers.map((t) => ({
        minArea: t.minArea,
        maxArea: t.maxArea,
        pricePerSqm: t.pricePerSqm,
        badges: t.badges,
        tickets: t.tickets,
        parking: t.parking,
        label: t.hu.label,
        perks: t.hu.perks,
      })),
      vatRate: 27,
      minSide: 2,
      maxSide: 20,
      extras: extras.map((x) => ({
        price: x.price,
        kind: x.kind,
        maxQuantity: 'maxQuantity' in x ? x.maxQuantity : undefined,
        label: x.hu.label,
        unit: 'unit' in x.hu ? x.hu.unit : undefined,
        variants: 'variants' in x.hu ? x.hu.variants : undefined,
        description: 'description' in x.hu ? x.hu.description : undefined,
      })),
    },
  })

  // Angol: ugyanazok a sorok (azonosító szerint), csak a fordítható mezők.
  const en = text.en
  await payload.updateGlobal({
    slug: 'exhibitor-onboarding',
    locale: 'en',
    data: {
      title: en.title,
      intro: en.intro,
      welcomeHeading: en.welcomeHeading,
      welcomeText: en.welcomeText,
      stats: (saved.stats ?? []).map((s, i) => ({ ...s, label: en.stats[i] })),
      stepCompany: en.stepCompany,
      stepContact: en.stepContact,
      stepBrands: en.stepBrands,
      stepBooth: en.stepBooth,
      stepExtras: en.stepExtras,
      stepSummary: en.stepSummary,
      totalNote: en.totalNote,
      consentText: en.consentText,
      successHeading: en.successHeading,
      successText: en.successText,
      tiers: (saved.tiers ?? []).map((t, i) => ({ ...t, label: tiers[i].en.label, perks: tiers[i].en.perks })),
      extras: (saved.extras ?? []).map((x, i) => {
        const src = extras[i].en
        return {
          ...x,
          label: src.label,
          unit: 'unit' in src ? src.unit : undefined,
          variants: 'variants' in src ? src.variants : undefined,
          description: 'description' in src ? src.description : undefined,
        }
      }),
    },
  })

  log('Szövegek, standdíjak és szolgáltatások feltöltve (HU + EN). A standdíjak helykitöltők!')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
