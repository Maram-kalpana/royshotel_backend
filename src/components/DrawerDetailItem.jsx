const DrawerDetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value ?? '—'}</p>
  </div>
)

export default DrawerDetailItem
