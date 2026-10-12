# EcoPulse API

Express + MongoDB backend. All timestamps are stored in UTC.

## Run

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Health: `GET http://localhost:5000/api/health`

## Auth

HttpOnly JWT cookie (`ecopulse_token`) plus optional `Authorization: Bearer`. CORS allows `CLIENT_ORIGIN` with credentials.

Roles: `admin`, `faculty`, `student`, `parkingManager`.

| Method | Path | Roles | Body |
| --- | --- | --- | --- |
| POST | /api/auth/login | public (rate limited) | `{ email, password }` |
| POST | /api/auth/logout | authenticated | |
| GET | /api/auth/me | authenticated | |

Invalid login always returns `401 INVALID_CREDENTIALS`.

## Dashboard and demo

| Method | Path | Roles |
| --- | --- | --- |
| GET | /api/dashboard/summary?from&to | authenticated |
| POST | /api/demo/run | admin |

Demo inserts a **simulated** high water reading for Block C and may open an anomaly alert.

## Water

Interval litres. Anomaly if `((observed - baseline) / baseline) * 100` ≥ `WATER_ANOMALY_THRESHOLD_PERCENT` and at least 3 prior samples exist.

| Method | Path | Roles |
| --- | --- | --- |
| GET | /api/water/readings | authenticated |
| POST | /api/water/readings | admin, faculty |
| GET | /api/water/alerts | authenticated |
| PATCH | /api/water/alerts/:id | admin `{ status, resolutionNotes }` |
| POST | /api/water/alerts/:id/actions | admin, faculty |

## Electricity

Same baseline pattern. Cost and CO2e use `ELECTRICITY_TARIFF_PER_KWH` and `CO2_KG_PER_KWH`.

| Method | Path | Roles |
| --- | --- | --- |
| GET | /api/electricity/readings | authenticated |
| POST | /api/electricity/readings | admin, faculty |
| GET | /api/electricity/alerts | authenticated |
| POST | /api/electricity/alerts/:id/actions | admin, faculty |

## Attendance

QR tokens are random; only SHA-256 hashes are stored. QR payload is a short-lived URL, not student data.

| Method | Path | Roles |
| --- | --- | --- |
| POST | /api/attendance/sessions | admin, faculty |
| GET | /api/attendance/sessions | authenticated |
| POST | /api/attendance/sessions/:id/qr | admin, faculty |
| POST | /api/attendance/validate-qr | authenticated `{ token }` |
| POST | /api/attendance/webauthn/authentication/options | authenticated |
| POST | /api/attendance/webauthn/authentication/verify | authenticated |
| POST | /api/attendance/sessions/:id/records | student/admin `{ token, verificationMethod }` |
| GET | /api/attendance/records | authenticated |
| POST | /api/attendance/sessions/:id/close | admin, faculty after endTime |

`verificationMethod=demo` stores `verificationStatus=simulated`. WebAuthn stores public key metadata only.

## Parking / greenery / reports

See the master contract. CSV export: `GET /api/reports/export?dataset=water|electricity|alerts|attendance`. Formula injection is escaped.

## Response shape

Success: `{ success: true, message, data }`
Error: `{ success: false, message, code, details }`
Lists: `data.items` + `data.pagination`
