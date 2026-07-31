# FixIt — Home Repair Technician Marketplace
## Implementation Plan

## 1. Problem & Vision

Finding reliable technicians (plumbers, electricians, AC repair) currently depends on referrals/WhatsApp groups — leading to delays, unverified providers, and inconsistent pricing.

**FixIt** is a location-based platform connecting customers with verified nearby technicians, offering transparent pricing, easy booking, and a trust-based rating system.

### Goals
- Connect customers with verified local technicians
- Location-based matching for fast service discovery
- Easy appointment booking/scheduling
- Transparent, upfront pricing
- Trust-based rating & review system
- Help local technicians grow their business

---

## 2. Tech Stack (as specified)

| Layer | Choice |
|---|---|
| Frontend | React.js, TypeScript, Tailwind CSS, Leaflet.js, Axios, React Router DOM |
| Backend | FastAPI, SQLAlchemy, JWT Auth, OAuth 2.0 (Google), Pydantic, Uvicorn |
| Database | PostgreSQL |
| Location | Browser Geolocation API, OpenStreetMap, Leaflet.js |

This is a solid, cost-effective stack for an MVP — no Google Maps billing dependency, standard JWT auth, and a typed frontend/backend pairing (TS + Pydantic) that keeps contracts honest.

---

## 3. My Opinion — What to Add/Change for a Stronger Version

Before the plan, the things I'd push back on or add:

1. **"Verified technician" needs a real definition.** Right now it's a marketing phrase. Decide up front: ID verification, background check (via a 3rd-party API like Checkr/IDfy), proof of certification upload, or just phone+email verification for MVP. This is the trust core of the product — don't leave it vague. Recommend: MVP = phone OTP + manual admin approval of uploaded ID/certificate; defer automated background checks to v2.
2. **Transparent pricing is harder than a price field.** Repair jobs are variable (a "leaky pipe" could be a 10-min fix or a wall-opening job). Suggest: technicians publish a **rate card** (call-out fee + hourly/per-service rate) shown upfront, plus a **quote-before-work-starts** step where the technician submits a final quote after inspection that the customer must approve before billing. This avoids the classic "verbal estimate vs. surprise bill" complaint that kills trust in this category.
3. **Payments are conspicuously absent from your stack list.** A repair marketplace without in-app payment is just a directory. Add Stripe/Razorpay (India-relevant given "AC servicing" phrasing) escrow-style hold-and-release: charge on booking confirmation, release to technician on job completion, refund/dispute path for cancellations.
4. **Real-time chat is table stakes**, not a nice-to-have — customers need to describe the problem/send photos before a technician commits. Add a lightweight chat (WebSocket via FastAPI, or just a threaded-messages table for MVP).
5. **Two-sided app, two different needs.** Technicians need a job queue, availability calendar, and earnings dashboard; customers need search/book/track. Don't build one generic dashboard — plan separate UI flows from day one even if code is shared.
6. **Dispute/cancellation policy** needs to exist before launch, not be retrofitted — it's the #1 support burden in service marketplaces.
7. **Push/SMS notifications** for booking confirmations and technician arrival — email alone is too slow for "my AC broke today" urgency use cases.
8. **Photos matter.** Let customers attach photos of the issue at booking time (cheap, huge trust/accuracy improvement, avoids wasted technician trips).

None of this bloats the MVP if scoped right — see phased plan below where these are staged rather than dumped into v1.

---

## 4. System Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐
│  React + TS SPA │ ────────────────────────▶ │  FastAPI backend │
│  (Tailwind,      │ ◀──────────────────────── │  (Uvicorn, JWT)  │
│  Leaflet, Axios) │        JWT in header      │                  │
└─────────────────┘                            └────────┬─────────┘
                                                          │ SQLAlchemy ORM
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   PostgreSQL     │
                                                 │  (+ PostGIS ext) │
                                                 └──────────────────┘

External: OpenStreetMap tiles (Leaflet), Google OAuth, Stripe/Razorpay,
          SMS/OTP provider (Twilio/MSG91), S3-compatible storage (photos/docs)
```

**Key architecture decision:** enable **PostGIS** on PostgreSQL from day one. Doing "location-based matching" with plain lat/lng columns and Haversine formula in Python works for a demo but doesn't scale and makes radius/nearest-N queries painful. PostGIS gives you `ST_DWithin`/`ST_Distance` with a spatial index — cheap to add now, expensive to retrofit.

---

## 5. Data Model (core entities)

- **User** (id, email, phone, password_hash/oauth_id, role: customer|technician|admin, created_at)
- **TechnicianProfile** (user_id, categories[], bio, verification_status, id_doc_url, avg_rating, service_radius_km, location: geography(Point))
- **ServiceCategory** (id, name — plumbing, electrical, AC, etc.)
- **RateCard** (technician_id, category_id, call_out_fee, hourly_rate)
- **Booking** (id, customer_id, technician_id, category_id, status: requested|accepted|quoted|in_progress|completed|cancelled|disputed, scheduled_at, address, location, description, photo_urls[], quoted_price, final_price)
- **Review** (booking_id, customer_id, technician_id, rating 1-5, comment, created_at)
- **Message** (booking_id, sender_id, body, created_at) — for booking-thread chat
- **Payment** (booking_id, provider_ref, amount, status, held_at, released_at)

---

## 6. Phased Delivery Plan

### Phase 0 — Setup (few days)
- Monorepo: `/frontend` (Vite + React + TS + Tailwind), `/backend` (FastAPI)
- PostgreSQL + PostGIS locally via Docker Compose
- Alembic for migrations, environment config (.env, pydantic-settings)
- CI skeleton (lint + test on push)

### Phase 1 — Auth & Profiles (MVP core)
- Email/password + JWT login; Google OAuth login
- Role-based signup: customer vs technician
- Technician profile creation: categories, service area, rate card, document upload (store in S3/local for MVP)
- Admin approval flow for technician verification (simple admin-only endpoint/page is fine for v1)

### Phase 2 — Discovery & Booking
- Browser Geolocation API to get customer location
- Leaflet map showing nearby verified technicians (PostGIS radius query)
- Filter by category, rating, distance
- Booking request flow: description + photos + preferred time
- Technician accepts/declines/quotes; customer approves quote

### Phase 3 — Trust Layer
- Ratings & reviews (only after completed booking — prevents fake reviews)
- Technician public profile page with rating history
- Cancellation/dispute status on bookings

### Phase 4 — Payments & Notifications
- Stripe/Razorpay integration: authorize on booking confirm, capture on completion
- SMS/email notifications for booking lifecycle events
- In-app booking-thread chat

### Phase 5 — Technician Growth Tools
- Earnings dashboard, job history, availability calendar
- Analytics: repeat customers, response time, completion rate

### Phase 6 — Hardening & Launch
- Rate limiting, input validation audit, HTTPS/CORS lockdown
- Load test the geo-search query
- Basic fraud checks (duplicate accounts, review manipulation)

---

## 7. API Surface (high level)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/google
GET    /me

GET    /technicians/nearby?lat=&lng=&radius_km=&category=
GET    /technicians/{id}

POST   /bookings
GET    /bookings/{id}
PATCH  /bookings/{id}/status
POST   /bookings/{id}/quote
POST   /bookings/{id}/messages
GET    /bookings/{id}/messages

POST   /bookings/{id}/reviews
GET    /technicians/{id}/reviews

POST   /payments/{booking_id}/charge
POST   /payments/{booking_id}/release
```

---

## 8. Non-Functional Priorities

- **Security:** hash passwords (bcrypt/argon2), short-lived JWT + refresh token, validate all input via Pydantic, never trust client-submitted price without server-side recompute check.
- **Privacy:** don't expose exact technician home address — only service radius/approx location until a booking is confirmed.
- **Scalability path:** PostGIS index now avoids a painful migration later; keep photo storage off the DB (object storage from day one).

---

## 9. Suggested MVP Cut (what to actually ship first)

If timeline is tight, the smallest version that proves the core value prop is:
Auth (email + Google) → technician profile + manual verification → geo search on map → booking request with photo → technician accept/quote → completion → rating.

Payments, chat, and technician analytics can follow in fast-iteration releases once you have real usage data on whether people even want quote-first vs. instant-book flows.
