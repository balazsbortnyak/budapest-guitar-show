import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, loggedIn } from '../access'
import { contentHooks } from '../hooks/revalidate'

const editorAccess = {
  read: anyone,
  create: loggedIn,
  update: loggedIn,
  delete: loggedIn,
}

const orderField = {
  name: 'order',
  type: 'number' as const,
  label: 'Sorrend',
  defaultValue: 0,
  admin: { position: 'sidebar' as const, description: 'Kisebb szám = előrébb jelenik meg.' },
}

const publishedField = {
  name: 'published',
  type: 'checkbox' as const,
  label: 'Megjelenik az oldalon',
  defaultValue: true,
  admin: { position: 'sidebar' as const },
}

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Programkártya', plural: 'Programok' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'published'],
    group: 'Tartalom',
  },
  access: editorAccess,
  hooks: contentHooks,
  fields: [
    { name: 'title', type: 'text', label: 'Cím', required: true, localized: true },
    { name: 'description', type: 'text', label: 'Rövid leírás', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Kép (álló)' },
    orderField,
    publishedField,
  ],
}

export const Performers: CollectionConfig = {
  slug: 'performers',
  labels: { singular: 'Fellépő', plural: 'Fellépők' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'day', 'order', 'published'],
    group: 'Tartalom',
  },
  access: editorAccess,
  hooks: contentHooks,
  fields: [
    { name: 'name', type: 'text', label: 'Név', required: true },
    { name: 'role', type: 'text', label: 'Zenekar / műfaj / titulus', localized: true },
    {
      name: 'day',
      type: 'select',
      label: 'Nap',
      options: [
        { label: '1. nap', value: '1' },
        { label: '2. nap', value: '2' },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Portré' },
    orderField,
    publishedField,
  ],
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Videó', plural: 'Videók' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'youtubeId', 'order'],
    group: 'Tartalom',
  },
  access: editorAccess,
  hooks: contentHooks,
  fields: [
    { name: 'title', type: 'text', label: 'Cím', required: true, localized: true },
    {
      name: 'youtubeId',
      type: 'text',
      label: 'YouTube videó azonosító',
      required: true,
      admin: {
        description: 'A link végén lévő kód, pl. youtube.com/watch?v=xcvit7LnLhI → xcvit7LnLhI',
      },
      validate: (value: string | null | undefined) =>
        !value || /^[A-Za-z0-9_-]{6,20}$/.test(value) || 'Érvénytelen YouTube azonosító',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Saját előnézeti kép (opcionális)',
      admin: { description: 'Ha üres, a YouTube saját előnézete jelenik meg.' },
    },
    orderField,
    publishedField,
  ],
}

export const Exhibitors: CollectionConfig = {
  slug: 'exhibitors',
  labels: { singular: 'Kiállító / márka', plural: 'Kiállítók és márkák' },
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'exhibitor', 'featured', 'published'],
    group: 'Tartalom',
    description:
      'A kiállítói aloldalon (/kiallitok) mind megjelenik; a főoldalon csak a „Főoldalon is megjelenik” jelölésűek.',
  },
  access: editorAccess,
  hooks: contentHooks,
  fields: [
    { name: 'name', type: 'text', label: 'Márka neve', required: true },
    {
      name: 'exhibitor',
      type: 'text',
      label: 'Kiállító / forgalmazó (aki hozza)',
      admin: { description: 'Pl. Forte Music. Hagyd üresen, ha a márka saját standdal állít ki.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logó (opcionális)',
      admin: {
        description: 'Lehetőleg fehér logó átlátszó vagy fekete háttéren – az oldal sötét.',
      },
    },
    {
      name: 'website',
      type: 'text',
      label: 'Weboldal',
      validate: (value: string | null | undefined) =>
        !value ||
        /^https?:\/\//.test(value) ||
        'A linknek http:// vagy https:// kezdetűnek kell lennie',
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Főoldalon is megjelenik',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'A főoldalon csak néhány kiemelt márka látszik (max. 12).',
      },
    },
    publishedField,
  ],
}

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'GYIK kérdés', plural: 'GYIK' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order', 'published'],
    group: 'Tartalom',
  },
  access: editorAccess,
  hooks: contentHooks,
  fields: [
    { name: 'question', type: 'text', label: 'Kérdés', required: true, localized: true },
    { name: 'answer', type: 'textarea', label: 'Válasz', required: true, localized: true },
    orderField,
    publishedField,
  ],
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Feliratkozó', plural: 'Hírlevél-feliratkozók' },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'senderSyncedAt', 'createdAt'],
    group: 'Feliratkozók',
    description:
      'Akik feliratkoztak az oldalon (jegyértesítő / hírlevél). Minden új feliratkozó automatikusan átkerül a Sender.net-be is.',
  },
  access: {
    // A REST API-n keresztül senki nem hozhat létre feliratkozót:
    // csak a weboldal szerveroldali űrlapkezelője (ellenőrzött adatokkal).
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'email', type: 'email', label: 'E-mail', required: true, unique: true, index: true },
    {
      name: 'locale',
      type: 'select',
      label: 'Nyelv',
      defaultValue: 'hu',
      options: [
        { label: 'Magyar', value: 'hu' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'senderSyncedAt',
      type: 'date',
      label: 'Sender.net-be küldve',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Mikor került át a Sender.net hírlevél-listába.',
      },
    },
    {
      name: 'senderError',
      type: 'textarea',
      label: 'Sender.net hiba',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.senderError),
      },
    },
  ],
}
