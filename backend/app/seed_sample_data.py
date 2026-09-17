"""Seed sample demo data (customer, technicians, rate cards, bookings) for local testing.

Run with: python -m app.seed_sample_data

The technicians are spread around a center point. Override the center via env vars
to place them near you so they appear in nearby search:

    SEED_CENTER_LAT=13.0827 SEED_CENTER_LNG=80.2707 python -m app.seed_sample_data

Re-running updates existing technicians' location/profile in place (relocates them).
"""

import os

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.booking import Booking, BookingStatus
from app.models.service_category import RateCard, ServiceCategory
from app.models.technician import TechnicianProfile, VerificationStatus
from app.models.user import User, UserRole
from app.services.geo import make_point

# Center of the demo area. Defaults to Chennai; override with SEED_CENTER_LAT/LNG.
CENTER_LAT = float(os.getenv("SEED_CENTER_LAT", "13.0827"))
CENTER_LNG = float(os.getenv("SEED_CENTER_LNG", "80.2707"))

# Technicians: (name, email, lat_offset, lng_offset, primary_slug, secondary_slug,
#               years, phone, rating, rating_count, call_out, hourly, area)
TECHNICIANS = [
    ("Ravi Kumar", "ravi.kumar@example.com", 0.012, -0.008, "plumbing", "appliance-repair", 8, "+919000000001", 4.8, 34, 199.0, 349.0, "Anna Nagar"),
    ("Suresh Babu", "suresh.babu@example.com", -0.018, 0.010, "electrical", "appliance-repair", 12, "+919000000002", 4.6, 51, 249.0, 399.0, "T. Nagar"),
    ("Anitha Reddy", "anitha.reddy@example.com", 0.020, 0.015, "ac-servicing", "electrical", 5, "+919000000003", 4.9, 27, 299.0, 449.0, "Velachery"),
    ("Manoj Verma", "manoj.verma@example.com", -0.010, -0.020, "carpentry", "painting", 10, "+919000000004", 4.4, 40, 179.0, 299.0, "Adyar"),
    ("Lakshmi Iyer", "lakshmi.iyer@example.com", 0.025, -0.018, "painting", "cleaning", 6, "+919000000005", 4.7, 19, 149.0, 249.0, "Mylapore"),
    ("Farhan Ahmed", "farhan.ahmed@example.com", -0.022, 0.022, "cleaning", "pest-control", 4, "+919000000006", 4.5, 23, 129.0, 199.0, "Porur"),
    ("Deepak Nair", "deepak.nair@example.com", 0.008, 0.028, "plumbing", "ac-servicing", 9, "+919000000007", 4.8, 46, 219.0, 369.0, "OMR"),
    ("Priya Menon", "priya.menon@example.com", -0.028, -0.006, "appliance-repair", "electrical", 7, "+919000000008", 4.6, 31, 189.0, 329.0, "Guindy"),
]

CUSTOMER = ("Priya Sharma", "priya.sharma@example.com", "Besant Nagar")

DEMO_PASSWORD = "password123"


def get_or_create_user(db, *, full_name, email, role, phone=None):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        is_active=True,
        phone_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _upsert_rate_card(db, *, technician_id, category, call_out, hourly):
    if category is None:
        return
    existing = (
        db.query(RateCard)
        .filter(RateCard.technician_id == technician_id, RateCard.category_id == category.id)
        .first()
    )
    if existing is None:
        db.add(
            RateCard(
                technician_id=technician_id,
                category_id=category.id,
                call_out_fee=call_out,
                hourly_rate=hourly,
                currency="INR",
            )
        )
        db.commit()


def seed() -> None:
    db = SessionLocal()
    try:
        categories = {c.slug: c for c in db.query(ServiceCategory).all()}
        if not categories:
            print("No service categories found — run `python -m app.seed` first.")
            return

        customer_name, customer_email, c_area = CUSTOMER
        customer = get_or_create_user(
            db, full_name=customer_name, email=customer_email, role=UserRole.CUSTOMER,
            phone="+919000000100",
        )

        created = 0
        relocated = 0
        technician_profiles = []
        for (name, email, dlat, dlng, primary, secondary, years, phone,
             rating, rating_count, call_out, hourly, area) in TECHNICIANS:
            user = get_or_create_user(
                db, full_name=name, email=email, role=UserRole.TECHNICIAN, phone=phone
            )
            lat, lng = CENTER_LAT + dlat, CENTER_LNG + dlng
            bio = (
                f"Experienced {primary.replace('-', ' ')} professional with {years} years "
                f"in the field. Also handles {secondary.replace('-', ' ')} jobs. "
                f"Based in {area}, available for same-day callouts."
            )

            profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
            if profile is None:
                profile = TechnicianProfile(
                    user_id=user.id,
                    bio=bio,
                    years_experience=years,
                    verification_status=VerificationStatus.APPROVED,
                    service_radius_km=15.0,
                    location=make_point(lat, lng),
                    address_label=f"{area}",
                    avg_rating=rating,
                    rating_count=rating_count,
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
                created += 1
            else:
                # Relocate + refresh profile in place on re-seed.
                profile.location = make_point(lat, lng)
                profile.address_label = area
                profile.bio = bio
                profile.years_experience = years
                profile.avg_rating = rating
                profile.rating_count = rating_count
                profile.verification_status = VerificationStatus.APPROVED
                db.commit()
                relocated += 1

            _upsert_rate_card(db, technician_id=profile.id, category=categories.get(primary),
                              call_out=call_out, hourly=hourly)
            _upsert_rate_card(db, technician_id=profile.id, category=categories.get(secondary),
                              call_out=call_out + 50, hourly=hourly + 60)

            technician_profiles.append((profile, categories.get(primary)))

        created_bookings = 0
        if technician_profiles:
            existing_bookings = db.query(Booking).filter(Booking.customer_id == customer.id).count()
            if existing_bookings == 0:
                sample_bookings = [
                    (technician_profiles[0], "Kitchen tap is leaking, needs a new washer.", BookingStatus.REQUESTED),
                    (technician_profiles[1], "Power socket in the living room stopped working.", BookingStatus.COMPLETED),
                ]
                for (profile, category), description, status in sample_bookings:
                    if category is None:
                        continue
                    db.add(
                        Booking(
                            customer_id=customer.id,
                            technician_id=profile.id,
                            category_id=category.id,
                            status=status,
                            description=description,
                            photo_urls=[],
                            address_label=c_area,
                            location=make_point(CENTER_LAT, CENTER_LNG),
                            quoted_price=349.0 if status == BookingStatus.COMPLETED else None,
                            final_price=349.0 if status == BookingStatus.COMPLETED else None,
                        )
                    )
                    created_bookings += 1
                db.commit()

        print(
            f"Seeded {created} new / relocated {relocated} technicians around "
            f"({CENTER_LAT}, {CENTER_LNG}), 1 customer ({customer_email}), "
            f"{created_bookings} new demo bookings."
        )
        print(f"Demo login password for all seeded accounts: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
