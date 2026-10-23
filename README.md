# HOPFAN Library

A responsive library management application for House of Prayer for All Nations (HOPFAN). It provides an administrator-only dashboard for managing the catalogue, members, loans, fines, notifications, and reader feedback.

## Features

- Dashboard totals for books, members, active and overdue loans, unpaid fines, and recent loans
- Book catalogue with copy availability, categories, ISBNs, descriptions, and cover URLs
- Member records with generated member codes, contact details, next-of-kin details, birthdays, and active status
- Loan workflows for borrowing, returning, renewing, recording lost books, and tracking overdue fines
- Brevo SMTP email for loan confirmations, reminders, overdue notices, return confirmations, welcome messages, and feedback requests
- Daily server-side processing for due-soon and overdue notifications, plus manual notification actions in the dashboard
- Token-based public book-feedback forms and an authenticated feedback overview
- Responsive desktop sidebar and mobile navigation

WhatsApp notification code is present but deliberately disabled. The application does not currently send SMS or WhatsApp messages.

## Screenshots

Screenshots have not been committed yet. Add sanitized images without member, credential, or production data at these locations:

| View | Placeholder path |
| --- | --- |
| Login | `docs/screenshots/login.png` |
| Dashboard | `docs/screenshots/dashboard.png` |
| Books | `docs/screenshots/books.png` |
| Members | `docs/screenshots/members.png` |
| Loans | `docs/screenshots/loans.png` |
| Notifications | `docs/screenshots/notifications.png` |
| Feedback | `docs/screenshots/feedback.png` |

## Architecture

| Layer | Implementation |
| --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4 |
| UI and APIs | Pages under `app/`; Route Handlers under `app/api/` |
| Authentication | Auth.js / NextAuth v5 Credentials provider with bcrypt password verification and JWT sessions |
| Route protection | Next.js 16 `proxy.ts` performs optimistic session checks; administrative Route Handlers also call `auth()` before accessing data |
| Data | Prisma 7 with `@prisma/adapter-better-sqlite3` and SQLite |
| Notifications | Nodemailer through Brevo SMTP; a Node.js cron job runs daily at 08:00 server time |

The login page submits an email and password to the Credentials provider. The provider normalizes the email, finds the administrator in SQLite, and compares the supplied password with its bcrypt hash. Auth.js stores the authenticated session as a signed JWT. There is no public sign-up flow, multi-factor authentication, or role-based authorization.

Most pages and APIs require an authenticated session. `/api/auth/*`, the reader feedback page at `/feedback/[token]`, and its token API at `/api/feedback/[token]` are public by design. Feedback tokens must therefore be treated as private links. Administrative feedback listing and request endpoints perform their own session checks.

## Requirements

- Node.js 20.9 or newer
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`.

3. Replace the placeholders in `.env`. Generate a unique Auth.js secret instead of reusing the example text:

   ```bash
   openssl rand -base64 32
   ```

4. Apply the committed database migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Seed an administrator:

   ```bash
   npm run db:seed
   ```

   The seed requires `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The password must be at least 12 characters and must not be an example placeholder. Missing or invalid values stop the command before the database is opened. Rerunning the seed for the same normalized email intentionally replaces that account's name and password hash; it never silently preserves an earlier password. Using a different email creates another administrator and does not delete existing accounts.

6. Start the development server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> and sign in with the administrator values you supplied when seeding.

## Environment variables

Keep real values in `.env` or your deployment platform's secret store. `.env.example` contains only local defaults and replaceable placeholders.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite connection URL, such as the local path shown in `.env.example` |
| `AUTH_SECRET` | Yes | Unique random secret used by Auth.js to sign/encrypt session data |
| `NEXTAUTH_SECRET` | Compatibility only | Legacy fallback read by the current auth configuration when `AUTH_SECRET` is absent; prefer `AUTH_SECRET` |
| `NEXTAUTH_URL` | Yes for generated feedback links | Public application origin used when building feedback URLs |
| `ADMIN_NAME` | Seed only | Administrator display name |
| `ADMIN_EMAIL` | Seed only | Administrator login email; normalized to lowercase |
| `ADMIN_PASSWORD` | Seed only | Administrator password; hashed with bcrypt and never stored as plaintext |
| `BREVO_SMTP_USER` | For email | Brevo SMTP username |
| `BREVO_SMTP_KEY` | For email | Brevo SMTP key |
| `EMAIL_FROM` | For email | Verified sender name and address |
| `FINE_PER_DAY` | No | Daily overdue fine; defaults to `5` in the application |
| `WHATSAPP_PHONE_NUMBER_ID` | Not currently used | Reserved for the disabled WhatsApp implementation |
| `WHATSAPP_ACCESS_TOKEN` | Not currently used | Reserved for the disabled WhatsApp implementation |

Do not prefix secrets with `NEXT_PUBLIC_`; Next.js exposes variables with that prefix to browser bundles.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm start` | Start the production server after a build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Prisma schema directly to the configured database |
| `npm run db:seed` | Create or update the configured administrator |
| `npx prisma migrate deploy` | Apply committed migrations |

## Testing and verification

There is currently no automated test suite or `npm test` script. Before submitting a change, run:

```bash
npm run lint
npm run build
```

Then perform these manual checks against a disposable local database:

1. Run the seed without one of the required `ADMIN_*` variables and confirm it exits non-zero without creating or changing a database.
2. Seed with valid values, sign in, and confirm that an incorrect password is rejected.
3. Rerun the seed for the same email with a new password; confirm the old password is rejected and the new password succeeds.
4. Verify create, update, and delete operations for a disposable book and member.
5. Exercise borrow, renew, return, lost-book, fine, notification, and feedback flows using non-production data.
6. Confirm unauthenticated administrative page/API requests are rejected, while a valid unused feedback-token link remains accessible.

Never point destructive manual checks, `db:push`, or seed experiments at a production database.

## Project structure

```text
app/
  api/                    Route Handlers for auth and library operations
  dashboard/              Authenticated administrator interface
  feedback/[token]/       Public reader feedback form
  login/                  Credentials login page
lib/
  auth.ts                 Auth.js configuration
  cron.ts                 Due and overdue processing
  notifications.ts        Email templates and delivery helpers
  prisma.ts               Prisma client singleton
  utils.ts                Fine and member-code helpers
prisma/
  migrations/             SQLite schema migrations
  schema.prisma           Data model
  seed.ts                 Environment-driven administrator seed
proxy.ts                  Next.js 16 optimistic route protection
instrumentation.ts        Daily notification scheduler registration
```

## Production notes

- Supply environment variables through the hosting platform; do not copy a real `.env` into an image or commit it.
- Use a unique `AUTH_SECRET` and administrator password for each environment.
- Apply migrations with `npx prisma migrate deploy` rather than `db:push`.
- Back up the SQLite database and its associated WAL files consistently before maintenance.
- The in-process notification schedule uses the server's timezone and requires a continuously running Node.js instance.
