"""Seed baseline service categories. Run with: python -m app.seed"""

from app.core.database import SessionLocal
from app.models.service_category import ServiceCategory

DEFAULT_CATEGORIES = [
    ("Plumbing", "plumbing", "wrench"),
    ("Electrical", "electrical", "bolt"),
    ("AC Servicing", "ac-servicing", "snowflake"),
    ("Carpentry", "carpentry", "hammer"),
    ("Painting", "painting", "paint-roller"),
    ("Appliance Repair", "appliance-repair", "washing-machine"),
    ("Pest Control", "pest-control", "bug"),
    ("Cleaning", "cleaning", "spray-bottle"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        existing = {c.slug for c in db.query(ServiceCategory).all()}
        created = 0
        for name, slug, icon in DEFAULT_CATEGORIES:
            if slug in existing:
                continue
            db.add(ServiceCategory(name=name, slug=slug, icon=icon))
            created += 1
        db.commit()
        print(f"Seeded {created} new service categories ({len(existing)} already present).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
