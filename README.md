# FixIt — Home Repair Technician Marketplace

Location-based platform connecting customers with verified nearby technicians (plumbing, electrical, AC servicing) with transparent pricing, appointment booking, and a trust-based rating system.

See [IMPLEMENTATION _PLAN.md](./IMPLEMENTATION%20_PLAN.md) for the product plan and architecture rationale.

## Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Leaflet.js, Axios, React Router DOM (Vite)
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, JWT auth, Google OAuth 2.0, Pydantic v2
- **Database**: PostgreSQL + PostGIS (geo-spatial technician search)

## Project layout

```
FIXIT/
├── backend/            FastAPI application (modular, layered)
│   ├── app/
│   │   ├── core/        config, security, db session
│   │   ├── models/      SQLAlchemy ORM models
│   │   ├── schemas/     Pydantic request/response models
│   │   ├── crud/        DB access layer (no business logic in routes)
│   │   ├── services/    business logic (geo search, auth, etc.)
│   │   └── api/v1/      versioned route handlers
│   ├── alembic/          DB migrations
│   └── tests/
├── frontend/            React + TypeScript SPA
│   └── src/
│       ├── api/          typed API client wrappers
│       ├── components/   reusable UI
│       ├── pages/        route-level views
│       ├── context/       auth/global state
│       ├── hooks/
│       └── types/
└── docker-compose.yml   local dev: postgres+postgis, backend, frontend
```

## Running locally with Docker (recommended)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:5173
- Postgres: localhost:5432

## Running without Docker

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # then point DATABASE_URL at your own Postgres
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Security notes

- Passwords hashed with bcrypt (passlib); JWT access + refresh tokens.
- All input validated at the API boundary via Pydantic schemas — never trust client-submitted price/quote values without server-side checks.
- CORS is locked to `FRONTEND_ORIGIN` from env config, not wildcard.
- Secrets (`SECRET_KEY`, DB creds, OAuth client secret) live only in `.env` files, never committed (`.gitignore`'d).
