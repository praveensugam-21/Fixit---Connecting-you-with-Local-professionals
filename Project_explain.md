# FixIt — Project Explainer

## 1. What is FixIt?

FixIt is a **location-based home-repair technician marketplace**. It connects customers who need home repairs (plumbing, electrical, AC servicing, carpentry, painting, appliance repair, pest control, cleaning) with **verified, nearby technicians**.

The core value propositions the project is built around:

- **Transparent pricing** — technicians publish rate cards (call-out fee + hourly rate) and must send a quote before starting work, rather than customers being surprised by cost.
- **Map-based discovery** — customers see verified technicians near them on a map, using geolocation.
- **A defined booking lifecycle** — a booking moves through explicit states (requested → accepted → quoted → approved → in progress → completed / cancelled / disputed), enforced server-side.
- **Trust via reviews** — customers can only rate/review a technician after a booking is marked completed.

Per the README, the project is a work in progress ("6/8/26 - App modules and integration to be done").

## 2. Tech Stack

**Backend**
- Python 3.12, FastAPI 0.115, Uvicorn (ASGI server)
- SQLAlchemy 2.0 (declarative `Mapped`/`mapped_column` style) + Alembic for migrations
- PostgreSQL + PostGIS, via `psycopg` v3 and `geoalchemy2`/`shapely` for geospatial queries
- Pydantic v2 / pydantic-settings for schemas & config
- Auth: `python-jose` (JWT), `passlib`/`bcrypt` (password hashing), `google-auth` (Google OAuth)
- `python-multipart` for future file uploads
- pytest / pytest-asyncio declared as dev dependencies

**Frontend**
- React 18 + TypeScript, built with Vite
- react-router-dom v6 for routing
- axios for API calls
- Leaflet + react-leaflet for maps (OpenStreetMap tiles)
- Tailwind CSS for styling

**Infrastructure**
- Docker Compose with three services: `db` (postgis/postgis:16-3.4), `backend` (FastAPI, runs `alembic upgrade head && uvicorn --reload`), `frontend` (Vite dev server)
- No CI/CD pipeline currently configured (no `.github/workflows`)

## 3. Repository Layout

```
FIXIT/
├── README.md
├── IMPLEMENTATION _PLAN.md      (note: space before underscore in filename)
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app entrypoint, CORS, /health
│   │   ├── core/                 config.py (Settings), database.py, security.py (JWT/bcrypt)
│   │   ├── models/                SQLAlchemy ORM models
│   │   ├── schemas/                Pydantic request/response models
│   │   ├── crud/                    DB access functions per entity
│   │   ├── services/                 booking_service.py, geo.py, auth_service.py
│   │   ├── api/v1/endpoints/          auth, users, technicians, bookings, service_categories
│   │   ├── api/deps.py                get_current_user, require_roles
│   │   └── seed.py                     seeds default service categories
│   ├── alembic/                  migrations (env.py, versions/0001_initial.py)
│   ├── alembic.ini, requirements.txt, Dockerfile, .env.example
│   └── (no tests/ directory yet, despite pytest being a dependency)
└── frontend/
    └── src/
        ├── api/                client.ts (axios + token refresh), auth.ts, bookings.ts, technicians.ts, categories.ts, tokenStorage.ts
        ├── components/          common/ (BookingStatusBadge, RatingStars), layout/ (Navbar, ProtectedRoute), map/ (TechnicianMap)
        ├── context/              AuthContext.tsx
        ├── hooks/                 useGeolocation.ts
        ├── pages/                  Home, Login, Signup, TechnicianSearch, TechnicianProfile, BookingCreate, BookingDetail, CustomerDashboard, TechnicianOnboarding, TechnicianDashboard
        ├── App.tsx, main.tsx
    ├── package.json, vite.config.ts, tailwind.config.js, Dockerfile, .env.example
```

## 4. Data Model

All tables use a UUID primary key and `created_at`/`updated_at` timestamps (`UUIDPKMixin` + `TimestampMixin`).

| Model | Key fields | Notes |
|---|---|---|
| **User** | `email` (unique), `phone` (unique, nullable), `full_name`, `hashed_password` (nullable for OAuth), `google_sub` (unique, nullable), `role` (customer/technician/admin), `is_active`, `phone_verified` | 1:1 with `TechnicianProfile` |
| **TechnicianProfile** | `user_id` (FK, unique), `bio`, `years_experience`, `verification_status` (pending/approved/rejected), `id_document_url`, `service_radius_km`, `location` (PostGIS `Geography(POINT,4326)`), `address_label`, `avg_rating`, `rating_count` | Verification is a manual admin step |
| **ServiceCategory** | `name`, `slug`, `icon` | Seeded with 8 defaults (Plumbing, Electrical, AC Servicing, Carpentry, Painting, Appliance Repair, Pest Control, Cleaning) |
| **RateCard** | `technician_id`, `category_id`, `call_out_fee`, `hourly_rate`, `currency` | Per technician, per category pricing |
| **Booking** | `customer_id`, `technician_id`, `category_id`, `status` (requested/accepted/quoted/quote_approved/in_progress/completed/cancelled/disputed), `description`, `photo_urls` (array), `address_label`, `location`, `scheduled_at`, `quoted_price`, `final_price`, `cancellation_reason` | Central entity; status transitions are enforced by a state machine |
| **Review** | `booking_id` (unique 1:1), `customer_id`, `technician_id`, `rating` (1–5, check constraint), `comment` | Only creatable once booking is `COMPLETED` |
| **Message** | `booking_id`, `sender_id`, `body` | Simple threaded chat per booking |
| **Payment** | `booking_id` (unique), `provider` (default "stripe"), `provider_ref`, `amount`, `currency`, `status` (pending/authorized/captured/refunded/failed), `captured_at`, `refunded_at` | **Model + migration exist, but no CRUD/service/endpoints are wired up yet** — payments are not actually implemented |

## 5. API Surface (`/api/v1` prefix)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/google
POST   /auth/refresh

GET    /users/me

POST   /technicians/me                          (create profile, role=technician)
GET    /technicians/me
PATCH  /technicians/me
POST   /technicians/me/rate-cards
GET    /technicians/nearby?lat=&lng=&radius_km=&category_id=&limit=
GET    /technicians/{technician_id}
GET    /technicians/{technician_id}/reviews
PATCH  /technicians/{technician_id}/verification (role=admin)

POST   /bookings                                 (role=customer/admin)
GET    /bookings                                 (scoped by role)
GET    /bookings/{booking_id}
POST   /bookings/{booking_id}/quote              (role=technician/admin)
PATCH  /bookings/{booking_id}/status              (state-machine enforced)
GET    /bookings/{booking_id}/messages
POST   /bookings/{booking_id}/messages

GET    /categories

GET    /health                                    (no prefix)
```

`/payments/*` is sketched in the implementation plan but not built.

## 6. Authentication & Authorization

- **JWT-based**, `HS256`, signed with `settings.secret_key`.
  - Access token: 30 min default, carries `sub` (user id) + `role` claim.
  - Refresh token: 14 days default.
- **Login methods**: email/password (bcrypt-hashed via passlib), and Google OAuth (ID token verified server-side, auto-provisions a `customer` account on first login).
- **Request auth**: `get_current_user` dependency decodes the bearer token and loads the active user; `require_roles(*roles)` gates technician-only/admin-only endpoints (admin always bypasses).
- **Ownership checks**: e.g. in bookings, a customer can only see their own bookings, a technician only bookings assigned to them, admin sees everything.
- **Frontend**: axios interceptor attaches the bearer token to every request and transparently refreshes on a 401 (retries once, then redirects to `/login` on failure). Client-side `ProtectedRoute` also gates routes by role.

## 7. Frontend Routing

| Path | Page | Access |
|---|---|---|
| `/` | HomePage | Public |
| `/login`, `/signup` | Login / Signup | Public |
| `/search` | TechnicianSearchPage | Public |
| `/technicians/:technicianId` | TechnicianProfilePage | Public |
| `/book/:technicianId` | BookingCreatePage | customer, admin |
| `/dashboard` | CustomerDashboardPage | customer, admin |
| `/technician/onboarding` | TechnicianOnboardingPage | technician, admin |
| `/technician/dashboard` | TechnicianDashboardPage | technician, admin |
| `/bookings/:bookingId` | BookingDetailPage | any authenticated user |
| `*` | redirects to `/` | — |

## 8. Booking State Machine

Implemented in `services/booking_service.py` as a transition table mapping current status → allowed next statuses → which role may make that transition. Examples:

- `requested → accepted` (technician only)
- `quoted → quote_approved` (customer only)
- `in_progress → completed` (technician only)

Invalid transitions raise typed errors that the API layer converts to HTTP 409 (bad transition) or 403 (wrong role).

## 9. Geospatial Search

- Technician and booking locations are stored as PostGIS `Geography(POINT, 4326)` columns with GIST spatial indexes.
- Nearby search (`GET /technicians/nearby`) uses `ST_DWithin` / `ST_Distance` to filter and order technicians by distance, restricted to `verification_status = approved`, with optional category filtering via `RateCard`.
- This was a deliberate architectural decision (documented in the implementation plan) to avoid doing Haversine distance calculations in Python, which doesn't scale.

## 10. Implementation Plan (`IMPLEMENTATION _PLAN.md`)

The repo includes a design document written before/alongside the build, covering:

1. **Problem & Vision** — replacing unreliable referral/WhatsApp-group technician discovery.
2. **Author's critique of the original spec**, flagging gaps that were then designed around: a concrete definition of "verified" (phone OTP + manual admin approval for MVP), the need for a rate-card + pre-work quote approval step, missing payment flow (Stripe/Razorpay escrow-style hold-and-release), the need for real chat (not optional), separate technician vs customer UI flows, a dispute/cancellation policy, push/SMS notifications, and photo attachments at booking time.
3. **System architecture diagram** — SPA ⇄ FastAPI ⇄ PostgreSQL/PostGIS, with external integrations for OpenStreetMap, Google OAuth, Stripe/Razorpay, SMS/OTP (Twilio/MSG91), and S3-compatible storage.
4. **Core data model** — matches what's implemented (see §4 above), confirming the codebase has followed the plan closely.
5. **Phased delivery plan**:
   - **Phase 0** (setup, Docker Compose, Alembic, CI skeleton) — done, except CI.
   - **Phase 1** (auth & profiles, Google OAuth, technician rate cards, admin approval) — mostly done; document upload is only a URL field, no actual upload endpoint.
   - **Phase 2** (discovery & booking: geolocation, map, filters, request/accept/quote flow) — largely done.
   - **Phase 3** (trust layer: post-completion ratings, public profile, dispute status) — done.
   - **Phase 4** (payments & notifications: Stripe/Razorpay, SMS/email, chat) — **not implemented** (Payment model only; basic Message-based chat does exist).
   - **Phase 5** (technician growth tools: earnings dashboard, availability calendar, analytics) — not implemented.
   - **Phase 6** (hardening & launch: rate limiting, validation audit, HTTPS/CORS lockdown, load testing, fraud checks) — not implemented.
6. **Non-functional priorities** — security (short-lived JWTs, never trust client-submitted price — note: current code lets a technician set `quoted_price` directly with no separate server recompute), privacy (technician's exact address shouldn't be exposed pre-booking — not currently enforced), scalability (PostGIS index, object storage for photos).
7. **Suggested MVP cut** — auth → technician profile + manual verification → map-based search → booking request with photo → accept/quote → completion → rating; defer payments/chat/analytics.

## 11. Known Gaps / Not Yet Implemented

- **Payments**: `Payment` model and migration exist, but there's no CRUD layer, service, or `/payments/*` endpoints — no Stripe/Razorpay integration yet.
- **Testing**: pytest/pytest-asyncio are declared dependencies and the README references a `backend/tests/` directory, but no tests currently exist. No frontend test framework either (only ESLint).
- **CI/CD**: no `.github/workflows` or other CI configuration.
- **File uploads**: `id_document_url` and `photo_urls` are just URL/array fields on models — there's no actual upload endpoint/handler, despite `python-multipart`, `UPLOAD_DIR`/`MAX_UPLOAD_MB` config, and a `backend_uploads` Docker volume being provisioned for it.
- **Notifications**: no SMS/push/email notification system yet.
- **Technician growth tools**: no earnings dashboard, availability calendar, or analytics.

## 12. AI Features Roadmap (Planned)

FixIt is being extended with AI-assisted features. None of these are implemented yet — this section tracks what's planned so the direction isn't lost.

**Up first (easiest, no schema changes needed):**
- **Description → category classification** — customer types a free-text issue description on `BookingCreatePage`; a new stateless endpoint (e.g. `POST /api/v1/ai/classify-category`) sends it to an LLM along with the 8 existing `ServiceCategory` names and returns the best-fit `category_id` + confidence, pre-filling the category dropdown. Zero-shot, no training data or new tables required — the reason this is the starting point.

**Planned after that:**
- **Photo-based issue diagnosis** — vision model looks at an uploaded photo and suggests likely cause/category/urgency (depends on file upload being implemented first — currently `photo_urls` is just an unused array field).
- **AI-assisted price estimation** — suggest a fair `quoted_price` range from category + description + comparable past bookings, so customers can sanity-check a technician's quote.
- **AI-assisted technician ranking** — rank `/technicians/nearby` results by predicted fit (rating history on similar jobs, response time, completion rate), not just distance.
- **Auto-generated technician quotes** — suggest `quoted_price` to the technician based on the booking description/photos and their rate card.
- **Review/message moderation** — flag abusive `Message` content or suspicious `Review` text automatically.
- **Fraud/anomaly detection** — flag suspicious booking patterns (repeated cancellations, price manipulation) — ties into the implementation plan's Phase 6 "fraud checks."
- **AI support agent** — handle common questions/dispute intake through the existing `Message` thread instead of building separate support infra.
- **Technician demand/earnings insights** — forecast demand by category/location for the technician dashboard (ties into the plan's Phase 5 "Technician Growth Tools").

## 13. Running the Project

Via Docker Compose (`docker-compose.yml` at repo root):

```
docker compose up
```

This starts:
- `db` — Postgres 16 + PostGIS on the default Postgres port, with a health check.
- `backend` — runs `alembic upgrade head` then `uvicorn --reload`, exposing the FastAPI app (interactive docs at `/docs` when not in production).
- `frontend` — Vite dev server on port 5173.

Environment variables are configured via `backend/.env` and `frontend/.env` (see the corresponding `.env.example` files for the full list — secrets like `SECRET_KEY`, `GOOGLE_CLIENT_ID/SECRET`, and `DATABASE_URL` must be set locally and are gitignored).

Default service categories can be seeded with:

```
python -m app.seed
```

(run inside the backend container/environment).
