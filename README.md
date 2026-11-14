# MTC Store RMS

**A retail management system for a mobile phone store, replacing spreadsheets with a real-time inventory and sales platform.**

MTC Store RMS is a full-stack TypeScript web app built for my parents' phone shop. Inventory and sales used to be tracked by hand in spreadsheets. Now every phone, sale, and customer lives in one system, and the store has been using it in daily operation, with thousands of records entered so far.

> **Stack:** React 19 · TypeScript · Express · Prisma · MySQL · TanStack Query · Tailwind CSS 4

---

## Why it exists

| Before (spreadsheets) | After (MTC Store RMS) |
| --- | --- |
| Stock counted and re-typed by hand | Every phone tracked by unique IMEI with a live status |
| Profit calculated manually per sale | Profit computed server-side on every sale |
| No separation between owner and staff | Role-based access: admin vs. staff |
| End-of-month reports built by hand | Dashboard and reports generated from live data |

## Features

**Inventory**
- Track each phone by IMEI, brand, model, color, entry date, base cost, cashback, and final cost.
- Status lifecycle: `READY` → `TERJUAL` (sold) / `DIKEMBALIKAN` (returned).
- Bulk-add stock in one request, with duplicate-IMEI detection inside the batch and against the database.
- Advanced filtering, multi-column sorting, and pagination.

**Sales**
- Recording a sale and marking the phone as sold happen in a single database transaction, so stock and sales can't drift apart.
- Profit is calculated on the server: `selling price − discount − final cost`.
- Prevents selling a phone that's already sold.
- Editing or deleting a sale restores the phone to `READY`.
- Customers are matched by phone number or created on the fly during checkout.

**Stock opname (stock audit)**
- Scan or type IMEIs to tick off phones physically present in the store.
- Progress survives page reloads, and manual tick/untick requires confirmation.
- Quickly shows which phones are scanned and which are missing.

**Reports and dashboard**
- Monthly sales, profit, and units-sold summary.
- Charts, monthly finance table, brand analysis, and per-staff performance and transaction tables.
- Date-range filters.

**Access control**
- JWT authentication with bcrypt-hashed passwords.
- Two roles: `ADMIN` (full control, staff management, inventory writes) and `STAFF` (sales, customers, and read access).
- Separate admin and staff dashboards, with route guards on the client and role checks on the API.

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, React Router 7, TanStack Query 5, Tailwind CSS 4, Radix UI, Recharts, Axios |
| Backend | Node.js, Express 4, TypeScript, Zod (validation), JWT, bcrypt |
| Database | MySQL with Prisma ORM (multi-file schema) |
| Tooling | ESLint, Husky pre-commit, tsup, Vercel (client) |

## Architecture

```
┌──────────────────────┐      REST / JSON       ┌────────────────────────┐
│  React + TypeScript  │  ───────────────────▶  │  Express + TypeScript  │
│  TanStack Query      │   Bearer JWT           │  Zod · JWT · RBAC      │
└──────────────────────┘                        └───────────┬────────────┘
                                                            │ Prisma
                                                      ┌─────▼─────┐
                                                      │   MySQL   │
                                                      └───────────┘
```

**Data model**

```
User ──< Penjualan (Sale) >── InventoryHP (Phone)
                  │
                  └── Customer
```

- `InventoryHP`: IMEI (unique), brand, model, color, cost fields, `status`.
- `Penjualan`: sale date, selling price, discount, profit, payment method, notes. It links to the phone, customer, and staff member who made the sale.
- `User`: username, hashed password, `role` (`ADMIN` / `STAFF`).

## API overview

All routes are under `/api`. Everything except login requires a `Bearer` token.

| Resource | Endpoints | Access |
| --- | --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me` | Public / authenticated |
| Users | `GET/POST /auth/users`, `PATCH/DELETE /auth/users/:id`, `PATCH /auth/change-password` | Admin |
| Inventory | `GET /inventory`, `GET /inventory/:id` | Authenticated |
| | `POST /inventory`, `POST /inventory/bulk`, `PATCH/DELETE /inventory/:id` | Admin |
| Sales | `/penjualan` (list with filters, create, update, delete) | Authenticated |
| Customers | `/customers` (CRUD), `GET /customers/purchases` | Authenticated |
| Dashboard | `GET /dashboard/stats` | Authenticated |

## Project structure

```
MTCStoreRMS/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # admin/ and staff/ dashboards, login, home
│       ├── components/      # forms, route guards, report widgets, UI primitives
│       ├── hooks/           # TanStack Query hooks (queries/ and mutations/)
│       └── lib/             # API client, types, utils, query keys
└── server/                  # Express backend
    └── src/
        ├── controllers/     # Auth, Inventory, Penjualan, Customer, Dashboard
        ├── routes/          # Route definitions
        ├── middleware/      # JWT auth and role guards
        ├── models/          # Prisma schema and seeders
        └── utils/           # Zod validators, AppError, status codes
```

## Getting started

**Prerequisites:** Node.js 20+ and a MySQL database.

**1. Clone**
```bash
git clone <your-repo-url>
cd MTCStoreRMS
```

**2. Backend**
```bash
cd server
cp .env.example .env     # then fill in the values below
npm install
npx prisma migrate dev   # create the database tables
npm start                # http://localhost:8000
```

`server/.env`
```env
PORT=8000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/mtc_store"
JWT_SECRET="use-a-long-random-string"
```

**3. Frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

`client/.env`
```env
VITE_API_URL=http://localhost:8000
```

**4. Create the first admin user**

Insert a user with `role = ADMIN` and a bcrypt-hashed password, or use the seeder in `server/src/models/seed`.

## Deployment

- **Frontend:** deployed on Vercel (SPA rewrites in `client/vercel.json`).
- **Backend:** `npm run build` bundles the server with tsup. Run Prisma migrations against the production database first.

## What I learned

- Designing a data model around a real business workflow (inventory lifecycle, profit rules, returns).
- Keeping data consistent with database transactions when one action touches several tables.
- Role-based access control across both API and UI.
- Building something for real users who depend on it daily: clear UX for non-technical staff, and no data loss.

## Author

**Kezia Meilany Tandapai**
Computer Science, BINUS University · Apple Developer Academy Cohort 9
