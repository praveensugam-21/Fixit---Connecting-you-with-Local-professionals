"""Seed an admin account and a couple of pending (unverified) technicians.

Run with: python -m app.seed_admin

Lets you demo the admin verification dashboard: log in as the admin, review the
pending technicians, and approve or reject them.
"""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.technician import TechnicianProfile, VerificationStatus
from app.models.user import User, UserRole
from app.services.geo import make_point

ADMIN = ("Admin", "admin@example.com")

# Pending technicians awaiting verification (name, email, lat, lng, area).
PENDING = [
    ("Vikram Shetty", "vikram.pending@example.com", 12.7700, 80.2200, "Kelambakkam"),
    ("Nisha Rao", "nisha.pending@example.com", 12.7500, 80.2050, "Thiruporur"),
]

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
        get_or_create_user(db, full_name=ADMIN[0], email=ADMIN[1], role=UserRole.ADMIN)

        created = 0
        for name, email, lat, lng, area in PENDING:
            user = get_or_create_user(db, full_name=name, email=email, role=UserRole.TECHNICIAN)
            profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
            if profile is None:
                db.add(
                    TechnicianProfile(
                        user_id=user.id,
                        bio=f"New {area} technician awaiting verification.",
                        years_experience=3,
                        verification_status=VerificationStatus.PENDING,
                        service_radius_km=12.0,
                        location=make_point(lat, lng),
                        address_label=area,
                        avg_rating=0.0,
                        rating_count=0,
                    )
                )
                db.commit()
                created += 1

        print(f"Seeded admin ({ADMIN[1]}) and {created} new pending technicians.")
        print(f"Login password for all seeded accounts: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
