import type { BookingStatus } from '../../types'

const STYLES: Record<BookingStatus, string> = {
  requested: 'bg-slate-100 text-slate-700',
  accepted: 'bg-blue-100 text-blue-700',
  quoted: 'bg-amber-100 text-amber-700',
  quote_approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
  disputed: 'bg-red-100 text-red-700',
}

const LABELS: Record<BookingStatus, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  quoted: 'Quote sent',
  quote_approved: 'Quote approved',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
