import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exhibitor_onboarding" ADD COLUMN "applications_open" boolean DEFAULT false;
  ALTER TABLE "exhibitor_onboarding_locales" ADD COLUMN "closed_title" varchar;
  ALTER TABLE "exhibitor_onboarding_locales" ADD COLUMN "closed_text" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exhibitor_onboarding" DROP COLUMN "applications_open";
  ALTER TABLE "exhibitor_onboarding_locales" DROP COLUMN "closed_title";
  ALTER TABLE "exhibitor_onboarding_locales" DROP COLUMN "closed_text";`)
}
