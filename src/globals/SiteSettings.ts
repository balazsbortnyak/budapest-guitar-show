import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Esemény és főoldal',
  admin: { group: 'Tartalom' },
  access: { read: anyone, update: loggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Esemény',
          fields: [
            { name: 'eventName', type: 'text', label: 'Esemény neve', required: true, defaultValue: 'Budapest Guitar Show 2027' },
            {
              type: 'row',
              fields: [
                { name: 'dateLabel', type: 'text', label: 'Dátum (ahogy megjelenik)', localized: true, admin: { width: '50%' } },
                { name: 'venue', type: 'text', label: 'Helyszín', localized: true, admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ticketStatus',
                  type: 'select',
                  label: 'Jegyértékesítés állapota',
                  defaultValue: 'soon',
                  required: true,
                  options: [
                    { label: 'Hamarosan (feliratkozó űrlap)', value: 'soon' },
                    { label: 'Jegyek kaphatók', value: 'onSale' },
                    { label: 'Elfogyott', value: 'soldOut' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'ticketUrl',
                  type: 'text',
                  label: 'Jegyvásárlás linkje',
                  admin: { width: '50%' },
                  validate: (v: string | null | undefined) => !v || /^https:\/\//.test(v) || 'https:// kezdetű link kell',
                },
              ],
            },
          ],
        },
        {
          label: 'Hero',
          fields: [
            { name: 'heroHeadline', type: 'text', label: 'Főcím', localized: true, required: true },
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Háttérkép' },
            {
              type: 'collapsible',
              label: 'Videókártya a herón (pl. recap)',
              admin: { description: 'Kis kártya a hero jobb alsó sarkában. Csak akkor jelenik meg, ha van megadva YouTube videó.' },
              fields: [
                {
                  name: 'nextEventVideoId',
                  type: 'text',
                  label: 'YouTube videó azonosító',
                  admin: { description: 'A link végén lévő kód, pl. youtube.com/watch?v=xcvit7LnLhI → xcvit7LnLhI' },
                  validate: (value: string | null | undefined) =>
                    !value || /^[A-Za-z0-9_-]{6,20}$/.test(value) || 'Érvénytelen YouTube azonosító',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'heroCardLabel',
                      type: 'text',
                      label: 'Felirat (kis betűs, felül)',
                      localized: true,
                      admin: { width: '50%', placeholder: 'Nézd vissza' },
                    },
                    {
                      name: 'heroCardTitle',
                      type: 'text',
                      label: 'Cím (nagy betűs)',
                      localized: true,
                      admin: { width: '50%', placeholder: '2026 Recap' },
                    },
                  ],
                },
                {
                  name: 'nextEventImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Kártya képe (opcionális)',
                  admin: { description: 'Ha üres, a YouTube videó saját előnézeti képe jelenik meg.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Szekciók',
          fields: [
            {
              type: 'collapsible',
              label: 'Teljes szélességű kiemelés',
              fields: [
                { name: 'statementHeading', type: 'textarea', label: 'Cím', localized: true },
                { name: 'statementText', type: 'textarea', label: 'Szöveg', localized: true },
                { name: 'statementImage', type: 'upload', relationTo: 'media', label: 'Háttérkép' },
              ],
            },
            {
              type: 'collapsible',
              label: '„Amiért érdemes eljönnöd” lista',
              fields: [
                {
                  name: 'pillars',
                  type: 'array',
                  label: 'Szavak',
                  labels: { singular: 'Szó', plural: 'Szavak' },
                  fields: [{ name: 'label', type: 'text', label: 'Szó', required: true, localized: true }],
                },
                { name: 'pillarsText', type: 'textarea', label: 'Kísérőszöveg', localized: true },
                { name: 'pillarsImage', type: 'upload', relationTo: 'media', label: 'Kép (álló)' },
              ],
            },
            {
              type: 'collapsible',
              label: 'Kiállítók szekció',
              fields: [
                { name: 'exhibitorsHeading', type: 'textarea', label: 'Cím', localized: true },
                {
                  name: 'exhibitorsListTitle',
                  type: 'text',
                  label: 'Logólista címe',
                  localized: true,
                  admin: { placeholder: '2026-ban ők állítottak ki', description: 'A főoldali logók felett és a /kiallitok oldal főcímeként jelenik meg.' },
                },
                { name: 'exhibitorsText', type: 'textarea', label: 'Szöveg', localized: true },
              ],
            },
          ],
        },
        {
          label: 'Kapcsolat',
          fields: [
            { name: 'contactEmail', type: 'email', label: 'Kapcsolati e-mail', defaultValue: 'info@budapestguitarshow.com' },
            { name: 'facebookUrl', type: 'text', label: 'Facebook' },
            { name: 'instagramUrl', type: 'text', label: 'Instagram' },
            { name: 'tiktokUrl', type: 'text', label: 'TikTok' },
          ],
        },
      ],
    },
  ],
}
