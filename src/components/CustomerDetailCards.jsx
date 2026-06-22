import { Avatar } from '@mui/material'
import { User, CreditCard, IdCard, Building2, Clock, CalendarClock, ArrowRightLeft } from 'lucide-react'
import {
  formatCurrency, formatDate, displayValue, mapStayTypeLabel,
  formatCheckInDateTime, formatCheckOutDateTime,
} from '../utils/helpers'
import { getDueDateLabel } from '../utils/monthlyPaymentHelpers'

const DetailCard = ({ title, icon: Icon, items }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
      <Icon size={16} className="text-[#0B1F4D] shrink-0" />
      <h3 className="text-sm font-semibold text-[#0B1F4D]">{title}</h3>
    </div>
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5 break-words">{displayValue(value)}</p>
        </div>
      ))}
    </div>
  </div>
)

const CustomerDetailCards = ({ customer, booking, bed, monthlyTenant }) => {
  const stayType = mapStayTypeLabel(customer.stayType || booking?.stayType)
  const isMonthly = stayType === 'Monthly'

  const stayItems = [
    { label: 'Floor', value: bed?.floorNumber ?? customer.floorNumber },
    { label: 'Room Number', value: customer.roomNumber },
    { label: 'Bed Number', value: customer.bedNumber },
    { label: 'Stay Type', value: stayType },
    { label: 'Check-In Date & Time', value: formatCheckInDateTime(customer, booking) },
    { label: 'Checked Out Date', value: formatCheckOutDateTime(customer, booking) },
    { label: 'Stay Status', value: customer.status },
  ]

  if (isMonthly) {
    stayItems.push(
      { label: 'Monthly Rent', value: formatCurrency(monthlyTenant?.monthlyRent ?? customer.monthlyRent) },
      { label: 'Due Day', value: monthlyTenant ? getDueDateLabel(monthlyTenant.dueDay) : displayValue(customer.dueDay ? `${customer.dueDay} of month` : null) },
      { label: 'Security Deposit', value: formatCurrency(customer.securityDeposit ?? booking?.advancePaid) },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center rounded-xl border border-slate-200 bg-gradient-to-b from-[#0B1F4D] to-[#1e3a8a] p-6 text-white">
        <Avatar
          src={customer.photo}
          alt={customer.name}
          sx={{ width: 88, height: 88, border: '3px solid rgba(255,255,255,0.3)', mb: 2 }}
        />
        <h2 className="text-lg font-semibold font-[Poppins]">{displayValue(customer.name)}</h2>
        <p className="text-blue-200 text-sm mt-1 capitalize">{displayValue(customer.status, 'Active')}</p>
        <p className="text-blue-100/80 text-xs mt-1">{stayType} Stay</p>
      </div>

      <DetailCard
        title="Personal Information"
        icon={User}
        items={[
          { label: 'Full Name', value: customer.name },
          { label: 'Phone', value: customer.phone },
          { label: 'Email', value: customer.email },
          { label: 'Address', value: customer.address },
          { label: 'City', value: customer.city },
          { label: 'State', value: customer.state },
        ]}
      />

      <DetailCard
        title="Identity Information"
        icon={IdCard}
        items={[
          { label: 'Aadhaar Number', value: customer.aadhaar },
          { label: 'PAN Number', value: customer.pan },
          { label: 'Customer ID', value: customer.id },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <IdCard size={16} className="text-[#0B1F4D]" />
          <h3 className="text-sm font-semibold text-[#0B1F4D]">Identity Documents</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Customer Photo', src: customer.photo },
            { label: 'Aadhaar Card', src: customer.aadhaarDoc || customer.photo },
            { label: 'PAN Card', src: customer.panDoc || customer.photo },
          ].map((doc) => (
            <div key={doc.label} className="rounded-lg border border-slate-200 overflow-hidden">
              <Avatar
                src={doc.src}
                variant="rounded"
                sx={{ width: '100%', height: 120, borderRadius: 0 }}
              />
              <p className="text-xs font-medium text-slate-600 text-center py-2 bg-slate-50">{doc.label}</p>
            </div>
          ))}
        </div>
      </div>

      <DetailCard title="Stay Information" icon={Building2} items={stayItems} />

      <DetailCard
        title="Payment Information"
        icon={CreditCard}
        items={[
          { label: 'Advance Paid', value: booking ? formatCurrency(booking.advancePaid) : '—' },
          { label: 'Total Amount', value: booking ? formatCurrency(booking.totalAmount) : '—' },
          { label: 'Balance Amount', value: booking ? formatCurrency(booking.balanceAmount) : '—' },
          { label: 'Payment Type', value: booking?.paymentType },
          { label: 'Payment Status', value: booking?.paymentStatus },
        ]}
      />

      {booking?.extendedUpto && (
        <DetailCard
          title="Extended Stay"
          icon={CalendarClock}
          items={[
            { label: 'Extended Upto', value: booking.extendedUpto ? new Date(booking.extendedUpto).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
            { label: 'Extension Amount', value: formatCurrency(booking.extendedAmount) },
            { label: 'Extension Status', value: booking.extendedStatus },
            { label: 'Extension Payment Type', value: booking.extendedPaymentType },
            { label: 'Extension Payment Date', value: booking.extendedPaymentDate ? formatDate(String(booking.extendedPaymentDate).split('T')[0]) : '—' },
          ]}
        />
      )}

      {booking?.shifts?.length > 0 && (
        <DetailCard
          title="Room Shift History"
          icon={ArrowRightLeft}
          items={booking.shifts.flatMap((shift, index) => [
            { label: `Shift ${index + 1} Date`, value: shift.shiftDate || shift.shift_date ? formatDate(shift.shiftDate || shift.shift_date) : '—' },
            { label: `Shift ${index + 1} From`, value: `F${shift.oldFloorNumber ?? shift.old_floor_number} · R${shift.oldRoomNumber ?? shift.old_room_number} · B${shift.oldBedNumber ?? shift.old_bed_number}` },
            { label: `Shift ${index + 1} To`, value: `F${shift.newFloorNumber ?? shift.new_floor_number} · R${shift.newRoomNumber ?? shift.new_room_number} · B${shift.newBedNumber ?? shift.new_bed_number}` },
          ])}
        />
      )}

      {isMonthly && monthlyTenant && (
        <DetailCard
          title="Monthly Rent Summary"
          icon={Clock}
          items={[
            { label: 'Last Paid Month', value: monthlyTenant.lastPaidMonth },
            { label: 'Current Status', value: monthlyTenant.status },
            { label: 'Monthly Rent', value: formatCurrency(monthlyTenant.monthlyRent) },
          ]}
        />
      )}
    </div>
  )
}

export default CustomerDetailCards
