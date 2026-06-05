# OPUS Assessment

Full-stack upload processing app for validating Excel workbooks, storing accepted rows, and quarantining rows that need correction.

## Clone to Running in Under 10 Minutes

Prerequisites:

- Node.js 20 or newer
- npm
- PostgreSQL database

Setup:

```bash
git clone <repo-url>
cd opus_assesment
npm run setup
copy .env.example server\.env
copy client\.env.example client\.env
npm --prefix server run prisma:migrate
```

Run the API:

```bash
npm run dev
```

Run the client in a second terminal:

```bash
npm run dev:client
```

Default URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`

## One-Command Checks

Run all service tests:

```bash
npm test
```

Run production build checks:

```bash
npm run build
```

Install both apps from the root:

```bash
npm run setup
```

## Environment

Root `.env.example` documents all local variables. Runtime env files are:

- `server/.env` for `DATABASE_URL` and `PORT`
- `client/.env` for `VITE_API_BASE_URL`

The server fails fast when `DATABASE_URL` is missing, so database-dependent actions do not silently continue with an invalid configuration.

## Project Structure

```text
src/              -> source code lives under server/src and client/src
tests/            -> service test suite lives under server/tests
docs/
  architecture.md
  api-reference.md
  sample-outputs/
.env.example
README.md
```

## Supported Workbooks

- Tutor assignments: assignment code, tutor, student, subject, rate, start date, status, contact email.
- Lesson logs: log ID, assignment code, lesson date, duration, attendance, notes, fee.
- Invoices: invoice number, tutor ID, student, invoice date, amount, payment status, payment date, notes.

## Validation Coverage

The test suite covers:

- Date normalization across more than six input formats.
- Duplicate detection for invoices, lesson logs, and tutor assignments.
- Required-field pass and fail cases.
- Currency stripping for `SGD`, `$`, commas, and whitespace.
- Quarantine reason codes including `REQUIRED_FIELD_MISSING`, `INVALID_DATE`, `INVALID_AMOUNT`, `INVALID_DURATION`, `INVALID_FEE`, `INVALID_RATE`, `UNKNOWN_SUBJECT`, `UNKNOWN_STATUS`, `DUPLICATE_RECORD`, and `NEAR_DUPLICATE`.

## API and Architecture Docs

- Architecture: `docs/architecture.md`
- API reference: `docs/api-reference.md`
- Sample outputs: `docs/sample-outputs/`

## Demo Video Checklist

Record a five-minute walkthrough:

1. Start API and client with the commands above.
2. Upload a tutor assignment workbook and show accepted/quarantined counts.
3. Upload a lesson log workbook and open the quarantine details.
4. Upload an invoice workbook and show duplicate/currency/date reason codes.
5. Open one report from `docs/sample-outputs/`.
6. Make one API query, for example `GET http://localhost:5000/api/upload?page=1&limit=10`.

## API Summary

Uploads:

- `POST /api/upload`
- `GET /api/upload?page=1&limit=10`
- `GET /api/upload/:id`
- `GET /api/upload/:id/records?page=1&limit=20`
- `DELETE /api/upload/:id`

Quarantine:

- `GET /api/quarantine/:id`
- `POST /api/quarantine/:id/revalidate`
- `PATCH /api/quarantine/:id`
