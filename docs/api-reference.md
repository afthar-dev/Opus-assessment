# API Reference

Base URL: `http://localhost:5000/api`

## Uploads

### `POST /upload`

Uploads and processes an Excel workbook.

Input: `multipart/form-data` with field `file` containing a `.xls` or `.xlsx` workbook.

Success `201`:

```json
{
  "success": true,
  "data": {
    "uploadId": "5f3c2d5a-4f63-4f83-8a6f-f1f66b21b111",
    "report": {
      "fileType": "INVOICE",
      "totalRows": 4,
      "validRows": 1,
      "invalidRows": 3
    }
  }
}
```

Error `400`:

```json
{
  "success": false,
  "message": "No file uploaded"
}
```

### `GET /upload?page=1&limit=10`

Lists uploaded files in reverse upload order.

Input: optional query params `page` and `limit`.

Success `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "5f3c2d5a-4f63-4f83-8a6f-f1f66b21b111",
      "fileName": "sample-invoices.xlsx",
      "fileType": "INVOICE",
      "status": "PARTIAL_SUCCESS",
      "totalRows": 4,
      "acceptedRows": 1,
      "quarantinedRows": 3
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Error `500`:

```json
{
  "success": false,
  "message": "Failed to get uploaded files"
}
```

### `GET /upload/:id`

Gets one upload with its processing report and quarantine rows.

Input: path param `id`.

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "5f3c2d5a-4f63-4f83-8a6f-f1f66b21b111",
    "fileName": "sample-invoices.xlsx",
    "fileType": "INVOICE",
    "status": "PARTIAL_SUCCESS",
    "report": {
      "totalRows": 4,
      "acceptedRows": 1,
      "quarantinedRows": 3
    },
    "quarantineRows": [
      {
        "id": "qrow-1",
        "rowNumber": 3,
        "status": "PENDING",
        "errors": [
          {
            "code": "INVALID_AMOUNT",
            "field": "amount",
            "rawValue": "abc",
            "message": "Invalid amount"
          }
        ]
      }
    ]
  }
}
```

Error `500`:

```json
{
  "success": false,
  "message": "Failed to get file"
}
```

### `GET /upload/:id/records?page=1&limit=20`

Gets accepted records for one upload.

Input: path param `id`; optional query params `page` and `limit`.

Success `200`:

```json
{
  "success": true,
  "data": {
    "fileType": "INVOICE",
    "records": [
      {
        "invoiceNumber": "INV-100",
        "invoiceDate": "2026-04-01T00:00:00.000Z",
        "amount": "150",
        "paymentStatus": "PAID"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

Error `500`:

```json
{
  "success": false,
  "message": "Upload not found"
}
```

### `DELETE /upload/:id`

Deletes an upload and cascades related records.

Input: path param `id`.

Success `200`:

```json
{
  "success": true,
  "message": "Upload deleted successfully"
}
```

Error `500`:

```json
{
  "success": false,
  "message": "Failed to delete upload"
}
```

## Quarantine

### `GET /quarantine/:id`

Gets one quarantined row with its errors and upload metadata.

Input: path param `id`.

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "qrow-1",
    "rowNumber": 3,
    "status": "PENDING",
    "rawData": {
      "invoiceNumber": "INV-300",
      "invoiceDate": "2026-04-03",
      "amount": null
    },
    "errors": [
      {
        "code": "INVALID_AMOUNT",
        "field": "amount",
        "rawValue": "abc",
        "message": "Invalid amount"
      }
    ]
  }
}
```

Error `404`:

```json
{
  "success": false,
  "message": "Quarantine row not found"
}
```

### `POST /quarantine/:id/revalidate`

Previews corrections without accepting the row.

Input:

```json
{
  "corrections": {
    "amount": "250.00",
    "paymentStatus": "paid"
  }
}
```

Success `200`:

```json
{
  "isValid": true,
  "cleanedData": {
    "invoiceNumber": "INV-300",
    "invoiceDate": "2026-04-03",
    "amount": 250,
    "paymentStatus": "PAID"
  },
  "errors": []
}
```

Error `404`:

```json
{
  "success": false,
  "message": "Quarantine row not found"
}
```

### `PATCH /quarantine/:id`

Applies valid corrections, inserts the accepted record, and marks the quarantine row as reprocessed.

Input:

```json
{
  "corrections": {
    "amount": "250.00",
    "paymentStatus": "paid"
  }
}
```

Success `200`:

```json
{
  "processed": true
}
```

Validation error `200`:

```json
{
  "processed": false,
  "errors": [
    {
      "code": "INVALID_AMOUNT",
      "field": "amount",
      "value": "abc",
      "message": "Invalid amount"
    }
  ]
}
```

Conflict `409`:

```json
{
  "success": false,
  "message": "Only pending quarantine rows can be corrected"
}
```
