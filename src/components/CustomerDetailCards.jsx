import { Avatar } from '@mui/material'
import { User, CreditCard, Building2, Clock, CalendarClock } from 'lucide-react'
import {
  formatCurrency, displayValue, mapStayTypeLabel, isValidImageUrl,
  formatCheckInDateTime, formatCheckOutDateTime,
} from '../utils/helpers'
import { getDueDateLabel } from '../utils/monthlyPaymentHelpers'
import DocumentSection from './DocumentSection'
import MonthlyPaymentStatusBadge from './monthlyPayments/MonthlyPaymentStatusBadge'

const DetailRow = ({ label, value }) => (
  <div className="flex gap-1.5 py-1 border-b border-slate-100 last:border-0 text-xs">
    <span className="text-slate-500 shrink-0 w-[42%]">{label}</span>
    <span className="font-medium text-slate-900 break-words flex-1">{displayValue(value)}</span>
  </div>
)

const DetailCard = ({ title, icon: Icon, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border-b border-slate-100">
      <Icon size={13} className="text-[#0B1F4D] shrink-0" />
      <h3 className="text-xs font-semibold text-[#0B1F4D]">{title}</h3>
    </div>
    <div className="px-2.5 py-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3">{children}</div>
  </div>
)

const hasPaymentData = (record) => {
  const paid = record.totalPaid ?? record.amount ?? 0
  return paid > 0 || (record.payments?.length > 0)
}

const CustomerDetailCards = ({ customer, booking, bed, monthlyTenant }) => {
  const stayType = mapStayTypeLabel(customer.stayType || booking?.stayType)
  const isMonthly = stayType === 'Monthly'
  const photo = isValidImageUrl(customer.photo) ? customer.photo : null

  const paymentHistory = (monthlyTenant?.paymentHistory || []).filter(hasPaymentData)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-gradient-to-r from-[#0B1F4D] to-[#1e3a8a] p-2.5 text-white">
        {photo ? (
          <Avatar src={photo} alt={customer.name} sx={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.3)' }} />
        ) : (
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.15)', fontSize: 14 }}>{customer.name?.charAt(0) || '?'}</Avatar>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{displayValue(customer.name)}</h2>
          <p className="text-blue-200 text-[10px] capitalize">{displayValue(customer.status, 'Active')} · {stayType}</p>
        </div>
      </div>

      <DetailCard title="Customer Info" icon={User}>
        <DetailRow label="Name" value={customer.name} />
        <DetailRow label="Phone" value={customer.phone} />
        <DetailRow label="Address" value={customer.address} />
        <DetailRow label="City" value={customer.city} />
        <DetailRow label="State" value={customer.state} />
        <DetailRow label="Aadhaar" value={customer.aadhaar} />
      </DetailCard>

      <DetailCard title="Booking Info" icon={Building2}>
        <DetailRow label="Floor" value={bed?.floorNumber ?? customer.floorNumber} />
        <DetailRow label="Room" value={customer.roomNumber} />
        <DetailRow label="Bed" value={customer.bedNumber} />
        <DetailRow label="Check-In" value={formatCheckInDateTime(customer, booking)} />
        <DetailRow label="Check Out" value={formatCheckOutDateTime(customer, booking)} />
        {isMonthly && (
          <>
            <DetailRow label="Rent" value={formatCurrency(monthlyTenant?.monthlyRent ?? customer.monthlyRent)} />
            <DetailRow label="Due Day" value={monthlyTenant ? getDueDateLabel(monthlyTenant.dueDay) : customer.dueDay} />
          </>
        )}
      </DetailCard>

      {booking && (
        <DetailCard title="Payment Info" icon={CreditCard}>
          <DetailRow label="Advance" value={formatCurrency(booking.advancePaid)} />
          <DetailRow label="Total" value={formatCurrency(booking.totalAmount)} />
          <DetailRow label="Balance" value={formatCurrency(booking.balanceAmount)} />
          <DetailRow label="Status" value={booking.paymentStatus} />
        </DetailCard>
      )}

      {isMonthly && paymentHistory.length > 0 && (
        <DetailCard title="Monthly Payments" icon={Clock}>
          {paymentHistory.map((record) => (
            <div key={record.id || record.month} className="col-span-full mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-0 border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{record.month}</span>
                <MonthlyPaymentStatusBadge status={record.paymentStatus || record.status} />
              </div>
              <DetailRow label="Rent" value={formatCurrency(record.totalRent ?? monthlyTenant.monthlyRent)} />
              <DetailRow label="Paid" value={formatCurrency(record.totalPaid ?? 0)} />
              {(record.balanceAmount ?? 0) > 0 && <DetailRow label="Balance" value={formatCurrency(record.balanceAmount)} />}
              {record.payments?.map((p) => (
                <p key={p.id} className="text-[10px] text-slate-600 pl-1">{formatCurrency(p.amount)} · {p.paymentMode}</p>
              ))}
            </div>
          ))}
        </DetailCard>
      )}

      <DocumentSection customer={{
        ...customer,
        aadhaarFront: customer.aadhaarFront || customer.aadhaar_front_url,
        aadhaarBack: customer.aadhaarBack || customer.aadhaar_back_url,
      }} />

      {customer.notes && (
        <DetailCard title="Notes" icon={User}>
          <p className="col-span-full text-xs text-slate-700">{customer.notes}</p>
        </DetailCard>
      )}

      {booking?.extendedUpto && (
        <DetailCard title="Extended" icon={CalendarClock}>
          <DetailRow label="Until" value={new Date(booking.extendedUpto).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
          <DetailRow label="Amount" value={formatCurrency(booking.extendedAmount)} />
        </DetailCard>
      )}
    </div>
  )
}

export default CustomerDetailCards
