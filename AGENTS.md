# Base44 Development Notes

## Application

This repository contains the Flight School Records Correction application. It is a Next.js application backed by PostgreSQL through Prisma.

## Base44 preview

Start the complete development environment with:

```bash
docker compose -f docker-compose.base44.yml up -d
```

The compose project starts PostgreSQL, runs a one-shot setup service that installs dependencies, generates the Prisma client, applies migrations, and seeds development data, then starts the Next.js development server on port 3000.

Open `/records-correction` for the public form and `/login` for the internal workflow.

## Development safety

- `.env.base44-defaults` contains development placeholders only.
- Put real credentials in Base44 Secrets; never commit them.
- Local uploads and signatures under `storage/` are private runtime data and must remain untracked.
- The seeded accounts and password are for isolated development only.
- Preserve the role checks, audit trail, approval signatures, attachment authorization, and server-side validation when changing workflows.

## Verification

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

For the Base44 environment, verify the public route after startup:

```bash
curl -sL -o /dev/null -w "%{http_code}" http://localhost:3000/records-correction
```

The expected response is `200`.
