import { formatCurrency, formatDate, displayValue } from '../../utils/helpers'
import MonthlyPaymentStatusBadge from './MonthlyPaymentStatusBadge'

const hasPaymentData = (record) => {
  const paid = record.totalPaid ?? record.amount ?? 0
  return paid > 0 || (record.payments?.length > 0)
}

const PaymentHistoryContent = ({ tenant }) => {
  if (!tenant) return null

  const history = (tenant.paymentHistory || []).filter(hasPaymentData)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Room', tenant.roomNumber],
          ['Monthly Rent', formatCurrency(tenant.monthlyRent)],
          ['Due Day', `${tenant.dueDay}${tenant.dueDay === 1 ? 'st' : 'th'} of month`],
          ['Last Paid', displayValue(tenant.lastPaidMonth)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 px-2.5 py-2 border border-slate-100">
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No payment history yet</p>
      ) : (
        history.map((record) => (
          <div key={record.id || record.month} className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-900">{record.month}</span>
              <MonthlyPaymentStatusBadge status={record.paymentStatus || record.status} />
            </div>
            <div className="p-2.5 space-y-1">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div><span className="text-slate-500">Rent:</span> <strong>{formatCurrency(record.totalRent ?? tenant.monthlyRent)}</strong></div>
                <div><span className="text-slate-500">Paid:</span> <strong>{formatCurrency(record.totalPaid ?? 0)}</strong></div>
              </div>
              {record.payments?.length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-100">
                  {record.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-[10px] py-0.5">
                      <span>{formatCurrency(p.amount)} · {p.paymentMode}</span>
                      <span className="text-slate-400">{p.paymentDate ? formatDate(p.paymentDate) : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default PaymentHistoryContent
