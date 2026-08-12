# Nexus Operations Portal

A role-aware Mini ERP + CRM for wholesale operations. It includes customer CRM, product and inventory tracking, immutable stock movements, and transaction-safe sales challans.

## Architecture

`React + TypeScript` client communicates with a modular `Express + TypeScript` REST API. PostgreSQL is accessed through Prisma. Business operations live in services; controllers only coordinate HTTP concerns.

## Modules

- JWT authentication with Admin, Sales, Warehouse, and Accounts roles
- Customer management and follow-up CRM timeline
- Product, category, warehouse, inventory and stock-movement management
- Draft, confirmation and cancellation lifecycle for sales challans
- Atomic stock deduction and product snapshots on challan line items
- Responsive operational dashboard, filtering, empty/error states and protected UI routes

## Run locally

Prerequisites: Node 20+ and PostgreSQL 15+.

```bash
npm install
Copy-Item backend/.env.example backend/.env
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:5173`. API is served at `http://localhost:5000/api`.

### Database troubleshooting

This project intentionally uses PostgreSQL, as required by the case study. MongoDB is not a drop-in replacement for this Prisma schema or its transaction-safe challan workflow. Ensure PostgreSQL is running on port `5432`, then run `npm run db:migrate` and `npm run db:seed`. Docker Desktop can also start the included `docker-compose.yml` with `docker compose up -d`.

Demo users (all use `Demo@12345`): `admin@example.com`, `sales@example.com`, `warehouse@example.com`, `accounts@example.com`.

## Important rules

- Draft challans never change inventory.
- Confirmation is an atomic database transaction; it validates every item before reducing any stock.
- Every inventory change creates a stock-movement record.
- Confirmed challans preserve product name, SKU and price snapshots.

## Deployment

Deploy `frontend` to Vercel/Netlify, `backend` to Render/Railway, and use a managed PostgreSQL provider. Set `FRONTEND_URL`, `DATABASE_URL`, and a long random `JWT_SECRET` in the API environment.

## Known limitations

This starter intentionally leaves PDF export, image uploads, and invoicing as isolated future enhancements. See `backend/openapi.yaml` for the API contract.
