# Environment and Local Development

## 1. Prerequisites

-   Node.js LTS compatible with the selected Next.js release.
-   npm.
-   PostgreSQL local instance or Docker.
-   Git.
-   A code editor.

Verify exact framework and library versions before installation. The
versions in the project brief are target versions, not a guarantee that
they are published or mutually compatible.

## 2. Setup

``` bash
git clone <your-repository-url>
cd mess-manager
npm install
cp .env.example .env.local
# Create the local PostgreSQL database and update DATABASE_URL.
npm run db:migrate
npm run dev
```

Add scripts to `package.json` as the implementation is created: `dev`,
`build`, `start`, `lint`, `test`, `db:migrate`, `db:status` and
optionally `db:seed`.

## 3. Environment variables

Example names; implement only providers actually selected:

``` dotenv
NODE_ENV=development
APP_URL=http://localhost:3000
APP_NAME=Mess Manager
DEFAULT_TIMEZONE=Asia/Dhaka
DEFAULT_CURRENCY=BDT

DATABASE_URL=postgresql://postgres:password@localhost:5432/mess_manager
DATABASE_POOL_MAX=5

BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000

# Optional private receipt storage
BLOB_READ_WRITE_TOKEN=

# Optional email provider
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=

# Optional SMS/OTP provider
SMS_PROVIDER_API_KEY=
SMS_SENDER_ID=

# Optional monitoring
SENTRY_DSN=
```

Do not commit `.env.local`. Provide a safe `.env.example` with blank
placeholders only. Validate required variables at startup with Zod.

## 4. Secret handling

-   Generate auth secrets with a cryptographically secure random
    generator.
-   Use separate credentials for local, preview and production.
-   Rotate any secret that is accidentally committed.
-   Never expose database URLs, auth secrets or storage tokens through
    client-side variables.
-   In Vercel, configure secrets in project environment settings.

## 5. Database

Use a local database for development and a separate database for tests.
Never run destructive test cleanup against production. Apply migrations
through the migration runner, not ad-hoc manual SQL.

## 6. Useful commands

``` bash
npm run dev
npm run lint
npm test
npm run build
npm run db:migrate
npm run db:status
```

The exact script names must match `package.json`; this document defines
the intended interface.
