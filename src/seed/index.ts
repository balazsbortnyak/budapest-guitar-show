/**
 * Kezdő tartalom feltöltése a mostani budapestguitarshow.com alapján.
 * Futtatás: npm run seed
 * Csak üres gyűjteményeket tölt fel, a meglévő tartalmat nem írja felül.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const brands = ['A.Martinez', 'Admira', 'Arven Case', 'Audient', 'Audio-Technica', 'Augilar', 'Beetronics', 'Blackstar', 'Blasius', 'Bognar Electronics', 'Boldogh', 'Boss', 'Bromo', 'Cort', 'Craftsman by MT', 'Crazy Tube Circuits', 'David Tube Straps', 'Digitech', 'Divitone', 'Donner', 'Dowina', 'Dunlop', 'Elixir', 'Erhard Guitars', 'FGN', 'Fibenare', 'Floyd Rose', 'Gator', 'Goldschmidt', 'Gotoh', 'Guitars for CATS', 'Hagstrom', 'Headrush', "Henry's", 'Hercules', 'Heritage', 'Hotone', 'Ibanez', 'J. Rockett', 'James Tyler', 'Jet', 'Kemper', 'Kepma', 'Kitsune Guitar Picks', 'Korg', 'Laney', 'M-VAVE', 'Magneto', 'Mahalo', 'Marris', 'Matt Custom Guitar', 'Mooer', 'Musicnomad', 'MXR', 'Nashville', 'Neural DSP', 'Nokkel Pickups', 'Novo', 'NUX', 'Ortega', 'Panda Audio', 'Paoletti', 'Peavey', 'Pedaltrain', 'Peter Crow Design', 'Prigler', 'PRS', 'Radial', 'Richwood', 'Roland', 'Rotosound', 'Route51', 'Sadowsky', 'Salvador Cortez', 'sE', 'Seymour-Duncan', 'Shure', 'Solar Guitars', 'Spector', 'Spira', 'Stagg', 'SX', 'Taylor', 'Universal Audio', 'Valencia', 'Valeton', 'Victory Amps', 'Vintage', 'Vox', 'Walrus Audio', 'Warwick', 'Way Huge', 'Wylde Audio', 'Xotic']

const programs = [
  { hu: ['Masterclassok', 'Tanulj közvetlenül a mesterektől'], en: ['Masterclasses', 'Learn directly from the masters'] },
  { hu: ['Kiállítás', 'Gyártók, kereskedők, hangszerkészítők'], en: ['Exhibition', 'Makers, retailers and luthiers'] },
  { hu: ['Előadások', 'Hangszerekről, hangzásról, szakmáról'], en: ['Talks', 'On instruments, tone and the trade'] },
  { hu: ['Élő demók', 'Hazai és nemzetközi gitárosok'], en: ['Live demos', 'Hungarian and international guitarists'] },
  { hu: ['Hangszerpróba', 'Vedd kézbe a legújabb modelleket'], en: ['Try the gear', 'Get your hands on the latest models'] },
  { hu: ['Workshopok', 'Interaktív, kis csoportos alkalmak'], en: ['Workshops', 'Interactive, small-group sessions'] },
]

const faqs = [
  {
    hu: ['Hol lesz a rendezvény?', 'Budapesten – a pontos helyszínt hamarosan bejelentjük.'],
    en: ['Where will the event take place?', 'In Budapest – the exact venue will be announced soon.'],
  },
  {
    hu: ['Basszusgitárosok is jöhetnek?', '[VÁLASZ – töltsd ki az adminban]'],
    en: ['Can bass players come too?', '[ANSWER – fill in via admin]'],
  },
  {
    hu: ['Milyen programokra számíthatok?', 'Élő bemutatók hazai és nemzetközi gitárosokkal, interaktív workshopok és masterclassok, előadások, valamint kiállítás a legújabb hangszerekkel és felszerelésekkel.'],
    en: ['What programs can I expect?', 'Live demos by Hungarian and international guitarists, interactive workshops and masterclasses, talks, and an exhibition of the latest instruments and gear.'],
  },
  {
    hu: ['Ki lehet próbálni a hangszereket és felszereléseket?', 'Igen, a kiállítók standjain kézbe veheted és kipróbálhatod a legújabb hangszereket és felszereléseket.'],
    en: ['Can I try instruments and gear?', "Yes – you can try the latest instruments and gear at the exhibitors' stands."],
  },
  {
    hu: ['Hogyan vehetek jegyet?', 'A jegyértékesítés hamarosan indul. Iratkozz fel az értesítőre, és elsőként szólunk.'],
    en: ['How can I buy tickets?', "Ticket sales open soon. Sign up and we'll let you know first."],
  },
  {
    hu: ['Hogyan jelentkezhetnek a kiállítók?', 'Írj nekünk az info@budapestguitarshow.com címre, és felvesszük veled a kapcsolatot.'],
    en: ['How can exhibitors apply?', "Email us at info@budapestguitarshow.com and we'll get in touch."],
  },
]

const videoIds = ['xcvit7LnLhI', 'RS8eiV8EiUY', 'ErswnnP4R98', 'bD_6niivrlc']

const pillarsHu = ['Gitárok', 'Erősítők', 'Effektpedálok', 'Hangszedők', 'Masterclassok', 'Előadások', 'Közösség']
const pillarsEn = ['Guitars', 'Amps', 'Effect pedals', 'Pickups', 'Masterclasses', 'Talks', 'Community']

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // --- Esemény és főoldal (global) ---
  const settings = await payload.findGlobal({ slug: 'site-settings', locale: 'hu' })
  if (!settings.heroHeadline) {
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'hu',
      data: {
        eventName: 'Budapest Guitar Show 2027',
        dateLabel: '2027. november [dátum]',
        venue: 'Budapest, [helyszín]',
        ticketStatus: 'soon',
        ticketUrl: 'https://cooltix.hu/event/69fca0fdfa29fe4823777899',
        heroHeadline: 'Magyarország legnagyobb gitáros eseménye.',
        nextEventVideoId: videoIds[0],
        statementHeading: 'Minden, ami gitár.\nEgy hétvégén.',
        statementText: 'Élő bemutatók hazai és nemzetközi gitárosokkal, a legújabb hangszerek kipróbálása, workshopok és masterclassok.',
        pillars: pillarsHu.map((label) => ({ label })),
        pillarsText: 'Két nap a hangszerekről, a hangzásról és a közösségről – kezdőknek, profiknak és mindenkinek, aki szereti a gitárt.',
        exhibitorsHeading: '90+ márka.\nEgy helyen, kézközelben.',
        exhibitorsText: 'Gitárok, erősítők, pedálok, hangszedők és stúdiótechnika a hazai és nemzetközi gyártóktól. Egyre több kiállítót jelentünk be!',
        contactEmail: 'info@budapestguitarshow.com',
        facebookUrl: 'https://www.facebook.com/profile.php?id=61576482101736',
        instagramUrl: 'https://www.instagram.com/budapestguitarshow/',
        tiktokUrl: 'https://www.tiktok.com/@budapestguitarshow',
      },
    })
    const hu = await payload.findGlobal({ slug: 'site-settings', locale: 'hu' })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        dateLabel: 'November [date], 2027',
        venue: 'Budapest, [venue]',
        heroHeadline: "Hungary's largest guitar event.",
        statementHeading: 'Everything guitar.\nOne weekend.',
        statementText: 'Live demos by Hungarian and international guitarists, the latest gear to try, workshops and masterclasses.',
        // A tömb sorait azonosító alapján párosítjuk, így a két nyelv ugyanazokat a sorokat használja.
        pillars: (hu.pillars ?? []).map((row, i) => ({ id: row.id, label: pillarsEn[i] ?? row.label })),
        pillarsText: 'Two days about instruments, tone and community – for beginners, pros and everyone who loves the guitar.',
        exhibitorsHeading: '90+ brands.\nAll in one place.',
        exhibitorsText: 'Guitars, amps, pedals, pickups and studio gear from Hungarian and international makers. More exhibitors announced soon!',
      },
    })
    log('Esemény és főoldal beállítva')
  }

  // --- Gyűjtemények (csak ha üresek) ---
  const isEmpty = async (collection: 'programs' | 'videos' | 'exhibitors' | 'faqs') =>
    (await payload.count({ collection })).totalDocs === 0

  if (await isEmpty('programs')) {
    for (const [i, p] of programs.entries()) {
      const doc = await payload.create({
        collection: 'programs',
        locale: 'hu',
        data: { title: p.hu[0], description: p.hu[1], order: i },
      })
      await payload.update({ collection: 'programs', id: doc.id, locale: 'en', data: { title: p.en[0], description: p.en[1] } })
    }
    log(`${programs.length} programkártya`)
  }

  if (await isEmpty('faqs')) {
    for (const [i, f] of faqs.entries()) {
      const doc = await payload.create({
        collection: 'faqs',
        locale: 'hu',
        data: { question: f.hu[0], answer: f.hu[1], order: i },
      })
      await payload.update({ collection: 'faqs', id: doc.id, locale: 'en', data: { question: f.en[0], answer: f.en[1] } })
    }
    log(`${faqs.length} GYIK kérdés`)
  }

  if (await isEmpty('videos')) {
    for (const [i, id] of videoIds.entries()) {
      const doc = await payload.create({
        collection: 'videos',
        locale: 'hu',
        data: { title: `Budapest Guitar Show – videó ${i + 1}`, youtubeId: id, order: i },
      })
      await payload.update({ collection: 'videos', id: doc.id, locale: 'en', data: { title: `Budapest Guitar Show – video ${i + 1}` } })
    }
    log(`${videoIds.length} videó`)
  }

  if (await isEmpty('exhibitors')) {
    for (const name of brands) {
      await payload.create({ collection: 'exhibitors', data: { name } })
    }
    log(`${brands.length} kiállító / márka`)
  }

  log('Kész.')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
