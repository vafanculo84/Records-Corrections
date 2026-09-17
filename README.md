# Flight School Records Correction

A full-stack Next.js application that replaces the paper **Record Correction
Sheet** with a public CFI submission, e-signature, dynamic routing, internal
approvals, server-generated PDF, Records processing, and audit trail.

The public web form and PDF layout were derived from
`RECORDS CORRECTION SHEET.xls`.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- PostgreSQL and Prisma
- React Hook Form and Zod
- `signature_pad`
- `pdf-lib`
- Nodemailer
- Signed HTTP-only session cookies with role-based server authorization

## Local setup

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`.
2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Install, migrate, and seed:

   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

4. Start the app:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000/records-correction](http://localhost:3000/records-correction).

## Seeded internal accounts

All seeded accounts use the temporary local password `ChangeMe123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Lead Instructor | `lead@example.com` |
| Assistant Chief Flight Instructor | `assistant-chief@example.com` |
| Records | `records@example.com` |

Change these credentials before using the app outside local development.

## Email behavior

`EMAIL_MODE=log` is the safe local default. It creates email log records,
generates the PDF, advances the workflow to Records, and writes the intended
message to the server log without sending externally.

To send real email, set `EMAIL_MODE=smtp` and configure the `SMTP_*` variables
in `.env`.

## Signature storage

Signatures are stored under the private, gitignored `storage/signatures`
directory with restrictive local file permissions. Replace this adapter with
private object storage (for example, S3 or Azure Blob Storage) before a
serverless deployment.

## Supporting photo storage

Public CFI submissions require at least one supporting documentation photo.
Uploaded JPG, JPEG, PNG, HEIC/HEIF, or WebP files are limited to 10 MB each and
stored under the private, gitignored `storage/attachments` directory. Attachment
metadata is saved in `request_attachments` and linked to the correction request.
Internal request detail pages can view the photos, and Records users can
download them.

## MVP acceptance criteria

- Public CFI submission requires at least one supporting documentation photo.
- CFI can upload a photo directly from iPad, phone, or computer.
- The uploaded photo is saved and associated with the correction request.
- Internal users can view the uploaded supporting photo.
- Records can download the uploaded photo.
- The original CFI electronic signature is still required.
- Lead Instructor approval requires an electronic signature.
- Assistant Chief Flight Instructor approval requires an electronic signature.
- Approval cannot be completed without the required signature.
- Final PDF includes required approval signatures.
- Audit logs show supporting photo upload and approval signatures.

## Build order notes

After building the public records correction form:

- Add required supporting documentation photo upload.
- Add photo validation, preview, storage, and database association.
- Add attachment viewing to internal request detail pages.
- Add attachment download for Records.

After building the approval detail page:

- Add signature pad to Lead/Chief approval page.
- Replace basic approve action with approve-and-sign action.
- Save approval signature to the signatures table.
- Link signature to approval record.
- Add approval signature to generated PDF.

## Main routes

- `/records-correction` — public CFI form
- `/records-correction/confirmation` — request number only
- `/login` — internal authentication
- `/dashboard` — role-aware landing page
- `/approvals` and `/approvals/[id]` — approval queue and action page
- `/records` and `/records/[id]` — master Records workflow
- `/admin/*` — users, routing, form items, and email settings

## Quality checks

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The tests cover public validation, dynamic routing, permissions, and PDF
generation.
