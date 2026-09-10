"""Razorpay integration (test mode).

Amounts are handled in the major unit (INR rupees) in our domain and converted
to the minor unit (paise) only at the Razorpay boundary.
"""

import razorpay

from app.core.config import settings


class PaymentNotConfigured(RuntimeError):
    pass


def _client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise PaymentNotConfigured("Razorpay keys are not configured on this server")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_order(amount_rupees: float, *, receipt: str, currency: str = "INR") -> dict:
    """Create a Razorpay order and return its raw payload (includes 'id')."""
    client = _client()
    return client.order.create(
        {
            "amount": int(round(amount_rupees * 100)),  # paise
            "currency": currency,
            "receipt": receipt,
            "payment_capture": 1,
        }
    )


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify the checkout callback signature. Returns True if valid."""
    client = _client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            }
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
