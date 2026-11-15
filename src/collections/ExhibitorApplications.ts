import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access'

/**
 * A jelentkezők által feltöltött márkalogók. Nem publikusak: csak bejelentkezett
 * admin felhasználók látják, és csak a szerveroldali jelentkezés-kezelő hozhat létre ilyet.
 */
export const ApplicationLogos: CollectionConfig = {
  slug: 'application-logos',
  labels: { singular: 'Jelentkezői logó', plural: 'Jelentkezői logók' },
  admin: { group: 'Kiállítói jelentkezés', hidden: ({ user }) => !user },
  access: {
    read: loggedIn,
    create: () => false,
    update: loggedIn,
    delete: loggedIn,
  },
  fields: [{ name: 'alt', type: 'text', label: 'Márka' }],
  upload: {
    staticDir: 'application-logos',
    // SVG szándékosan nincs engedélyezve: idegen SVG-ben futtatható kód lehet.
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
}

/** Automatikusan generált kiállítói szerződések (.docx). Nem publikusak. */
export const ApplicationDocuments: CollectionConfig = {
  slug: 'application-documents',
  labels: { singular: 'Szerződés', plural: 'Generált szerződések' },
  admin: { group: 'Kiállítói jelentkezés', hidden: ({ user }) => !user },
  access: {
    read: loggedIn,
    create: () => false,
    update: loggedIn,
    delete: loggedIn,
  },
  fields: [{ name: 'title', type: 'text', label: 'Megnevezés' }],
  upload: {
    staticDir: 'application-documents',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
}

export const ExhibitorApplications: CollectionConfig = {
  slug: 'exhibitor-applications',
  labels: { singular: 'Kiállítói jelentkezés', plural: 'Beérkezett jelentkezések' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Kiállítói jelentkezés',
    useAsTitle: 'companyName',
    defaultColumns: [
      'reference',
      'companyName',
      'contactName',
      'boothArea',
      'totalGross',
      'status',
      'createdAt',
    ],
    description:
      'A weboldalon kitöltött kiállítói jelentkezések. Az összegek a beküldés pillanatában érvényes árakkal számolódtak.',
  },
  access: {
    // Csak a weboldal szerveroldali kezelője hozhat létre (ellenőrzött, újraszámolt adatokkal).
    create: () => false,
    read: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      label: 'Azonosító',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Ez szerepel a szerződésen, az e-mailben és a táblázatban.',
      },
    },
    {
      name: 'contract',
      type: 'upload',
      relationTo: 'application-documents',
      label: 'Szerződés (.docx)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Állapot',
      defaultValue: 'new',
      options: [
        { label: 'Új', value: 'new' },
        { label: 'Folyamatban', value: 'inProgress' },
        { label: 'Elfogadva', value: 'accepted' },
        { label: 'Elutasítva', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'locale',
      type: 'select',
      label: 'Nyelv',
      options: [
        { label: 'Magyar', value: 'hu' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Belső megjegyzés',
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Automatikus feldolgozás',
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        {
          name: 'emailSentAt',
          type: 'date',
          label: 'Értesítő e-mail elküldve',
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'sheetSyncedAt',
          type: 'date',
          label: 'Google Táblázatba írva',
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
        { name: 'processingLog', type: 'textarea', label: 'Hibák', admin: { readOnly: true } },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Kiállító',
          fields: [
            {
              name: 'applicantType',
              type: 'select',
              label: 'Típus',
              required: true,
              options: [
                { label: 'Cég', value: 'company' },
                { label: 'Magánszemély', value: 'individual' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'companyName',
                  type: 'text',
                  label: 'Cégnév / név',
                  required: true,
                  admin: { width: '50%' },
                },
                { name: 'taxNumber', type: 'text', label: 'Adószám', admin: { width: '25%' } },
                {
                  name: 'registrationNumber',
                  type: 'text',
                  label: 'Cégjegyzékszám',
                  admin: { width: '25%' },
                },
              ],
            },
            { name: 'billingAddress', type: 'textarea', label: 'Számlázási cím', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'contactName',
                  type: 'text',
                  label: 'Kapcsolattartó',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'phone',
                  type: 'text',
                  label: 'Telefon',
                  required: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  label: 'E-mail',
                  required: true,
                  admin: { width: '50%' },
                },
                { name: 'website', type: 'text', label: 'Weboldal', admin: { width: '50%' } },
              ],
            },
            {
              name: 'brands',
              type: 'array',
              label: 'Képviselt márkák',
              labels: { singular: 'Márka', plural: 'Márkák' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: 'Márka',
                      required: true,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'logo',
                      type: 'upload',
                      relationTo: 'application-logos',
                      label: 'Logó',
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
            { name: 'message', type: 'textarea', label: 'Üzenet a szervezőknek' },
          ],
        },
        {
          label: 'Stand és ár',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'boothWidth',
                  type: 'number',
                  label: 'Szélesség (m)',
                  admin: { width: '25%' },
                },
                {
                  name: 'boothDepth',
                  type: 'number',
                  label: 'Mélység (m)',
                  admin: { width: '25%' },
                },
                {
                  name: 'boothArea',
                  type: 'number',
                  label: 'Terület (m²)',
                  admin: { width: '25%' },
                },
                { name: 'tier', type: 'text', label: 'Kategória', admin: { width: '25%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'boothBadges',
                  type: 'number',
                  label: 'Badge (db)',
                  admin: { width: '33%' },
                },
                {
                  name: 'boothTickets',
                  type: 'number',
                  label: 'Belépő (db)',
                  admin: { width: '33%' },
                },
                {
                  name: 'boothParking',
                  type: 'number',
                  label: 'Parkoló (db)',
                  admin: { width: '34%' },
                },
              ],
            },
            { name: 'boothPerks', type: 'textarea', label: 'Ami jár hozzá', admin: { rows: 3 } },
            {
              name: 'lines',
              type: 'array',
              label: 'Tételek',
              labels: { singular: 'Tétel', plural: 'Tételek' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', label: 'Megnevezés', admin: { width: '40%' } },
                    {
                      name: 'quantity',
                      type: 'number',
                      label: 'Mennyiség',
                      admin: { width: '15%' },
                    },
                    {
                      name: 'unitPrice',
                      type: 'number',
                      label: 'Egységár',
                      admin: { width: '20%' },
                    },
                    { name: 'total', type: 'number', label: 'Nettó', admin: { width: '25%' } },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'totalNet',
                  type: 'number',
                  label: 'Nettó összesen (Ft)',
                  admin: { width: '33%' },
                },
                { name: 'totalVat', type: 'number', label: 'ÁFA (Ft)', admin: { width: '33%' } },
                {
                  name: 'totalGross',
                  type: 'number',
                  label: 'Bruttó összesen (Ft)',
                  admin: { width: '34%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
