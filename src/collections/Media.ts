import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { contentHooks } from '../hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Kép', plural: 'Képek' },
  admin: { group: 'Tartalom' },
  access: {
    read: anyone,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: contentHooks,
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alternatív szöveg (mit ábrázol a kép)',
      required: true,
      localized: true,
    },
    {
      name: 'overlay',
      type: 'number',
      label: 'Sötétítés (%)',
      defaultValue: 40,
      min: 0,
      max: 90,
      admin: {
        step: 5,
        description:
          'Fekete réteg a kép felett, hogy a rajta lévő szöveg olvasható legyen. 0 = nincs sötétítés, 90 = majdnem fekete. Csak ott jelenik meg, ahol szöveg van a képen (hero, programkártyák, kiemelés).',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    imageSizes: [
      { name: 'card', width: 640 },
      { name: 'large', width: 1600 },
      { name: 'hero', width: 2400 },
    ],
    adminThumbnail: 'card',
    focalPoint: true,
  },
}
