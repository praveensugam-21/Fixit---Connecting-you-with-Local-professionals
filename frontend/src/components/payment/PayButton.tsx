import { useState } from 'react'
import { paymentsApi } from '../../api/payments'

interface PayButtonProps {
  bookingId: string
  amount: number
  onPaid: () => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Minimal shape of the Razorpay checkout global loaded from the CDN script.
interface RazorpayConstructor {
  new (options: Record<string, unknown>): { open: () => void }
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function PayButton({ bookingId, amount, onPaid }: PayButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setBusy(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok || !window.Razorpay) {
        setError('Could not load the payment gateway. Check your connection.')
        return
      }

      const order = await paymentsApi.createOrder(bookingId)

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        order_id: order.order_id,
        name: 'FixIt',
        description: 'Home service payment',
        theme: { color: '#2563eb' },
        handler: async (response: RazorpayResponse) => {
          try {
            await paymentsApi.verify(bookingId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            onPaid()
          } catch {
            setError('Payment captured but verification failed. Contact support.')
          }
        },
      })
      rzp.open()
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || 'Could not start payment. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? 'Starting payment...' : `Pay ₹${amount}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
