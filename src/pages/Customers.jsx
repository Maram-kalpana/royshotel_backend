import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, IconButton, TextField, MenuItem, Button } from '@mui/material'
import { Eye, Edit, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import FilterSection from '../components/FilterSection'
import DatePickerField from '../components/DatePickerField'
import DrawerFormStack from '../components/DrawerFormStack'
import DrawerDetailItem from '../components/DrawerDetailItem'
import StatusBadge from '../components/StatusBadge'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import { useAuth, useCustomers, useHotel, useBookings } from '../hooks/useStore'
import { formatCurrency, formatDate, ROLES, getBookingPaymentInfo } from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'

const SEARCH_BY_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'aadhaar', label: 'Aadhaar' },
]

const Customers = () => {
  const { user } = useAuth()
  const { list } = useCustomers()
  const { list: bookings } = useBookings()
  const { beds } = useHotel()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [search, setSearch] = useState('')
  const [searchBy, setSearchBy] = useState('name')
  const [checkInDate, setCheckInDate] = useState('')
  const [applied, setApplied] = useState({ search: '', searchBy: 'name', checkInDate: '' })
  const [viewCustomer, setViewCustomer] = useState(null)

  const enrichedCustomers = useMemo(() => list.map((c) => {
    const bed = beds.find((b) => b.id === c.bedId)
    const booking = bookings.find((b) => b.customerId === c.id)
    const payment = getBookingPaymentInfo(booking)
    return {
      ...c,
      floorNumber: bed?.floorNumber ?? '—',
      balanceAmount: payment.balanceAmount,
      paymentStatus: payment.paymentStatus,
    }
  }), [list, beds, bookings])

  const filtered = useMemo(() => {
    let rows = enrichedCustomers
    const q = applied.search.toLowerCase().trim()
    if (q) rows = rows.filter((c) => String(c[applied.searchBy] ?? '').toLowerCase().includes(q))
    if (applied.checkInDate) rows = rows.filter((c) => c.checkInDate === applied.checkInDate)
    return rows
  }, [enrichedCustomers, applied])

  const handleSearch = () => setApplied({ search, searchBy, checkInDate })
  const handleReset = () => {
    setSearch(''); setSearchBy('name'); setCheckInDate('')
    setApplied({ search: '', searchBy: 'name', checkInDate: '' })
  }

  const handleCheckout = (row) => {
    if (row.balanceAmount > 0) {
      toast.error('Customer cannot be checked out until the pending balance amount is cleared.')
      return
    }
    navigate(`/checkout/${row.id}`)
  }

  const columns = [
    { field: 'photo', headerName: 'Photo', width: 70, sortable: false, renderCell: (p) => <Avatar src={p.value} alt={p.row.name} sx={{ width: 40, height: 40 }} /> },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 130 },
    { field: 'floorNumber', headerName: 'Floor', width: 90 },
    { field: 'roomNumber', headerName: 'Room', width: 90 },
    { field: 'bedNumber', headerName: 'Bed', width: 80 },
    { field: 'checkInDate', headerName: 'Check-In Date', flex: 1, minWidth: 130, valueFormatter: (v) => formatDate(v) },
    { field: 'balanceAmount', headerName: 'Balance Amount', flex: 1, minWidth: 130, valueFormatter: (v) => formatCurrency(v) },
    { field: 'paymentStatus', headerName: 'Payment Status', width: 130, renderCell: (p) => <PaymentStatusBadge balanceAmount={p.row.balanceAmount} /> },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusBadge status={p.value} /> },
    {
      field: 'actions', headerName: 'Actions', width: isSuperAdmin ? 80 : 140, sortable: false, filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="primary" onClick={() => setViewCustomer(params.row)} title="View"><Eye size={16} /></IconButton>
          {!isSuperAdmin && (
            <>
              <IconButton size="small" onClick={() => navigate(`/customers/${params.row.id}`)} title="Edit"><Edit size={16} /></IconButton>
              <IconButton size="small" color="warning" onClick={() => handleCheckout(params.row)} title="Checkout" disabled={params.row.balanceAmount > 0}><LogOut size={16} /></IconButton>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="page-header">
        <h2 className="section-title">Customers</h2>
        <p className="page-subtitle">{filtered.length} active customers{isSuperAdmin && ' · View only'}</p>
      </div>

      <FilterSection onSearch={handleSearch} onReset={handleReset}>
        <TextField label="Search Customer" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
        <TextField select label="Search By" value={searchBy} onChange={(e) => setSearchBy(e.target.value)} sx={filterFieldSx}>
          {SEARCH_BY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <DatePickerField label="Check-In Date" value={checkInDate} onChange={setCheckInDate} sx={filterFieldSx} />
      </FilterSection>

      <MuiDataGrid rows={filtered} columns={columns} pageSize={10} />

      <RightDrawer open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details" variant="customer" footer={<Button onClick={() => setViewCustomer(null)} sx={{ height: 44 }}>Close</Button>}>
        {viewCustomer && (
          <DrawerFormStack>
            <DrawerDetailItem label="Name" value={viewCustomer.name} />
            <DrawerDetailItem label="Phone" value={viewCustomer.phone} />
            <DrawerDetailItem label="Email" value={viewCustomer.email} />
            <DrawerDetailItem label="Aadhaar" value={viewCustomer.aadhaar} />
            <DrawerDetailItem label="PAN" value={viewCustomer.pan} />
            <DrawerDetailItem label="Floor" value={viewCustomer.floorNumber} />
            <DrawerDetailItem label="Room" value={viewCustomer.roomNumber} />
            <DrawerDetailItem label="Bed" value={viewCustomer.bedNumber} />
            <DrawerDetailItem label="Check-In Date" value={formatDate(viewCustomer.checkInDate)} />
            <DrawerDetailItem label="Balance Amount" value={formatCurrency(viewCustomer.balanceAmount)} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Payment Status</p>
              <PaymentStatusBadge balanceAmount={viewCustomer.balanceAmount} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Status</p>
              <StatusBadge status={viewCustomer.status} />
            </div>
          </DrawerFormStack>
        )}
      </RightDrawer>
    </PageTransition>
  )
}

export default Customers
