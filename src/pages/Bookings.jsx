import { useState, useMemo } from 'react'
import { Button, IconButton, TextField, MenuItem } from '@mui/material'
import { Plus, Eye } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import FilterSection from '../components/FilterSection'
import DatePickerField from '../components/DatePickerField'
import DrawerFormStack from '../components/DrawerFormStack'
import DrawerDetailItem from '../components/DrawerDetailItem'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import BookingForm from '../components/BookingForm'
import { useAuth, useAppDispatch, useHotel, useBookings, useCustomers } from '../hooks/useStore'
import { addCustomer } from '../redux/slices/customerSlice'
import { addBooking } from '../redux/slices/bookingSlice'
import { updateBed } from '../redux/slices/hotelSlice'
import { formatCurrency, formatDate, ROLES, getPaymentStatus } from '../utils/helpers'
import { filterFieldSx, primaryButtonSx } from '../utils/layout'

const SEARCH_BY_OPTIONS = [
  { value: 'customerName', label: 'Customer Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'roomNumber', label: 'Room Number' },
]

const SuperAdminBookings = () => {
  const { list: bookings } = useBookings()
  const { list: customers } = useCustomers()
  const [search, setSearch] = useState('')
  const [searchBy, setSearchBy] = useState('customerName')
  const [bookingDate, setBookingDate] = useState('')
  const [applied, setApplied] = useState({ search: '', searchBy: 'customerName', bookingDate: '' })
  const [viewBooking, setViewBooking] = useState(null)

  const bookedRows = useMemo(() => {
    let rows = bookings
      .filter((b) => ['active', 'reserved', 'booked'].includes(b.status))
      .map((b) => {
        const customer = customers.find((c) => c.id === b.customerId)
        return {
          id: b.id,
          customerName: b.customerName,
          phone: customer?.phone || b.phone || '—',
          floorNumber: b.floorNumber,
          roomNumber: b.roomNumber,
          bedNumber: b.bedNumber,
          bookingDate: b.checkInDate,
          amount: b.totalAmount,
          balanceAmount: b.balanceAmount ?? 0,
          paymentStatus: getPaymentStatus(b.balanceAmount),
          booking: b,
        }
      })
    const q = applied.search.toLowerCase().trim()
    if (q) rows = rows.filter((r) => String(r[applied.searchBy] ?? '').toLowerCase().includes(q))
    if (applied.bookingDate) rows = rows.filter((r) => r.bookingDate === applied.bookingDate)
    return rows
  }, [bookings, customers, applied])

  const columns = [
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 130 },
    { field: 'floorNumber', headerName: 'Floor', width: 90 },
    { field: 'roomNumber', headerName: 'Room', width: 90 },
    { field: 'bedNumber', headerName: 'Bed', width: 80 },
    { field: 'bookingDate', headerName: 'Booking Date', flex: 1, minWidth: 130, valueFormatter: (v) => formatDate(v) },
    { field: 'amount', headerName: 'Amount', flex: 1, minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    { field: 'balanceAmount', headerName: 'Balance Amount', flex: 1, minWidth: 130, valueFormatter: (v) => formatCurrency(v) },
    { field: 'paymentStatus', headerName: 'Payment Status', width: 130, renderCell: (p) => <PaymentStatusBadge balanceAmount={p.row.balanceAmount} /> },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false,
      renderCell: (p) => <IconButton size="small" color="primary" onClick={() => setViewBooking(p.row.booking)} title="View"><Eye size={16} /></IconButton>,
    },
  ]

  return (
    <>
      <div className="page-header">
        <h2 className="section-title">Bookings</h2>
        <p className="page-subtitle">View booked rooms · {bookedRows.length} bookings</p>
      </div>
      <FilterSection onSearch={() => setApplied({ search, searchBy, bookingDate })} onReset={() => { setSearch(''); setSearchBy('customerName'); setBookingDate(''); setApplied({ search: '', searchBy: 'customerName', bookingDate: '' }) }}>
        <TextField label="Search Booking" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
        <TextField select label="Search By" value={searchBy} onChange={(e) => setSearchBy(e.target.value)} sx={filterFieldSx}>
          {SEARCH_BY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <DatePickerField label="Booking Date" value={bookingDate} onChange={setBookingDate} sx={filterFieldSx} />
      </FilterSection>
      <MuiDataGrid rows={bookedRows} columns={columns} pageSize={10} />
      <RightDrawer open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details" variant="booking" footer={<Button onClick={() => setViewBooking(null)} sx={{ height: 44 }}>Close</Button>}>
        {viewBooking && (
          <DrawerFormStack>
            {[
              ['Booking ID', viewBooking.id], ['Customer Name', viewBooking.customerName], ['Phone', viewBooking.phone || '—'],
              ['Floor', viewBooking.floorNumber], ['Room', viewBooking.roomNumber], ['Bed', viewBooking.bedNumber],
              ['Check-In Date', formatDate(viewBooking.checkInDate)], ['Total Amount', formatCurrency(viewBooking.totalAmount)],
              ['Advance Paid', formatCurrency(viewBooking.advancePaid)], ['Balance', formatCurrency(viewBooking.balanceAmount)],
            ].map(([label, value]) => <DrawerDetailItem key={label} label={label} value={value} />)}
          </DrawerFormStack>
        )}
      </RightDrawer>
    </>
  )
}

const AdminBookings = () => {
  const { floors, rooms, beds } = useHotel()
  const { list: bookings } = useBookings()
  const { list: customers } = useCustomers()
  const dispatch = useAppDispatch()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewBooking, setViewBooking] = useState(null)
  const [search, setSearch] = useState('')
  const [searchBy, setSearchBy] = useState('customerName')
  const [bookingDate, setBookingDate] = useState('')
  const [applied, setApplied] = useState({ search: '', searchBy: 'customerName', bookingDate: '' })

  const tableRows = useMemo(() => {
    let rows = bookings.map((b) => {
      const customer = customers.find((c) => c.id === b.customerId)
      return {
        id: b.id, bookingId: b.id, customerName: b.customerName, phone: customer?.phone || b.phone || '—',
        floorNumber: b.floorNumber, roomNumber: b.roomNumber, bedNumber: b.bedNumber, checkInDate: b.checkInDate,
        stayType: b.stayType, duration: b.duration, totalAmount: b.totalAmount, advancePaid: b.advancePaid,
        balanceAmount: b.balanceAmount ?? 0, paymentStatus: getPaymentStatus(b.balanceAmount), booking: b,
      }
    })
    const q = applied.search.toLowerCase().trim()
    if (q) rows = rows.filter((r) => String(r[applied.searchBy] ?? '').toLowerCase().includes(q))
    if (applied.bookingDate) rows = rows.filter((r) => r.checkInDate === applied.bookingDate)
    return rows
  }, [bookings, customers, applied])

  const handleSubmit = (data) => {
    const bed = beds.find((b) => b.id === data.bedId)
    const customerId = `cust-${Date.now()}`
    dispatch(addCustomer({
      id: customerId, name: data.name, phone: data.phone, email: `${data.name.replace(' ', '.').toLowerCase()}@email.com`,
      address: data.address, city: data.city, state: data.state, aadhaar: data.aadhaar, pan: data.pan, photo: data.photo,
      status: 'checked-in', roomId: data.roomId, bedId: data.bedId, roomNumber: bed?.roomNumber, bedNumber: bed?.bedNumber,
      checkInDate: new Date().toISOString().split('T')[0],
    }))
    dispatch(updateBed({ ...bed, status: 'occupied', customerId }))
    dispatch(addBooking({
      id: `booking-${Date.now()}`, customerId, customerName: data.name, phone: data.phone, bedId: data.bedId,
      roomId: data.roomId, roomNumber: bed?.roomNumber, bedNumber: bed?.bedNumber, floorNumber: bed?.floorNumber,
      stayType: data.stayType, duration: data.duration, bedCost: data.bedCost, totalAmount: data.totalAmount,
      advancePaid: data.advancePaid, balanceAmount: data.balanceAmount, status: 'active',
      checkInDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString().split('T')[0],
    }))
    setDrawerOpen(false)
  }

  const columns = [
    { field: 'bookingId', headerName: 'Booking ID', flex: 1, minWidth: 130 },
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 140 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
    { field: 'floorNumber', headerName: 'Floor', width: 80 },
    { field: 'roomNumber', headerName: 'Room', width: 80 },
    { field: 'bedNumber', headerName: 'Bed', width: 70 },
    { field: 'checkInDate', headerName: 'Check-In Date', flex: 1, minWidth: 120, valueFormatter: (v) => formatDate(v) },
    { field: 'stayType', headerName: 'Stay Type', width: 100 },
    { field: 'duration', headerName: 'Duration', width: 90 },
    { field: 'totalAmount', headerName: 'Total Amount', flex: 1, minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    { field: 'advancePaid', headerName: 'Advance', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'balanceAmount', headerName: 'Balance Amount', width: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'paymentStatus', headerName: 'Payment Status', width: 130, renderCell: (p) => <PaymentStatusBadge balanceAmount={p.row.balanceAmount} /> },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false,
      renderCell: (p) => <IconButton size="small" color="primary" onClick={() => setViewBooking(p.row.booking)} title="View"><Eye size={16} /></IconButton>,
    },
  ]

  return (
    <>
      <div className="page-header">
        <h2 className="section-title">Bookings</h2>
        <p className="page-subtitle">{tableRows.length} total bookings</p>
      </div>

      <div className="toolbar-row">
        <div className="flex flex-wrap items-end gap-4 flex-1 min-w-0">
          <TextField label="Search Booking" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
          <TextField select label="Search By" value={searchBy} onChange={(e) => setSearchBy(e.target.value)} sx={filterFieldSx}>
            {SEARCH_BY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <DatePickerField label="Booking Date" value={bookingDate} onChange={setBookingDate} sx={filterFieldSx} />
          <Button variant="contained" onClick={() => setApplied({ search, searchBy, bookingDate })} sx={primaryButtonSx}>Search</Button>
          <Button variant="outlined" onClick={() => { setSearch(''); setSearchBy('customerName'); setBookingDate(''); setApplied({ search: '', searchBy: 'customerName', bookingDate: '' }) }} sx={{ height: 44 }}>Reset</Button>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDrawerOpen(true)} sx={{ ...primaryButtonSx, flexShrink: 0 }}>Add Booking</Button>
      </div>

      <MuiDataGrid rows={tableRows} columns={columns} pageSize={10} />

      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Booking" variant="booking">
        <BookingForm floors={floors} rooms={rooms} beds={beds} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </RightDrawer>

      <RightDrawer open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details" variant="booking" footer={<Button onClick={() => setViewBooking(null)} sx={{ height: 44 }}>Close</Button>}>
        {viewBooking && (
          <DrawerFormStack>
            {[
              ['Booking ID', viewBooking.id], ['Customer Name', viewBooking.customerName], ['Phone', viewBooking.phone || '—'],
              ['Floor', viewBooking.floorNumber], ['Room', viewBooking.roomNumber], ['Bed', viewBooking.bedNumber],
              ['Check-In Date', formatDate(viewBooking.checkInDate)], ['Stay Type', viewBooking.stayType], ['Duration', viewBooking.duration],
              ['Total Amount', formatCurrency(viewBooking.totalAmount)], ['Advance Paid', formatCurrency(viewBooking.advancePaid)],
              ['Balance', formatCurrency(viewBooking.balanceAmount)],
            ].map(([label, value]) => <DrawerDetailItem key={label} label={label} value={value} />)}
          </DrawerFormStack>
        )}
      </RightDrawer>
    </>
  )
}

const Bookings = () => {
  const { user } = useAuth()
  return (
    <PageTransition className="page-container">
      {user?.role === ROLES.SUPER_ADMIN ? <SuperAdminBookings /> : <AdminBookings />}
    </PageTransition>
  )
}

export default Bookings
