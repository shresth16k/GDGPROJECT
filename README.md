# GDG × UPES Campus Event Registration & Analytics Platform

A full-stack, production-grade event registration, administration, telemetry, and reporting platform engineered for **Google Developer Groups (GDG)** at **University of Petroleum and Energy Studies (UPES)**.

Deployed on **Vercel** with **Turso (SQLite-compatible libSQL)** for persistent, serverless-ready database storage.

---

## 1. Key Features

- **Public Student Registration Portal (`/`):**
  - Instant access with zero login or student account creation requirement.
  - Dynamically configured event hero, venue, schedule, and live status.
  - Full client-side and server-side validation with Zod.
  - Strict uniqueness constraints preventing duplicate Email or SAP ID registrations even under concurrency.
  - Concurrency-safe unique registration number generator (`GDG-YYYY-XXXX`).
  - Polished confirmation screen with one-click copy and pass details.
  - Configurable public participant count indicator.

- **Admin Authentication (`/admin/login`):**
  - Secure single-administrator access authenticated against `ADMIN_PASSWORD_HASH` using **bcrypt (cost factor 12)**.
  - Cryptographically signed HTTP-only, SameSite sessions managed via **Iron Session**.
  - Login rate-limiting and brute-force protection with automatic IP window tracking.
  - No demo credentials, no client-side password verification, and no hardcoded secrets.

- **Admin Dashboard (`/admin`):**
  - Premium editorial interface in **Midnight Plum (`#21172E`)**, **Warm Ivory (`#F4EFE7`)**, **Coral (`#E8755D`)**, **Muted Teal (`#4F9990`)**, and **Lavender (`#9B87C9`)**.
  - Visually prominent metrics: **Registered Students** and **Total Link Clicks**.
  - Live background polling (every 8s with automatic pause on inactive tab).
  - Quick student profile modal with copyable SAP ID and registration number.

- **Student Registration Management (`/admin/registrations`):**
  - Real-time search by Name, Email, SAP ID, and Registration Number.
  - Server-side sorting, status filters (`confirmed`, `pending`, `cancelled`), and pagination.
  - Interactive student detail slide-over with status updates and record deletion.

- **Real Excel Export (`/api/admin/export`):**
  - Built with **ExcelJS** producing authentic `.xlsx` spreadsheets (not disguised CSVs).
  - **Sheet 1: Student Registrations:** Formatted table with Plum headers, frozen top row, auto-filters, formatted IST timestamps, and **dynamic columns for all custom questions**.
  - **Sheet 2: Event Summary:** Event identity, total registrations, link clicks, page visits, and export generation timestamp.

- **First-Party Interaction Telemetry (`/admin/analytics`):**
  - Granular event tracking: `page_view`, `link_click`, `button_click`, `registration_form_start`, `registration_attempt`, `registration_success`, `registration_error`.
  - Link clicks and button clicks are measured and visualized separately.
  - Timeframe filtering: Today, Last 7 Days, Last 30 Days, All Time.
  - Responsive charts built with **Recharts** (visitor trends & registration growth).

- **Dynamic Event Settings (`/admin/settings`):**
  - Update event title, description, date, time, venue, and campus without code changes.
  - Toggle registration status (`open`, `closed`, `pending`) and capacity limit.
  - Customize hosted logo URLs (GDG and UPES transparent logos).
  - Dynamic Form Field Builder: Add custom questions (text, textarea, dropdown, email, phone) that automatically render on the public form and export to Excel.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Node.js runtime) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (Custom design tokens & fonts) |
| Database | **Turso** (SQLite-compatible libSQL) via `@libsql/client` |
| Authentication | **Iron Session** + **bcryptjs** |
| Validation | **Zod** + **React Hook Form** |
| Excel Generation | **ExcelJS** |
| Analytics & Charts | First-party telemetry + **Recharts** |
| Icons & Visuals | **Lucide React** + Transparent Brand Assets |

---

## 3. Project Structure

```text
gdg/
├── app/
│   ├── page.tsx                           # Public student event landing & registration
│   ├── layout.tsx                         # Root layout with fonts & metadata
│   ├── globals.css                        # Design tokens, typography & animations
│   ├── admin/
│   │   ├── page.tsx                       # Admin dashboard overview with live polling
│   │   ├── layout.tsx                     # Admin layout
│   │   ├── login/page.tsx                 # Secure administrator authentication
│   │   ├── registrations/page.tsx         # Searchable, filterable student records
│   │   ├── analytics/page.tsx             # Link clicks, button clicks & chart telemetry
│   │   └── settings/page.tsx              # Event settings & custom field builder
│   └── api/
│       ├── event/route.ts                 # Public event configuration
│       ├── event/stats/route.ts           # Public participant counter
│       ├── registrations/route.ts         # Student submission & uniqueness checks
│       ├── analytics/route.ts             # Telemetry collection endpoint
│       └── admin/
│           ├── login/route.ts             # Admin login & session generation
│           ├── logout/route.ts            # Admin session termination
│           ├── session/route.ts           # Admin session check
│           ├── dashboard/route.ts         # Overview stats & recent registrations
│           ├── registrations/route.ts     # Paginated registration search
│           ├── registrations/[id]/route.ts# Individual student operations
│           ├── analytics/route.ts         # Analytics aggregation & date filter
│           ├── export/route.ts            # Excel (.xlsx) workbook generator
│           └── settings/route.ts          # Event settings CRUD
├── components/
│   ├── public/
│   │   ├── PublicHeader.tsx               # Transparent UPES & GDG logos header
│   │   ├── HeroSection.tsx                # Editorial hero with event details
│   │   ├── RegistrationSection.tsx        # Responsive registration form & confirmation
│   │   └── PublicFooter.tsx               # University & GDG branding footer
│   └── admin/
│       └── AdminNav.tsx                   # Light editorial admin navigation bar
├── database/
│   └── schema.sql                         # Full SQL schema for Turso/SQLite
├── lib/
│   ├── db.ts                              # Turso libSQL client & auto-migration
│   ├── session.ts                         # Iron-session configuration & helpers
│   ├── auth.ts                            # Bcrypt password verification & audit log
│   ├── validation.ts                      # Zod validation schemas
│   ├── rate-limit.ts                      # Persistent rate-limiting engine
│   ├── registration.ts                    # Concurrency-safe reg number sequence
│   └── analytics.ts                       # Telemetry recorder
├── public/
│   └── logos/
│       ├── gdg-logo.png                   # Transparent background GDG logo
│       └── upes-logo.png                  # Transparent background UPES logo
├── scripts/
│   ├── init-db.mjs                        # Database schema & default data setup
│   ├── generate-admin-hash.mjs            # CLI utility to generate admin bcrypt hash
│   └── verify-platform.mjs                # Verification test suite
├── .env.example                           # Documented environment variables template
├── .env.local                             # Local development environment configuration
└── package.json
```

---

## 4. Setup & Local Development

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd gdg
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your parameters:
```env
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=
ADMIN_PASSWORD_HASH="$2b$12$wadhBS0UmN7egKB.O8WsVupUv1FbJoGTupm73Gw15kow9j/c.OZya"
SESSION_SECRET="gdg_upes_session_secret_at_least_32_characters_long_super_secure_2026!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPES_EMAIL_DOMAINS=""
```
*(Default admin password for testing is `Admin@GDG2026!`)*

### 3. Generate a Custom Admin Password Hash
To set your own secure password, run:
```bash
node scripts/generate-admin-hash.mjs "YourSuperStrongPassword123!"
```
Copy the printed `ADMIN_PASSWORD_HASH` into your `.env.local`.

### 4. Initialize Database Schema
```bash
node scripts/init-db.mjs
```

### 5. Run Platform Verification Suite
```bash
node scripts/verify-platform.mjs
```

### 6. Start Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the public registration portal and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

---

## 5. Turso Database Setup (Production)

Turso provides distributed, persistent SQLite-compatible databases ideal for Vercel serverless environments:

1. **Install Turso CLI:**
   ```bash
   # Windows (PowerShell)
   irm https://get.tur.so | iex

   # macOS / Linux
   curl -sSfL https://get.tur.so | sh
   ```
2. **Sign up / Log in:**
   ```bash
   turso auth signup  # or turso auth login
   ```
3. **Create Database:**
   ```bash
   turso db create gdg-upes-events
   ```
4. **Retrieve Database URL & Authentication Token:**
   ```bash
   turso db show gdg-upes-events --url
   # Output: libsql://gdg-upes-events-[user].turso.io

   turso db tokens create gdg-upes-events
   # Output: your_auth_token
   ```
5. **Apply Database Schema to Turso:**
   ```bash
   turso db shell gdg-upes-events < database/schema.sql
   ```

---

## 6. Vercel Deployment Instructions

1. **Push your code to GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete GDG x UPES event platform"
   git branch -M main
   git remote add origin <your-git-remote-url>
   git push -u origin main
   ```
2. **Import Project into Vercel:**
   - Log into [Vercel](https://vercel.com).
   - Click **Add New...** -> **Project**.
   - Select your repository.
3. **Configure Environment Variables in Vercel:**
   Add the following variables in **Settings > Environment Variables**:
   - `TURSO_DATABASE_URL`: `libsql://gdg-upes-events-[user].turso.io`
   - `TURSO_AUTH_TOKEN`: `<your-turso-auth-token>`
   - `ADMIN_PASSWORD_HASH`: `<your-generated-bcrypt-hash>`
   - `SESSION_SECRET`: `<random-64-character-hex-string>`
   - `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
   - `UPES_EMAIL_DOMAINS`: `ddn.upes.ac.in,upes.ac.in` (optional)
4. **Deploy:**
   - Click **Deploy**.
   - Vercel will build and deploy the application.
   - All registrations and analytics will persist directly in your Turso cloud database across deployments.

---

## 7. Security Architecture

- **No Public Admin Registration:** No registration endpoints exist for administrators.
- **Argon2 / Bcrypt Password Hashing:** Constant-time hash verification protects against timing attacks.
- **HTTP-Only, SameSite Cookies:** Sessions cannot be accessed via client JavaScript (XSS mitigation).
- **Independent Endpoint Session Validation:** Every administrative API route independently enforces session authenticity.
- **SQL Injection Immunization:** All queries use parameterized statements (`sql` and `args`).
- **Distributed NAT-Friendly Rate Limiting:** Persistent sliding-window rate limiting prevents automated credential attacks and registration flooding.
