import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isAdminOrSelf } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Felhasználó', plural: 'Felhasználók' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Beállítások',
  },
  auth: {
    // Brute-force védelem: 5 hibás próbálkozás után 15 percre zárolja a fiókot.
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // 8 órás munkamenet
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Nincs nyilvános regisztráció: új felhasználót csak admin hozhat létre.
    // (Az első admin felhasználót a /admin oldalon lehet létrehozni, amíg nincs egy sem.)
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Név' },
    {
      name: 'role',
      type: 'select',
      label: 'Szerepkör',
      required: true,
      defaultValue: 'admin',
      saveToJWT: true,
      access: { update: isAdminField, create: isAdminField },
      options: [
        { label: 'Admin (mindenhez hozzáfér)', value: 'admin' },
        { label: 'Szerkesztő (csak tartalom)', value: 'editor' },
      ],
    },
  ],
}
