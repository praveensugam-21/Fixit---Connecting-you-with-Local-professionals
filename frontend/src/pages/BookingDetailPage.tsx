import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { BookingStatusBadge } from '../components/common/BookingStatusBadge'
import { useAuth } from '../context/AuthContext'
import type { Booking, Message } from '../types'

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { user } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageBody, setMessageBody] = useState('')
  const [quotePrice, setQuotePrice] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  function reload() {
    if (!bookingId) return
    bookingsApi.getById(bookingId).then(setBooking)
    bookingsApi.listMessages(bookingId).then(setMessages)
  }

  useEffect(reload, [bookingId])

  if (!booking || !user) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  const isCustomer = user.role === 'customer'
  const isTechnician = user.role === 'technician'
  const threadClosed = ['cancelled', 'completed', 'disputed'].includes(booking.status)

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null)
    try {
      await action()
      reload()
    } catch {
      setActionError('That action could not be completed.')
    }
  }

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault()
    if (!bookingId || !messageBody.trim()) return
    await runAction(() => bookingsApi.sendMessage(bookingId, messageBody))
    setMessageBody('')
  }

  async function handleSubmitQuote(event: FormEvent) {
    event.preventDefault()
    if (!bookingId || !quotePrice) return
    await runAction(() => bookingsApi.submitQuote(bookingId, Number(quotePrice)))
  }

  async function handleSubmitReview(event: FormEvent) {
    event.preventDefault()
    if (!bookingId) return
    await runAction(() => bookingsApi.leaveReview(bookingId, reviewRating, reviewComment || undefined))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Booking</h1>
          <BookingStatusBadge status={booking.status} />
        </div>

        <p className="mt-4 text-sm text-slate-700">{booking.description}</p>
        <p className="mt-1 text-xs text-slate-500">{booking.address_label}</p>
        {booking.quoted_price != null && (
          <p className="mt-2 text-sm font-medium text-slate-900">Quoted price: {booking.quoted_price}</p>
        )}
        {booking.final_price != null && (
          <p className="text-sm font-medium text-slate-900">Final price: {booking.final_price}</p>
        )}

        {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {isTechnician && booking.status === 'requested' && (
            <button
              type="button"
              onClick={() => runAction(() => bookingsApi.updateStatus(booking.id, 'accepted'))}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Accept job
            </button>
          )}

          {isCustomer && booking.status === 'quoted' && (
            <button
              type="button"
              onClick={() => runAction(() => bookingsApi.updateStatus(booking.id, 'quote_approved'))}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Approve quote
            </button>
          )}

          {isTechnician && booking.status === 'quote_approved' && (
            <button
              type="button"
              onClick={() => runAction(() => bookingsApi.updateStatus(booking.id, 'in_progress'))}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Start job
            </button>
          )}

          {isTechnician && booking.status === 'in_progress' && (
            <button
              type="button"
              onClick={() => runAction(() => bookingsApi.updateStatus(booking.id, 'completed'))}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Mark completed
            </button>
          )}

          {['requested', 'accepted', 'quoted', 'quote_approved'].includes(booking.status) && (
            <button
              type="button"
              onClick={() => runAction(() => bookingsApi.updateStatus(booking.id, 'cancelled', 'Cancelled by user'))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>

        {isTechnician && booking.status === 'accepted' && (
          <form onSubmit={handleSubmitQuote} className="mt-4 flex gap-2">
            <input
              type="number"
              min={1}
              step="0.01"
              required
              placeholder="Quoted price"
              value={quotePrice}
              onChange={(e) => setQuotePrice(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Send quote
            </button>
          </form>
        )}

        {isCustomer && booking.status === 'completed' && (
          <form onSubmit={handleSubmitReview} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-900">Rate this technician</p>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Optional comment"
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Submit review
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.sender_id === user.id
                  ? 'ml-auto bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {message.body}
            </li>
          ))}
          {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
        </ul>

        {!threadClosed && (
          <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
            <input
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
