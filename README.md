<<<<<<< HEAD
# EcoPulse — Smart Sustainable Campus
## SVVV, Indore · MERN Stack Hackathon Project

EcoPulse is a smart campus sustainability intelligence web application for **Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore**. It monitors resource consumption, detects threshold-based water and electricity wastage anomalies, runs dynamic paperless QR attendance with device passkey/WebAuthn verification, tracks campus parking near the Main Gate, and maps botanical greenery coverage across campus Blocks A–E.

---

## 1. Technology Stack

- **Frontend:**
  - React 18 with Vite
  - JavaScript (ES Modules) & JSX
  - Tailwind CSS (customized with SVVV Forest Green & Mint palette)
  - React Router DOM v6
  - Axios with credential cookies & centralized error handling
  - Recharts for data visualizations (Area, Line, Bar, and Donut charts)
  - Lucide React for institutional UI iconography
  - React Hook Form + Zod validation
  - `qrcode.react` for dynamic SVG QR code generation
  - `html5-qrcode` for browser camera scanning
  - `@simplewebauthn/browser` for WebAuthn passkey ceremony integration
- **Backend:**
  - Node.js (ES Modules) & Express.js
  - MongoDB with Mongoose ODM
  - Zod request schema validation
  - JWT in httpOnly, SameSite cookies with CSRF/CORS protection
  - Vitest + Supertest + mongodb-memory-server test suite

---

## 2. Institutional Design & Color Palette

Faithfully matches the SVVV Campus Resource Intelligence UI layout:
- **Forest Green (`#176B45`)** & **Deep Forest Slate (`#073B2C`)**: Institutional brand identity and navigation sidebar.
- **Primary Green (`#238B57`)**: Sustainability highlights and active states.
- **Mint (`#EAF7EF`)** & **Page Background (`#F5F9F6`)**: High-contrast, clean content containers.
- **Water Blue (`#2585D8`)**: Hydro telemetry and anomaly indicators.
- **Electricity Amber (`#E5A11A`)**: Power consumption and peak load warnings.
- **Campus Architectural Silhouette**: Heritage college silhouette embedded in the sidebar footer with the motto *"Greener Today · Brighter Tomorrow"*.

---

## 3. Application Routes & Modules

| Route | Module | Key Capabilities |
| --- | --- | --- |
| `/login` | Authentication & Demo Switcher | One-click autofill for Admin, Faculty, Student, and Parking Desk demo credentials. |
| `/dashboard` | Global Overview | 5 KPI cards, multi-series Resource Usage Overview AreaChart, Quick Insights panel, Explore Modules grid, Run Demo Scenario button. |
| `/water` | Water Consumption | Daily trend (This Week vs. Last Week), Block A–E consumption bar chart, block-wise baseline comparison table, alert investigation & resolution workflows, inline "Log New Reading" bar. |
| `/electricity` | Electricity Consumption | Trend chart, Block consumption donut gauge, Peak Hour Analysis (9 AM–6 PM), energy-saving recommendations, and reading submission form. |
| `/attendance` | Paperless Attendance | Dynamic session QR code with 30-min expiry, live session countdown timer, attendance gauge (88%), camera QR scanner with fallback manual token, WebAuthn passkey ceremony or labelled simulated demo verification, CSV export, and cutoff absence enforcement. |
| `/parking` | Smart Parking | Interactive SVVV campus parking map schematic (Main Gate, P1–P5 lots), live slot grid inspector, parking summary donut gauge (68%), lot cards with map directions, and manual capacity updater. |
| `/greenery` | Greenery & Biodiversity | 72% green canopy KPI, tree count, biodiversity index, Block A–E bar chart, aerial campus schematic zoning map (High, Medium, Low), priority improvement blocks, and action tracking. |
| `/reports` | Consolidated Reports | Cross-module metrics, date range & block filters, instant CSV exports for Water, Electricity, Alerts, and Attendance datasets, and audit classification notes. |

---

## 4. Demo Accounts (Local Seed Data)

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| **Admin** | Anjali Rathore | `admin@svvv.edu` | `Admin@123` |
| **Faculty** | Dr. Mehta | `faculty@svvv.edu` | `Faculty@123` |
| **Student** | Rahul Sharma | `student@svvv.edu` | `Student@123` |
| **Parking Manager** | Parking Desk | `parking@svvv.edu` | `Parking@123` |

*The top navigation bar includes an instant demo role switcher dropdown to test different roles on the fly without manual re-login.*

---

## 5. Quickstart & Installation

### Prerequisites
- Node.js 20+
- npm
- MongoDB running locally on port 27017 (or MongoDB Atlas connection URI)

### Backend Setup
```bash
cd server
copy .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run seed              # Seeds realistic demo telemetry for Blocks A–E
npm run dev               # Starts API on http://localhost:5000
```

### Frontend Setup
```bash
cd client
copy .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev               # Starts Vite on http://localhost:5173
```

Open **http://localhost:5173** in your web browser.

---

## 6. Running Tests & Production Build

### Server Test Suite
Runs in-memory MongoDB tests verifying authentication, water & electricity anomaly triggers, WebAuthn flow, QR validation, cutoff absence assignment, and capacity validation:
```bash
cd server
npm test
```

### Client Production Build
```bash
cd client
npm run build
```

---

## 7. Security & Sustainability Methodology Notes

1. **Biometric Security:** EcoPulse never collects, uploads, or stores raw biometric or fingerprint templates. Device user verification is handled locally by the OS authenticator through `@simplewebauthn/browser`. If an authenticator is unavailable, an explicitly labelled **"Simulated Demo Verification"** mode is provided (never misrepresented as fingerprint verified).
2. **Alerts as Indications:** Telemetry alerts indicate statistical baseline deviations (possible leaks or after-hours loads), not confirmed physical infrastructure failure.
3. **Paperless Methodology:** Paper avoided is calculated as: `digital_sessions × 1_sheet_per_register`.
4. **Tariff & Cost:** Configured at ₹15/kWh for demonstration energy cost projections.
=======
# EcoSus
Sustainable Campus Management System
>>>>>>> 65cc503b7961dd84eea7c6386451c1dc01d7006c
