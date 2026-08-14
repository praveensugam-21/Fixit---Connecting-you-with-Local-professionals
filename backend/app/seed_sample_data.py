"""Seed sample demo data (customer, technicians, rate cards, bookings) for local testing.

Run with: python -m app.seed_sample_data
"""

import uuid

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.booking import Booking, BookingStatus
from app.models.service_category import RateCard, ServiceCategory
from app.models.technician import TechnicianProfile, VerificationStatus
from app.models.user import User, UserRole
from app.services.geo import make_point

# Bangalore-area coordinates, spread within ~10km for nearby search demo purposes.
TECHNICIANS = [
    ("Ravi Kumar", "ravi.kumar@example.com", 12.9716, 77.5946, "plumbing", 8, "Koramangala, Bangalore"),
    ("Suresh Babu", "suresh.babu@example.com", 12.9352, 77.6245, "electrical", 12, "HSR Layout, Bangalore"),
    ("Anitha Reddy", "anitha.reddy@example.com", 12.9784, 77.6408, "ac-servicing", 5, "Indiranagar, Bangalore"),
    ("Manoj Verma", "manoj.verma@example.com", 12.9165, 77.6101, "carpentry", 10, "BTM Layout, Bangalore"),
    ("Lakshmi Iyer", "lakshmi.iyer@example.com", 12.9698, 77.7500, "painting", 6, "Whitefield, Bangalore"),
    ("Farhan Ahmed", "farhan.ahmed@example.com", 13.0067, 77.5667, "cleaning", 4, "Malleshwaram, Bangalore"),
]

CUSTOMER = ("Priya Sharma", "priya.sharma@example.com", 12.9611, 77.6387, "Domlur, Bangalore")

DEMO_PASSWORD = "password123"


def get_or_create_user(db, *, full_name, email, role):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        is_active=True,
        phone_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed() -> None:
    db = SessionLocal()
    try:
        categories = {c.slug: c for c in db.query(ServiceCategory).all()}
        if not categories:
            print("No service categories found — run `python -m app.seed` first.")
            return

        customer_name, customer_email, c_lat, c_lng, c_address = CUSTOMER
        customer = get_or_create_user(db, full_name=customer_name, email=customer_email, role=UserRole.CUSTOMER)

        created_technicians = 0
        technician_profiles = []
        for name, email, lat, lng, slug, years, address in TECHNICIANS:
            user = get_or_create_user(db, full_name=name, email=email, role=UserRole.TECHNICIAN)

            profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
            if profile is None:
                profile = TechnicianProfile(
                    user_id=user.id,
                    bio=f"Experienced {slug.replace('-', ' ')} professional serving the local area.",
                    years_experience=years,
                    verification_status=VerificationStatus.APPROVED,
                    service_radius_km=15.0,
                    location=make_point(lat, lng),
                    address_label=address,
                    avg_rating=4.5,
                    rating_count=12,
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
                created_technicians += 1

            category = categories.get(slug)
            if category:
                existing_rate_card = (
                    db.query(RateCard)
                    .filter(RateCard.technician_id == profile.id, RateCard.category_id == category.id)
                    .first()
                )
                if existing_rate_card is None:
                    db.add(
                        RateCard(
                            technician_id=profile.id,
                            category_id=category.id,
                            call_out_fee=199.0,
                            hourly_rate=349.0,
                            currency="INR",
                        )
                    )
                    db.commit()

            technician_profiles.append((profile, category))

        # A couple of demo bookings so BookingDetail/Dashboard pages have content.
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
                    booking = Booking(
                        customer_id=customer.id,
                        technician_id=profile.id,
                        category_id=category.id,
                        status=status,
                        description=description,
                        photo_urls=[],
                        address_label=c_address,
                        location=make_point(c_lat, c_lng),
                        quoted_price=349.0 if status == BookingStatus.COMPLETED else None,
                        final_price=349.0 if status == BookingStatus.COMPLETED else None,
                    )
                    db.add(booking)
                    created_bookings += 1
                db.commit()

        print(
            f"Seeded {created_technicians} new technicians, "
            f"1 customer ({customer_email}), and {created_bookings} demo bookings."
        )
        print(f"Demo login password for all seeded accounts: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
