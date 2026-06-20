import { useState, useMemo, useEffect } from 'react'
import { Button, IconButton, TextField, MenuItem, Box } from '@mui/material'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import DatePickerField from '../components/DatePickerField'
import { combineDateAndTime, splitDateTime } from '../components/DateTimeSplitField'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import DateTimeStack from '../components/DateTimeStack'
import BookingForm from '../components/BookingForm'
import BookingEditForm from '../components/BookingEditForm'
import CustomerDetailCards from '../components/CustomerDetailCards'
import { useAuth, useAppDispatch, useHotel, useBookings, useCustomers, useMonthlyPayments } from '../hooks/useStore'
import { formatCurrency, ROLES, getPaymentStatus, formatStayDuration } from '../utils/helpers'
import { filterFieldSx, primaryButtonSx } from '../utils/layout'
import { loadBookings, loadCustomers, loadRooms } from '../services/dataService'
import { bookingsApi } from '../services/endpoints'

const emptyEditForm = {
  name: '', phone: '', address: '', city: '', state: '', aadhaar: '', pan: '',
  totalAmount: '', advancePaid: '',
  advancePaymentType: 'Cash', advancePaymentDate: '',
  balancePaymentType: 'Cash', balancePaymentDate: '',
  paymentStatus: 'pending',
  extendedDate: '', extendedTime: '12:00', extendedAmount: '', extendedStatus: 'pending',
  extendedPaymentType: 'Cash', extendedPaymentDate: '',
  shiftDate: '', newFloorId: '', newRoomId: '', newBedId: '',
}

const BookingsContent = () => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const { floors, rooms, beds } = useHotel()
  const { list: bookings } = useBookings()
  const { list: customers } = useCustomers()
  const { tenants } = useMonthlyPayments()
  const dispatch = useAppDispatch()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewBooking, setViewBooking] = useState(null)
  const [editBooking, setEditBooking] = useState(null)
  const [search, setSearch] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [editForm, setEditForm] = useState(emptyEditForm)
  const updateEditForm = (patch) => setEditForm((prev) => ({ ...prev, ...patch }))

  useEffect(() => {
    Promise.all([
      loadBookings(dispatch),
      loadCustomers(dispatch),
      loadRooms(dispatch),
    ]).catch(console.error)
  }, [dispatch])

  const tableRows = useMemo(() => {
    let rows = bookings
      .filter((b) => isSuperAdmin ? ['active', 'reserved', 'booked'].includes(b.status) : true)
      .map((b) => {
        const customer = customers.find((c) => c.id === b.customerId)
        const status = b.paymentStatus || getPaymentStatus(b.balanceAmount)
        return {
          id: b.id,
          customerName: b.customerName,
          phone: customer?.phone || b.phone || '—',
          floorNumber: b.floorNumber,
          roomNumber: b.roomNumber,
          bedNumber: b.bedNumber,
          checkInDateTime: b.checkInDateTime || b.checkInDate,
          checkOutDateTime: b.checkOutDateTime || '',
          stayDuration: formatStayDuration(b.duration, b.stayType),
          totalAmount: b.totalAmount,
          advancePaid: b.advancePaid ?? 0,
          paymentType: b.paymentType || '—',
          paymentStatus: status,
          balanceAmount: b.balanceAmount ?? 0,
          booking: b,
          customer,
        }
      })

    const q = search.toLowerCase().trim()
    if (q) {
      rows = rows.filter((r) =>
        r.customerName?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        String(r.roomNumber).includes(q),
      )
    }
    if (bookingDate) {
      rows = rows.filter((r) => {
        const d = r.checkInDateTime?.split('T')[0] || r.checkInDateTime
        return d === bookingDate
      })
    }
    if (paymentFilter) {
      rows = rows.filter((r) => r.paymentStatus === paymentFilter)
    }
    return rows
  }, [bookings, customers, search, bookingDate, paymentFilter, isSuperAdmin])

  const reloadBookingData = async () => {
    await Promise.all([
      loadBookings(dispatch),
      loadCustomers(dispatch),
      loadRooms(dispatch),
    ])
  }

  const handleSubmit = async (data) => {
    try {
      await bookingsApi.create({
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        aadhaar: data.aadhaar,
        pan: data.pan,
        photo: data.photo,
        aadhaarDoc: data.aadhaarDoc,
        panDoc: data.panDoc,
        bedId: data.bedId,
        stayType: data.stayType,
        duration: data.duration,
        bedCost: data.bedCost,
        totalAmount: data.totalAmount,
        advancePaid: data.advancePaid,
        balanceAmount: data.balanceAmount,
        paymentType: data.advancePaymentType,
        advancePaymentType: data.advancePaymentType,
        advancePaymentDate: data.advancePaymentDate,
        balancePaymentType: data.balancePaymentType,
        balancePaymentDate: data.balancePaymentDate,
        paymentStatus: data.paymentStatus,
        checkInDateTime: data.checkInDateTime,
        checkOutDateTime: data.checkOutDateTime || null,
      })
      await reloadBookingData()
      toast.success('Booking created successfully')
      setDrawerOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking')
    }
  }

  const handleDelete = async (row) => {
    try {
      await bookingsApi.remove(row.booking.id)
      await reloadBookingData()
      toast.success('Booking deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete booking')
    }
  }

  const openEdit = (row) => {
    const b = row.booking
    const customer = row.customer
    const today = new Date().toISOString().split('T')[0]
    const ext = splitDateTime(b.extendedUpto || '')
    setEditBooking(b)
    setEditForm({
      name: b.customerName || customer?.name || '',
      phone: customer?.phone || b.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      aadhaar: customer?.aadhaar || '',
      pan: customer?.pan || '',
      totalAmount: String(b.totalAmount ?? 0),
      advancePaid: String(b.advancePaid ?? 0),
      advancePaymentType: b.paymentType || 'Cash',
      advancePaymentDate: b.checkInDateTime?.split('T')[0] || today,
      balancePaymentType: b.paymentType || 'Cash',
      balancePaymentDate: '',
      paymentStatus: b.paymentStatus || getPaymentStatus(b.balanceAmount),
      extendedDate: ext.date,
      extendedTime: ext.time || '12:00',
      extendedAmount: '',
      extendedStatus: b.extendedStatus || 'pending',
      extendedPaymentType: b.extendedPaymentType || 'Cash',
      extendedPaymentDate: b.extendedPaymentDate?.split('T')[0] || '',
      shiftDate: today,
      newFloorId: '',
      newRoomId: '',
      newBedId: '',
    })
  }

  const handleEditSave = async () => {
    if (!editBooking) return

    const customer = customers.find((c) => c.id === editBooking.customerId)
    const newTotal = Number(editForm.totalAmount) || editBooking.totalAmount || 0
    const newAdvance = Number(editForm.advancePaid) || 0
    const newBalance = Math.max(0, newTotal - newAdvance)

    const payload = {
      customerId: editBooking.customerId,
      customerName: editForm.name,
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
      city: editForm.city,
      state: editForm.state,
      aadhaar: editForm.aadhaar,
      pan: editForm.pan,
      totalAmount: newTotal,
      advancePaid: newAdvance,
      balanceAmount: newBalance,
      paymentType: editForm.balancePaymentDate ? editForm.balancePaymentType : editForm.advancePaymentType,
      paymentStatus: editForm.paymentStatus,
      checkOutDateTime: editBooking.checkOutDateTime,
      extendedUpto: editBooking.extendedUpto,
      extendedAmount: editBooking.extendedAmount,
      extendedStatus: editBooking.extendedStatus,
      extendedPaymentType: editBooking.extendedPaymentType,
      extendedPaymentDate: editBooking.extendedPaymentDate,
      status: editBooking.status,
    }

    if (editForm.balancePaymentDate && newBalance > 0) {
      payload.balancePaymentDate = combineDateAndTime(editForm.balancePaymentDate, editForm.paymentTime || '12:00')
      payload.paymentStatus = 'completed'
      payload.balanceAmount = 0
      payload.advancePaid = newTotal
    }

    const extAmount = Number(editForm.extendedAmount) || 0
    if (editForm.extendedDate && extAmount > 0) {
      payload.extendedUpto = combineDateAndTime(editForm.extendedDate, editForm.extendedTime)
      payload.extendedAmount = (editBooking.extendedAmount || 0) + extAmount
      payload.extendedStatus = editForm.extendedStatus
      payload.extendedPaymentType = editForm.extendedPaymentType
      payload.extendedPaymentDate = editForm.extendedPaymentDate
        ? combineDateAndTime(editForm.extendedPaymentDate, editForm.extendedTime)
        : editForm.extendedPaymentDate
      payload.totalAmount = newTotal + extAmount
      payload.balanceAmount = (payload.balanceAmount || newBalance) + extAmount
      payload.paymentStatus = editForm.extendedStatus === 'completed' ? payload.paymentStatus : 'pending'
    }

    try {
      await bookingsApi.update(editBooking.id, payload)
      await reloadBookingData()
      toast.success('Booking updated')
      setEditBooking(null)
      setEditForm(emptyEditForm)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking')
    }
  }

  const columns = [
    {
      field: 'customerInfo',
      headerName: 'Customer',
      minWidth: 140,
      allowWrap: true,
      renderCell: ({ row }) => (
        <Box sx={{ lineHeight: 1.35, py: 0.25 }}>
          <Box sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>{row.customerName}</Box>
          <Box sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{row.phone}</Box>
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Floor / Room / Bed',
      width: 120,
      allowWrap: true,
      renderCell: ({ row }) => (
        <Box sx={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.35 }}>
          F{row.floorNumber} · R{row.roomNumber} · B{row.bedNumber}
        </Box>
      ),
    },
    {
      field: 'checkInDateTime',
      headerName: 'Checked In',
      width: 115,
      allowWrap: true,
      renderCell: ({ value }) => <DateTimeStack value={value} />,
    },
    {
      field: 'checkOutDateTime',
      headerName: 'Checked Out',
      width: 115,
      allowWrap: true,
      renderCell: ({ value }) => <DateTimeStack value={value} />,
    },
    { field: 'stayDuration', headerName: 'Stay', width: 95 },
    { field: 'totalAmount', headerName: 'Amount', width: 100, valueFormatter: (v) => formatCurrency(v) },
    {
      field: 'paymentDetails',
      headerName: 'Advance / Balance / Type',
      minWidth: 150,
      allowWrap: true,
      renderCell: ({ row }) => (
        <Box sx={{ lineHeight: 1.35, py: 0.25 }}>
          <Box sx={{ fontSize: '0.8125rem', color: '#334155' }}>Adv: {formatCurrency(row.advancePaid)}</Box>
          <Box sx={{ fontSize: '0.8125rem', color: '#334155' }}>Bal: {formatCurrency(row.balanceAmount)}</Box>
          <Box sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{row.paymentType}</Box>
        </Box>
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 130,
      allowWrap: true,
      renderCell: ({ row }) => <PaymentStatusBadge status={row.paymentStatus} balanceAmount={row.balanceAmount} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <IconButton size="small" color="primary" onClick={() => setViewBooking(row.booking)} title="View"><Eye size={16} /></IconButton>
          <IconButton size="small" color="info" onClick={() => openEdit(row)} title="Edit"><Pencil size={16} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ]

  const viewCustomer = viewBooking ? customers.find((c) => c.id === viewBooking.customerId) : null
  const viewBed = viewBooking ? beds.find((b) => b.id === viewBooking.bedId) : null
  const viewMonthly = viewBooking ? tenants.find((t) => t.customerId === viewBooking.customerId) : null

  return (
    <>
      <div className="toolbar-row">
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <TextField label="Search Booking" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
          <DatePickerField label="Booking Date" value={bookingDate} onChange={setBookingDate} sx={filterFieldSx} />
          <TextField select label="Payment Status" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} sx={filterFieldSx}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDrawerOpen(true)} sx={{ ...primaryButtonSx, flexShrink: 0 }}>
          Add Booking
        </Button>
      </div>

      <MuiDataGrid rows={tableRows} columns={columns} pageSize={10} noHorizontalScroll />

      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Booking" variant="booking">
        <BookingForm floors={floors} rooms={rooms} beds={beds} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </RightDrawer>

      <RightDrawer
        open={!!viewBooking}
        onClose={() => setViewBooking(null)}
        title={`Booking Details — ${viewCustomer?.name || viewBooking?.customerName || ''}`}
        variant="customer"
        footer={<Button onClick={() => setViewBooking(null)} sx={{ height: 44 }}>Close</Button>}
      >
        {viewCustomer && viewBooking && (
          <CustomerDetailCards
            customer={viewCustomer}
            booking={viewBooking}
            bed={viewBed}
            monthlyTenant={viewMonthly}
          />
        )}
      </RightDrawer>

      <RightDrawer
        open={!!editBooking}
        onClose={() => { setEditBooking(null); setEditForm(emptyEditForm) }}
        title={`Edit Booking — ${editBooking?.customerName || ''}`}
        variant="booking"
        footer={
          <>
            <Button onClick={() => { setEditBooking(null); setEditForm(emptyEditForm) }} sx={{ height: 44 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditSave} sx={primaryButtonSx}>
              Save Changes
            </Button>
          </>
        }
      >
        {editBooking && (
          <BookingEditForm
            booking={editBooking}
            customer={customers.find((c) => c.id === editBooking.customerId)}
            floors={floors}
            rooms={rooms}
            beds={beds}
            form={editForm}
            onChange={updateEditForm}
          />
        )}
      </RightDrawer>
    </>
  )
}

const Bookings = () => (
  <PageTransition className="page-container">
    <BookingsContent />
  </PageTransition>
)

export default Bookings
