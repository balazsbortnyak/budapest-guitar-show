import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { paths } from '../lib/routes'

/** Minden nyilvános oldal frissítése (mindkét nyelv), hogy az admin módosítása azonnal látsszon. */
const revalidateSite = () => {
  try {
    revalidatePath('/', 'layout')
    for (const page of Object.values(paths)) {
      revalidatePath(page.hu)
      revalidatePath(page.en)
    }
  } catch {
    // Seed scriptből / Next környezeten kívül futva nincs mit frissíteni.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const contentHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}
