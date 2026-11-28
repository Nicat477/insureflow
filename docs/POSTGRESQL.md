# InsureFlow shared PostgreSQL demo storage

This migration is for fictional portfolio data only. It does not create a production insurance database or an individual authentication system. Local and hosted API instances share a single private PostgreSQL JSONB snapshot. The existing HTTP mock services remain in place. Application, claim, customer, policy, CRM, and finance changes commit in one transaction under a row lock. Existing JSON mode remains available when explicitly configured without DATABASE_URL. Do not run two independent storage modes if you expect shared data.

## Setup

1. Stop the local frontend/backend. Back up `backend/server/data.json`, `mock-crm.json`, and `mock-finance.json` if present, outside the Git repository. Use only fictional records. Any existing hosted temporary data is **not** imported by this script; if it matters, record fictional entries separately before deployment. Do not export real customer data.
2. On a dedicated Supabase project (subject to account eligibility; do not add payment details or upgrade), use the **Connect → Session pooler** PostgreSQL URI (port 5432), replacing its password placeholder with the URL-encoded database password. Download the project's SSL CA certificate from database connection/settings. Use a private local file location for that certificate. Enable SSL enforcement if available. Never use `rejectUnauthorized: false`.
3. From `backend`, run `npm install pg@8 --save-exact`. Keep `package.json` and the generated `package-lock.json` in Git. Create `backend/.env` (ignored by Git) with these values, substituting the real URI and local certificate path privately:

```dotenv
STORAGE_MODE=postgres
DATABASE_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@POOLER_HOST:5432/postgres"
DATABASE_CA_FILE="C:/path/to/supabase-ca.crt"
```

4. Run `npm run db:init` once **locally before configuring Render**. It creates a private schema/table and imports the existing three local JSON files (or the seed/empty lists if not found). It never replaces an existing cloud snapshot. If initialized already, stop and inspect the cloud data rather than overwriting it. It does not delete or edit the source JSON files.
5. Run `npm test` and `npm start`, then open `http://127.0.0.1:3001/api/health`: expect `storage: postgres`. Start the frontend in its own terminal. Test customers, claims, CRM retry, payment match and policy issuance using fictional data. `npm run db:backup` exports a private backup into `backend/.local-backups/` (Git and Docker ignored).
6. Build frontend (`pnpm run build`). Commit the code and lockfile, not `.env`, data, certificates, backup files or installer. Push after tests. On Render service Environment, set `STORAGE_MODE=postgres`, `DATABASE_URL` to the same URI, and `DATABASE_CA_FILE=/etc/secrets/supabase-ca.crt`. Add the downloaded CA as a Render Secret File named `supabase-ca.crt`. Do not use Docker ARG or bake secrets into the image. Keep existing demo authentication/readonly configuration unchanged. Deploy the tested commit. Confirm `/api/health` returns `storage: postgres` and check that fictional customers created locally appear after refreshing the live app.

## Limitations

- This is a first migration to durable PostgreSQL storage, not a normalized relational schema. Whole-workspace row locking serializes demo operations across both backend instances; it is not intended for high traffic.
- The public demo, if `PUBLIC_DEMO=1`, remains read-only apart from quote calculation. Otherwise the existing shared-password gate remains. Do not store personal or financial information in this shared database.
- Old hosted temporary records are not automatically merged. Keep backups. Free Supabase projects can pause after inactivity; no claim of indefinite retention or uptime is made.
- If a configured database is unreachable, the service fails instead of silently creating a separate dataset. A failed transaction returns an error rather than acknowledging success before commit. A network failure at COMMIT may leave the outcome uncertain; refresh and inspect before retrying a non-idempotent operation.
- The mobile theme update respects explicit Light/Dark and follows the operating system only when System is chosen. Browser-specific forced-dark accessibility features can still override site colors.

References: https://supabase.com/docs/guides/database/connecting-to-postgres ; https://supabase.com/docs/guides/platform/free-project-pausing ; https://render.com/docs/configure-environment-variables
