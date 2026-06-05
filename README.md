# OPUS Assessment

Full-stack upload processing app for validating Excel files, storing accepted records, and reviewing quarantined rows that need correction.

The project is split into a React client and an Express API. The server detects supported workbook types, maps rows into domain records, cleans and validates values, stores valid rows in PostgreSQL through Prisma, and keeps invalid rows in quarantine for review.

## Features

- Excel upload support for `.xls` and `.xlsx` files.
- Automatic file-type detection for tutor assignments, lesson logs, and invoices.
- Header detection and column mapping for structured workbooks.
- Cleaning for dates, currency values, statuses, subjects, and numeric fields.
- Validation for required fields, invalid values, duplicates, and near duplicates.
- Quarantine workflow for invalid rows with preview revalidation before final correction.
- Upload history, record browsing, pagination, and upload deletion.
- React dashboard for uploading files, viewing reports, and correcting quarantined records.

## Tech Stack

| Area       | Tools                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Client     | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Axios, Lucide React |
| Server     | Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Multer, XLSX       |
| Validation | Custom cleaning and validation services                                |
| Testing    | Node test runner with `tsx`                                            |

## Project Structure

```text
.
+-- client/
|   +-- src/api/              # API client modules
|   +-- src/components/       # Shared UI components
|   +-- src/pages/            # Main application pages
|   +-- src/routes/           # React routes
|   +-- src/store/            # Client state
+-- server/
|   +-- prisma/               # Prisma schema and migrations
|   +-- src/controllers/      # HTTP handlers
|   +-- src/routes/           # Express routes
|   +-- src/services/         # Upload, parsing, cleaning, validation, storage
|   +-- src/lib/              # Prisma client setup
|   +-- tests/                # Service-level regression tests
+-- README.md
```

## Supported File Types

### Tutor Assignments

Detected from headers such as assignment ID, tutor name, student name, subject, level, and hourly rate.

Expected mapped fields:

- `assignmentCode`
- `tutorName`
- `studentName`
- `subject`
- `level`
- `hourlyRate`
- `startDate`
- `status`
- `contactEmail`

### Invoices

Detected from headers such as invoice, invoice ID, invoice number, amount, payment status, and payment date.

Expected mapped fields:

- `invoiceNumber`
- `tutorId`
- `studentName`
- `invoiceDate`
- `amount`
- `paymentStatus`
- `paymentDate`
- `notes`

### Lesson Logs

Detected from row patterns such as `LOG-001`, `TAS-001`, attendance values, durations, and fees.

Expected mapped fields:

- `logId`
- `assignmentCode`
- `lessonDate`
- `durationHours`
- `attendance`
- `notes`
- `fee`

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database

## Environment Variables

Create `server/.env`:

```env
DATABASE_URL="neon postgres db"
PORT=5000
```

## Installation

Install dependencies in both apps:

```bash
cd server
npm install

cd ../client
npm install
```

Run the database migration:

```bash
cd server
npm run prisma:migrate
```

## Running Locally

Start the API:

```bash
cd server
npm run dev
```

Start the client in a second terminal:

```bash
cd client
npm run dev
```

Default URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`

## API Overview

### Uploads

| Method   | Route                                     | Description                                        |
| -------- | ----------------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/upload`                             | Upload an Excel file using multipart field `file`  |
| `GET`    | `/api/upload?page=1&limit=10`             | List uploaded files                                |
| `GET`    | `/api/upload/:id`                         | Get one upload                                     |
| `GET`    | `/api/upload/:id/records?page=1&limit=20` | Get accepted and quarantined records for an upload |
| `DELETE` | `/api/upload/:id`                         | Delete an upload                                   |

### Quarantine

| Method  | Route                            | Description                                                    |
| ------- | -------------------------------- | -------------------------------------------------------------- |
| `GET`   | `/api/quarantine/:id`            | Get a quarantined row and its validation errors                |
| `POST`  | `/api/quarantine/:id/revalidate` | Preview corrections without accepting the row                  |
| `PATCH` | `/api/quarantine/:id`            | Apply valid corrections and move the row into accepted records |

## Processing Flow

1. The user uploads an Excel workbook.
2. The server reads workbook rows and detects the file type.
3. Headers are located when required by the file type.
4. Rows are mapped into domain fields.
5. Data is cleaned into consistent formats.
6. Rows are validated.
7. Valid rows are stored in their record table.
8. Invalid rows are stored as quarantine rows with field-level errors.
9. Corrections are revalidated before accepted rows are inserted.

## Validation Notes

- Invoice duplicates are checked by cleaned `invoiceNumber` within the same upload.
- Lesson log duplicates use `assignmentCode` and `lessonDate`.
- Tutor assignment duplicates use `tutorName`, `studentName`, and `startDate`.
- Tutor assignments with the same identity but different rates are treated as near duplicates.
- Unknown invoice payment statuses are reported but still pass through validation when present.

## Scripts

### Server

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Start the API with `tsx watch`                |
| `npm run build`           | Generate Prisma client and compile TypeScript |
| `npm run start`           | Run the compiled API from `dist`              |
| `npm run prisma:generate` | Generate Prisma client                        |
| `npm run prisma:migrate`  | Run Prisma migrations in development          |
| `npm run prisma:studio`   | Open Prisma Studio                            |

### Client

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Vite dev server           |
| `npm run build`   | Type-check and build the client |
| `npm run lint`    | Run ESLint                      |
| `npm run preview` | Preview the built client        |

## Testing

Run service-level tests from the server directory:

```bash
cd server
node --import tsx --test tests/quarantine-correction.test.ts
node --import tsx --test tests/validation-service-refactor.test.ts
node --import tsx --test tests/lesson-log-cleaning-validation.test.ts
```

Run a production build check:

```bash
cd server
npm run build

cd ../client
npm run build
```

## Development Notes

- Uploaded files are written to `server/uploads`.
- Prisma requires `DATABASE_URL` before migrations, generation, or server startup.
- The correction preview endpoint and final patch endpoint share the same validation path, so preview results should match final acceptance behavior.
- Keep new validation rules in the service layer where they can be covered by focused tests.
