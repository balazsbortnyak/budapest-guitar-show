import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('hu', 'en');
  CREATE TYPE "public"."enum_performers_day" AS ENUM('1', '2');
  CREATE TYPE "public"."enum_subscribers_locale" AS ENUM('hu', 'en');
  CREATE TYPE "public"."enum_exhibitor_applications_status" AS ENUM('new', 'inProgress', 'accepted', 'rejected');
  CREATE TYPE "public"."enum_exhibitor_applications_locale" AS ENUM('hu', 'en');
  CREATE TYPE "public"."enum_exhibitor_applications_applicant_type" AS ENUM('company', 'individual');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_site_settings_ticket_status" AS ENUM('soon', 'onSale', 'soldOut');
  CREATE TYPE "public"."enum_exhibitor_onboarding_extras_kind" AS ENUM('quantity', 'toggle', 'perSqm');
  CREATE TABLE "programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programs_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "performers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"day" "enum_performers_day",
  	"photo_id" integer,
  	"order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "performers_locales" (
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"youtube_id" varchar NOT NULL,
  	"thumbnail_id" integer,
  	"order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "videos_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exhibitors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"exhibitor" varchar,
  	"logo_id" integer,
  	"website" varchar,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"overlay" numeric DEFAULT 40,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"locale" "enum_subscribers_locale" DEFAULT 'hu',
  	"sender_synced_at" timestamp(3) with time zone,
  	"sender_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exhibitor_applications_brands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "exhibitor_applications_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"quantity" numeric,
  	"unit_price" numeric,
  	"total" numeric
  );
  
  CREATE TABLE "exhibitor_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"contract_id" integer,
  	"status" "enum_exhibitor_applications_status" DEFAULT 'new',
  	"locale" "enum_exhibitor_applications_locale",
  	"internal_notes" varchar,
  	"email_sent_at" timestamp(3) with time zone,
  	"sheet_synced_at" timestamp(3) with time zone,
  	"processing_log" varchar,
  	"applicant_type" "enum_exhibitor_applications_applicant_type" NOT NULL,
  	"company_name" varchar NOT NULL,
  	"tax_number" varchar,
  	"registration_number" varchar,
  	"billing_address" varchar NOT NULL,
  	"contact_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"website" varchar,
  	"message" varchar,
  	"booth_width" numeric,
  	"booth_depth" numeric,
  	"booth_area" numeric,
  	"tier" varchar,
  	"booth_badges" numeric,
  	"booth_tickets" numeric,
  	"booth_parking" numeric,
  	"booth_perks" varchar,
  	"total_net" numeric,
  	"total_vat" numeric,
  	"total_gross" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "application_logos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "application_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'admin' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"programs_id" integer,
  	"performers_id" integer,
  	"videos_id" integer,
  	"exhibitors_id" integer,
  	"faqs_id" integer,
  	"media_id" integer,
  	"subscribers_id" integer,
  	"exhibitor_applications_id" integer,
  	"application_logos_id" integer,
  	"application_documents_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_pillars_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_name" varchar DEFAULT 'Budapest Guitar Show 2027' NOT NULL,
  	"ticket_status" "enum_site_settings_ticket_status" DEFAULT 'soon' NOT NULL,
  	"ticket_url" varchar,
  	"hero_image_id" integer,
  	"next_event_video_id" varchar,
  	"next_event_image_id" integer,
  	"statement_image_id" integer,
  	"pillars_image_id" integer,
  	"contact_email" varchar DEFAULT 'info@budapestguitarshow.com',
  	"facebook_url" varchar,
  	"instagram_url" varchar,
  	"tiktok_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"date_label" varchar,
  	"venue" varchar,
  	"hero_headline" varchar NOT NULL,
  	"hero_card_label" varchar,
  	"hero_card_title" varchar,
  	"statement_heading" varchar,
  	"statement_text" varchar,
  	"pillars_text" varchar,
  	"exhibitors_heading" varchar,
  	"exhibitors_list_title" varchar,
  	"exhibitors_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exhibitor_onboarding_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "exhibitor_onboarding_stats_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "exhibitor_onboarding_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min_area" numeric NOT NULL,
  	"max_area" numeric,
  	"price_per_sqm" numeric NOT NULL,
  	"badges" numeric DEFAULT 0,
  	"tickets" numeric DEFAULT 0,
  	"parking" numeric DEFAULT 0
  );
  
  CREATE TABLE "exhibitor_onboarding_tiers_locales" (
  	"label" varchar NOT NULL,
  	"perks" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "exhibitor_onboarding_extras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"price" numeric DEFAULT 0 NOT NULL,
  	"kind" "enum_exhibitor_onboarding_extras_kind" DEFAULT 'quantity' NOT NULL,
  	"max_quantity" numeric DEFAULT 50
  );
  
  CREATE TABLE "exhibitor_onboarding_extras_locales" (
  	"label" varchar NOT NULL,
  	"unit" varchar,
  	"description" varchar,
  	"variants" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "exhibitor_onboarding" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"vat_rate" numeric DEFAULT 27 NOT NULL,
  	"min_side" numeric DEFAULT 2 NOT NULL,
  	"max_side" numeric DEFAULT 20 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "exhibitor_onboarding_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"welcome_heading" varchar,
  	"welcome_text" varchar,
  	"step_company_heading" varchar,
  	"step_company_text" varchar,
  	"step_contact_heading" varchar,
  	"step_contact_text" varchar,
  	"step_brands_heading" varchar,
  	"step_brands_text" varchar,
  	"step_booth_heading" varchar,
  	"step_booth_text" varchar,
  	"step_extras_heading" varchar,
  	"step_extras_text" varchar,
  	"step_summary_heading" varchar,
  	"step_summary_text" varchar,
  	"total_note" varchar,
  	"consent_text" varchar,
  	"success_heading" varchar,
  	"success_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "programs" ADD CONSTRAINT "programs_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_locales" ADD CONSTRAINT "programs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "performers" ADD CONSTRAINT "performers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "performers_locales" ADD CONSTRAINT "performers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."performers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_locales" ADD CONSTRAINT "videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitors" ADD CONSTRAINT "exhibitors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_applications_brands" ADD CONSTRAINT "exhibitor_applications_brands_logo_id_application_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exhibitor_applications_brands" ADD CONSTRAINT "exhibitor_applications_brands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_applications_lines" ADD CONSTRAINT "exhibitor_applications_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_applications" ADD CONSTRAINT "exhibitor_applications_contract_id_application_documents_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."application_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_performers_fk" FOREIGN KEY ("performers_id") REFERENCES "public"."performers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exhibitors_fk" FOREIGN KEY ("exhibitors_id") REFERENCES "public"."exhibitors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exhibitor_applications_fk" FOREIGN KEY ("exhibitor_applications_id") REFERENCES "public"."exhibitor_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_application_logos_fk" FOREIGN KEY ("application_logos_id") REFERENCES "public"."application_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_application_documents_fk" FOREIGN KEY ("application_documents_id") REFERENCES "public"."application_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_pillars" ADD CONSTRAINT "site_settings_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_pillars_locales" ADD CONSTRAINT "site_settings_pillars_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_next_event_image_id_media_id_fk" FOREIGN KEY ("next_event_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_statement_image_id_media_id_fk" FOREIGN KEY ("statement_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_pillars_image_id_media_id_fk" FOREIGN KEY ("pillars_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_stats" ADD CONSTRAINT "exhibitor_onboarding_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_stats_locales" ADD CONSTRAINT "exhibitor_onboarding_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_tiers" ADD CONSTRAINT "exhibitor_onboarding_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_tiers_locales" ADD CONSTRAINT "exhibitor_onboarding_tiers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_extras" ADD CONSTRAINT "exhibitor_onboarding_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_extras_locales" ADD CONSTRAINT "exhibitor_onboarding_extras_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding_extras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibitor_onboarding_locales" ADD CONSTRAINT "exhibitor_onboarding_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exhibitor_onboarding"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_image_idx" ON "programs" USING btree ("image_id");
  CREATE INDEX "programs_updated_at_idx" ON "programs" USING btree ("updated_at");
  CREATE INDEX "programs_created_at_idx" ON "programs" USING btree ("created_at");
  CREATE UNIQUE INDEX "programs_locales_locale_parent_id_unique" ON "programs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "programs_locales_parent_id_idx" ON "programs_locales" USING btree ("_parent_id");
  CREATE INDEX "performers_photo_idx" ON "performers" USING btree ("photo_id");
  CREATE INDEX "performers_updated_at_idx" ON "performers" USING btree ("updated_at");
  CREATE INDEX "performers_created_at_idx" ON "performers" USING btree ("created_at");
  CREATE UNIQUE INDEX "performers_locales_locale_parent_id_unique" ON "performers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "performers_locales_parent_id_idx" ON "performers_locales" USING btree ("_parent_id");
  CREATE INDEX "videos_thumbnail_idx" ON "videos" USING btree ("thumbnail_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_locales_locale_parent_id_unique" ON "videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "videos_locales_parent_id_idx" ON "videos_locales" USING btree ("_parent_id");
  CREATE INDEX "exhibitors_logo_idx" ON "exhibitors" USING btree ("logo_id");
  CREATE INDEX "exhibitors_updated_at_idx" ON "exhibitors" USING btree ("updated_at");
  CREATE INDEX "exhibitors_created_at_idx" ON "exhibitors" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_locales_parent_id_idx" ON "faqs_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "exhibitor_applications_brands_order_idx" ON "exhibitor_applications_brands" USING btree ("_order");
  CREATE INDEX "exhibitor_applications_brands_parent_id_idx" ON "exhibitor_applications_brands" USING btree ("_parent_id");
  CREATE INDEX "exhibitor_applications_brands_logo_idx" ON "exhibitor_applications_brands" USING btree ("logo_id");
  CREATE INDEX "exhibitor_applications_lines_order_idx" ON "exhibitor_applications_lines" USING btree ("_order");
  CREATE INDEX "exhibitor_applications_lines_parent_id_idx" ON "exhibitor_applications_lines" USING btree ("_parent_id");
  CREATE INDEX "exhibitor_applications_reference_idx" ON "exhibitor_applications" USING btree ("reference");
  CREATE INDEX "exhibitor_applications_contract_idx" ON "exhibitor_applications" USING btree ("contract_id");
  CREATE INDEX "exhibitor_applications_updated_at_idx" ON "exhibitor_applications" USING btree ("updated_at");
  CREATE INDEX "exhibitor_applications_created_at_idx" ON "exhibitor_applications" USING btree ("created_at");
  CREATE INDEX "application_logos_updated_at_idx" ON "application_logos" USING btree ("updated_at");
  CREATE INDEX "application_logos_created_at_idx" ON "application_logos" USING btree ("created_at");
  CREATE UNIQUE INDEX "application_logos_filename_idx" ON "application_logos" USING btree ("filename");
  CREATE INDEX "application_documents_updated_at_idx" ON "application_documents" USING btree ("updated_at");
  CREATE INDEX "application_documents_created_at_idx" ON "application_documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "application_documents_filename_idx" ON "application_documents" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("programs_id");
  CREATE INDEX "payload_locked_documents_rels_performers_id_idx" ON "payload_locked_documents_rels" USING btree ("performers_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_exhibitors_id_idx" ON "payload_locked_documents_rels" USING btree ("exhibitors_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_exhibitor_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("exhibitor_applications_id");
  CREATE INDEX "payload_locked_documents_rels_application_logos_id_idx" ON "payload_locked_documents_rels" USING btree ("application_logos_id");
  CREATE INDEX "payload_locked_documents_rels_application_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("application_documents_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_pillars_order_idx" ON "site_settings_pillars" USING btree ("_order");
  CREATE INDEX "site_settings_pillars_parent_id_idx" ON "site_settings_pillars" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_pillars_locales_locale_parent_id_unique" ON "site_settings_pillars_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_pillars_locales_parent_id_idx" ON "site_settings_pillars_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_image_idx" ON "site_settings" USING btree ("hero_image_id");
  CREATE INDEX "site_settings_next_event_image_idx" ON "site_settings" USING btree ("next_event_image_id");
  CREATE INDEX "site_settings_statement_image_idx" ON "site_settings" USING btree ("statement_image_id");
  CREATE INDEX "site_settings_pillars_image_idx" ON "site_settings" USING btree ("pillars_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "exhibitor_onboarding_stats_order_idx" ON "exhibitor_onboarding_stats" USING btree ("_order");
  CREATE INDEX "exhibitor_onboarding_stats_parent_id_idx" ON "exhibitor_onboarding_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "exhibitor_onboarding_stats_locales_locale_parent_id_unique" ON "exhibitor_onboarding_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exhibitor_onboarding_stats_locales_parent_id_idx" ON "exhibitor_onboarding_stats_locales" USING btree ("_parent_id");
  CREATE INDEX "exhibitor_onboarding_tiers_order_idx" ON "exhibitor_onboarding_tiers" USING btree ("_order");
  CREATE INDEX "exhibitor_onboarding_tiers_parent_id_idx" ON "exhibitor_onboarding_tiers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "exhibitor_onboarding_tiers_locales_locale_parent_id_unique" ON "exhibitor_onboarding_tiers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exhibitor_onboarding_tiers_locales_parent_id_idx" ON "exhibitor_onboarding_tiers_locales" USING btree ("_parent_id");
  CREATE INDEX "exhibitor_onboarding_extras_order_idx" ON "exhibitor_onboarding_extras" USING btree ("_order");
  CREATE INDEX "exhibitor_onboarding_extras_parent_id_idx" ON "exhibitor_onboarding_extras" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "exhibitor_onboarding_extras_locales_locale_parent_id_unique" ON "exhibitor_onboarding_extras_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exhibitor_onboarding_extras_locales_parent_id_idx" ON "exhibitor_onboarding_extras_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "exhibitor_onboarding_locales_locale_parent_id_unique" ON "exhibitor_onboarding_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exhibitor_onboarding_locales_parent_id_idx" ON "exhibitor_onboarding_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "programs" CASCADE;
  DROP TABLE "programs_locales" CASCADE;
  DROP TABLE "performers" CASCADE;
  DROP TABLE "performers_locales" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "videos_locales" CASCADE;
  DROP TABLE "exhibitors" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "exhibitor_applications_brands" CASCADE;
  DROP TABLE "exhibitor_applications_lines" CASCADE;
  DROP TABLE "exhibitor_applications" CASCADE;
  DROP TABLE "application_logos" CASCADE;
  DROP TABLE "application_documents" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_pillars" CASCADE;
  DROP TABLE "site_settings_pillars_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "exhibitor_onboarding_stats" CASCADE;
  DROP TABLE "exhibitor_onboarding_stats_locales" CASCADE;
  DROP TABLE "exhibitor_onboarding_tiers" CASCADE;
  DROP TABLE "exhibitor_onboarding_tiers_locales" CASCADE;
  DROP TABLE "exhibitor_onboarding_extras" CASCADE;
  DROP TABLE "exhibitor_onboarding_extras_locales" CASCADE;
  DROP TABLE "exhibitor_onboarding" CASCADE;
  DROP TABLE "exhibitor_onboarding_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_performers_day";
  DROP TYPE "public"."enum_subscribers_locale";
  DROP TYPE "public"."enum_exhibitor_applications_status";
  DROP TYPE "public"."enum_exhibitor_applications_locale";
  DROP TYPE "public"."enum_exhibitor_applications_applicant_type";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_site_settings_ticket_status";
  DROP TYPE "public"."enum_exhibitor_onboarding_extras_kind";`)
}
