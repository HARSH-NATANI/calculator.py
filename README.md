# HireCraftCV · CloudCV

A React + TypeScript career workspace with real Supabase Auth, PostgreSQL persistence, private image storage, reusable profiles, independent documents, templates, version history and exports.

## Run the frontend

Requires Node 24+ and npm. The lockfile is committed.

```sh
npm ci
cp .env.example .env.local
# Fill in your Supabase project URL and public publishable/anon key.
npm run dev
```

Open `http://localhost:3000`. Without Supabase configuration, public pages and sample templates work; authentication is explicitly unavailable. There is no fake login or browser-only profile persistence.

## Connect a hosted Supabase project

1. Create a Supabase project. Apply **both files in `supabase/migrations/` in timestamp order** through Supabase migrations or its SQL editor.
2. Set `VITE_SUPABASE_URL` to the project HTTPS URL and `VITE_SUPABASE_ANON_KEY` to its public publishable/anon key. **Never use a service-role key in any `VITE_` variable.**
3. In Authentication → URL Configuration, set the production site URL and allow `https://YOUR_DOMAIN/dashboard` and `https://YOUR_DOMAIN/reset-password` as redirect URLs. Add corresponding local URLs only when needed for development.
4. Enable email confirmation, configure production SMTP, and set a minimum password length of 8 or stronger. Client-side registration requires a letter and a number; configure matching provider requirements.
5. Migrations create a private `profile-assets` bucket with a 5 MB limit and JPEG, PNG and WebP MIME allowlist. Do not make this bucket public.
6. Configure your hosting provider with the two public environment variables. Leave `VITE_LOCAL_DEVELOPMENT` unset in production.
7. Run `npm run build` and deploy `dist/`. `vercel.json` supplies SPA routing for Vercel; other static hosts need a fallback to `index.html`.
8. Before public launch, configure support contact details, complete the deployment-specific terms/privacy disclosures, and specify your provider’s backup-retention period.

No hosted Supabase project or production hosting deployment was supplied with this task. The sandbox preview runs against **real local Supabase services**, with data persisted in local PostgreSQL/Docker volumes. This verifies the integration but is not a claim of a deployed cloud service. Switching to hosted Supabase requires the configuration and migrations above; no application-code changes are needed.

## Local Supabase for development

Docker must be running. The Supabase CLI is a pinned development dependency.

```sh
npx supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor
npx supabase status
```

Use the local API URL and **anon/public key** in `.env.local`. This repository’s Vite server also provides `/supabase` as a same-origin proxy to `http://127.0.0.1:54321`:

```dotenv
VITE_SUPABASE_URL=/supabase
VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_PUBLIC_ANON_KEY
VITE_LOCAL_DEVELOPMENT=true
```

Verification and password-reset emails are captured by Mailpit at `http://localhost:54324`; they are not delivered to real inboxes. Auth forms link to this inbox only when `VITE_LOCAL_DEVELOPMENT=true`. PostgreSQL uses port 54322. The API uses 54321. `npx supabase stop` stops this local project without deleting its database volume; avoid `--no-backup` unless intentionally discarding development data.

### This sandbox

The prepared daemon listens on `unix:///home/vercel-sandbox/runtime/docker/docker.sock`. Run Supabase CLI commands here with:

```sh
export DOCKER_HOST=unix:///home/vercel-sandbox/runtime/docker/docker.sock
npx supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor
npm run dev
```

If the daemon must be restored, start Docker with the existing `/home/vercel-sandbox/runtime/docker/data` data root and `/home/vercel-sandbox/runtime/docker/exec` runtime root; do not reset the volume. The application `.env.local` is intentionally ignored by Git.

## What is implemented

- Email/password registration, verification, login/logout and secure recovery through Supabase Auth.
- Protected dashboard, master profile, section routes, document library, editor and settings.
- Repeatable education, skills, employment, internship, project, certification and optional records; reordering and deletion; private image upload and square crop/reposition controls.
- Sixteen template configurations using six layout families, including five portfolio options, one/two-column rendering, colors, fonts, spacing, margins and photo styles.
- Seven-step creation wizard with purposes, target role/organization, job requirements, record selection, review and cloud save.
- Independent document snapshots and field-specific overrides. Selective master synchronization keeps overrides unless explicitly replaced.
- Manual cloud saves, unsaved-change warnings, optimistic conflict detection, last-saved status and actionable errors.
- Atomic document updates with previous-state version history (last 25 saves), restoration, rename, duplication, archive and deletion.
- Reusable cloud-saved design configurations.
- PDF download, PNG/JPEG images per page, A4/Letter and resolution/page selection. Document preview and exports share the paginated renderer.
- Private print-ready portfolios. Public portfolio hosting is intentionally not implemented or advertised.
- Account preferences, JSON data export and confirmed account deletion with storage cleanup and database cascades.

## Data and security design

`profiles.data` is a structured JSONB aggregate for a single account’s personal details and ordered section records. Each record has a stable UUID. This avoids fetching numerous small tables and enables one atomic profile save. `documents.profile_snapshot` intentionally copies the selected profile data. `document_overrides` uses paths such as `education/RECORD_UUID/grade`; `design_settings` remains independent.

All user-owned tables use RLS tied to `auth.uid()`. Document writes go through `save_document`, which locks the owned row, rejects stale revisions, records the previous version and updates the document atomically. Profile content changes go through `save_profile`; only preferences may be updated directly. Version rows are readable only by their owner and cannot be inserted directly by browser clients.

Private storage paths start with the user UUID. Temporary signed URLs are used to render images and refresh periodically. Existing image objects are retained because saved snapshots may reference them; account deletion removes all owned objects before deleting the authentication account and cascading database records. Interrupted account deletion can be retried. Exported copies cannot be revoked.

The frontend uses public Supabase configuration only. The integration-test scripts use a privileged **local** test configuration and refuse non-loopback backends; those scripts are not imported into the application bundle.

## Export behavior

The renderer measures individual content blocks, lays them into A4/Letter pages and carries overflow forward. Long descriptions are split into bounded paragraphs; images have reserved heights. Two-column layouts paginate each column before moving to the next page.

- **PDF download:** high-resolution raster pages matching the preview. Text in this file is not selectable.
- **Print / selectable PDF:** uses the browser’s print engine, with text retained and print styles applied. Choose Save as PDF and the document’s paper size in the browser dialog.
- **PNG/JPEG:** individual, explicitly numbered complete pages. No long document is silently cropped into one image. Generated files are offered as download links, avoiding browser multiple-download blocking.
- Images must be available before generation succeeds. No success notification is shown until generation completes.

Use standard system fonts for portable output. Font availability can differ between devices; the actual browser layout is what is exported. Interface language is English; the app does not translate profile information or generate qualifications.

## Validation

```sh
npm test
npm run build
```

Backend integration tests require the disposable local stack:

```sh
umask 077
npx supabase status -o json > /tmp/cloudcv-local.json
CLOUDCV_LOCAL_CONFIG=/tmp/cloudcv-local.json node scripts/test-backend.mjs
rm /tmp/cloudcv-local.json
```

The backend suite exercises real registration/email confirmation, duplicate accounts, login persistence, password recovery, stale-save rejection, atomic history/restore, independent copies, storage MIME/ownership checks, cross-user/anonymous access rejection and account cascades. It creates and cleans up synthetic identities.

`scripts/prepare-ui-test.mjs` optionally creates a disposable verified local user for browser testing; its generated credentials are written privately to `/tmp/cloudcv-ui-test.json`. Delete that user after testing. It does not create a demo login in the application.

No test result should be inferred from the presence of a feature. Task-specific observed results and unverified deployment checks are recorded outside the repository in `workspace-context/validation-record.md`.

Original repository created by Harsh Natani.
