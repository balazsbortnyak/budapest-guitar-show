import type { Access, FieldAccess } from 'payload'

/** Bárki olvashatja (publikus tartalom). */
export const anyone: Access = () => true

/** Bármely bejelentkezett admin felhasználó. */
export const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/** Csak "admin" szerepkör (felhasználókezelés, feliratkozók). */
export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

/** Admin mindenkit, szerkesztő csak saját magát érheti el. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}
