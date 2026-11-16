import type { Field, GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/** Egy lépés címe és leírása (mindkét nyelven szerkeszthető). */
const step = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'heading', type: 'text', label: 'Cím', localized: true, admin: { width: '50%' } },
        {
          name: 'text',
          type: 'textarea',
          label: 'Leírás',
          localized: true,
          admin: { width: '50%', rows: 2 },
        },
      ],
    },
  ],
})

export const ExhibitorOnboarding: GlobalConfig = {
  slug: 'exhibitor-onboarding',
  label: 'Kiállítói jelentkezés',
  admin: {
    group: 'Kiállítói jelentkezés',
    description: 'A /kiallitoi-jelentkezes oldal szövegei, árai és szolgáltatásai.',
  },
  access: { read: anyone, update: loggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'collapsible',
      label: 'Jelentkezés állapota',
      fields: [
        {
          name: 'applicationsOpen',
          type: 'checkbox',
          label: 'A jelentkezés nyitva van',
          defaultValue: false,
          admin: {
            description:
              'Kikapcsolva a „Kiállítóként jelentkezem” gombok egy felugró ablakot nyitnak az alábbi szöveggel, a jelentkezési oldal pedig nem fogad jelentkezést.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'closedTitle',
              type: 'text',
              label: 'Felugró ablak címe (ha zárva)',
              localized: true,
              admin: { width: '50%', placeholder: 'A kiállítói jelentkezés hamarosan indul' },
            },
            {
              name: 'closedText',
              type: 'textarea',
              label: 'Felugró ablak szövege (ha zárva)',
              localized: true,
              admin: {
                width: '50%',
                rows: 3,
                description: 'Üresen hagyva az alapértelmezett szöveg jelenik meg.',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Szövegek',
          fields: [
            {
              type: 'collapsible',
              label: 'Bal oldali cím (minden lépésnél látszik)',
              fields: [
                {
                  name: 'title',
                  type: 'textarea',
                  label: 'Cím',
                  localized: true,
                  admin: { rows: 2, description: 'Új sorba írt rész narancs színnel jelenik meg.' },
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  label: 'Bevezető',
                  localized: true,
                  admin: { rows: 2 },
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Üdvözlés',
              fields: [
                { name: 'welcomeHeading', type: 'text', label: 'Cím', localized: true },
                { name: 'welcomeText', type: 'textarea', label: 'Szöveg', localized: true },
                {
                  name: 'stats',
                  type: 'array',
                  label: 'Nagy számok',
                  labels: { singular: 'Szám', plural: 'Számok' },
                  maxRows: 4,
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'value',
                          type: 'text',
                          label: 'Szám (pl. 2500+)',
                          required: true,
                          admin: { width: '40%' },
                        },
                        {
                          name: 'label',
                          type: 'text',
                          label: 'Felirat',
                          required: true,
                          localized: true,
                          admin: { width: '60%' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Lépések címei',
              fields: [
                step('stepCompany', 'Kiállító adatai'),
                step('stepContact', 'Kapcsolattartó'),
                step('stepBrands', 'Képviselt márkák'),
                step('stepBooth', 'Stand'),
                step('stepExtras', 'Szolgáltatások'),
                step('stepSummary', 'Összegzés'),
              ],
            },
            {
              type: 'collapsible',
              label: 'Összegzés és beküldés',
              fields: [
                {
                  name: 'totalNote',
                  type: 'textarea',
                  label: 'Megjegyzés a végösszeg alatt',
                  localized: true,
                  admin: { rows: 2 },
                },
                {
                  name: 'consentText',
                  type: 'textarea',
                  label: 'Hozzájárulás szövege (jelölőnégyzet)',
                  localized: true,
                  admin: { rows: 2 },
                },
                {
                  name: 'successHeading',
                  type: 'text',
                  label: 'Sikeres beküldés – cím',
                  localized: true,
                },
                {
                  name: 'successText',
                  type: 'textarea',
                  label: 'Sikeres beküldés – szöveg',
                  localized: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Standdíjak',
          fields: [
            {
              name: 'tiers',
              type: 'array',
              label: 'Árkategóriák',
              labels: { singular: 'Kategória', plural: 'Kategóriák' },
              admin: {
                description:
                  'A stand mérete alapján automatikusan választódik ki. Egy kategória a „Mérettől” (ezt is beleértve) a „Méretig” (ezt már nem) tart; az utolsónál a „Méretig” üresen hagyható.',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Név (pl. Kis stand)',
                  localized: true,
                  required: true,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'minArea',
                      type: 'number',
                      label: 'Mérettől (m²)',
                      required: true,
                      min: 0,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'maxArea',
                      type: 'number',
                      label: 'Méretig (m²)',
                      min: 0,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'pricePerSqm',
                      type: 'number',
                      label: 'Nettó ár / m² (Ft)',
                      required: true,
                      min: 0,
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'badges',
                      type: 'number',
                      label: 'Kiállítói badge (db)',
                      min: 0,
                      defaultValue: 0,
                      admin: { width: '33%' },
                    },
                    {
                      name: 'tickets',
                      type: 'number',
                      label: 'Belépő (db)',
                      min: 0,
                      defaultValue: 0,
                      admin: { width: '33%' },
                    },
                    {
                      name: 'parking',
                      type: 'number',
                      label: 'Parkoló (db)',
                      min: 0,
                      defaultValue: 0,
                      admin: { width: '34%' },
                    },
                  ],
                },
                {
                  name: 'perks',
                  type: 'textarea',
                  label: 'Egyéb, ami jár hozzá (soronként egy)',
                  localized: true,
                  admin: { rows: 3 },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'vatRate',
                  type: 'number',
                  label: 'ÁFA (%)',
                  required: true,
                  defaultValue: 27,
                  min: 0,
                  max: 100,
                  admin: { width: '33%' },
                },
                {
                  name: 'minSide',
                  type: 'number',
                  label: 'Stand oldala legalább (m)',
                  required: true,
                  defaultValue: 2,
                  min: 1,
                  admin: { width: '33%' },
                },
                {
                  name: 'maxSide',
                  type: 'number',
                  label: 'Stand oldala legfeljebb (m)',
                  required: true,
                  defaultValue: 20,
                  min: 1,
                  admin: { width: '34%' },
                },
              ],
            },
          ],
        },
        {
          label: 'Szolgáltatások',
          fields: [
            {
              name: 'extras',
              type: 'array',
              label: 'Választható szolgáltatások',
              labels: { singular: 'Szolgáltatás', plural: 'Szolgáltatások' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      label: 'Megnevezés',
                      localized: true,
                      required: true,
                      admin: { width: '60%' },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      label: 'Nettó egységár (Ft)',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: { width: '40%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      label: 'Típus',
                      required: true,
                      defaultValue: 'quantity',
                      options: [
                        { label: 'Darabszám megadása', value: 'quantity' },
                        { label: 'Igen / nem', value: 'toggle' },
                        { label: 'Igen / nem – a stand m²-ével szorozva', value: 'perSqm' },
                      ],
                      admin: { width: '40%' },
                    },
                    {
                      name: 'unit',
                      type: 'text',
                      label: 'Egység (pl. db, fő)',
                      localized: true,
                      admin: { width: '30%', condition: (_, row) => row?.kind === 'quantity' },
                    },
                    {
                      name: 'maxQuantity',
                      type: 'number',
                      label: 'Legfeljebb',
                      min: 1,
                      defaultValue: 50,
                      admin: { width: '30%', condition: (_, row) => row?.kind === 'quantity' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'description',
                      type: 'text',
                      label: 'Rövid leírás (opcionális)',
                      localized: true,
                      admin: { width: '60%' },
                    },
                    {
                      name: 'variants',
                      type: 'text',
                      label: 'Változatok, vesszővel (pl. Fekete, Fehér)',
                      localized: true,
                      admin: { width: '40%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
