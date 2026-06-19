import { useState, useMemo } from 'react'
import { Button, IconButton, TextField, MenuItem, Dialog, DialogTitle, DialogContent, Divider, Typography, Box } from '@mui/material'
import { Plus, Eye, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import DatePickerField from '../components/DatePickerField'
import { combineDateAndTime, splitDateTime } from '../components/DateTimeSplitField'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import DateTimeStack from '../components/DateTimeStack'
import BookingForm from '../components/BookingForm'
import BookingViewModal from '../components/BookingViewModal'
import BookingEditForm from '../components/BookingEditForm'
import { useAuth, useAppDispatch, useHotel, useBookings, useCustomers } from '../hooks/useStore'
import { addCustomer, updateCustomer } from '../redux/slices/customerSlice'
import { addBooking, updateBooking, deleteBooking } from '../redux/slices/bookingSlice'
import { updateBed } from '../redux/slices/hotelSlice'
import { formatCurrency, ROLES, getPaymentStatus, formatStayDuration } from '../utils/helpers'
import { filterFieldSx, primaryButtonSx } from '../utils/layout'

const emptyEditForm = {
  name: '', phone: '', address: '', city: '', state: '', aadhaar: '', pan: '',
  totalAmount: '', advancePaid: '',
  paymentDate: '', paymentTime: '12:00', paymentType: 'Cash', paymentStatus: 'pending',
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
  const dispatch = useAppDispatch()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewBooking, setViewBooking] = useState(null)
  const [editBooking, setEditBooking] = useState(null)
  const [search, setSearch] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [editForm, setEditForm] = useState(emptyEditForm)

  const updateEditForm = (patch) => setEditForm((prev) => ({ ...prev, ...patch }))

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

  const handleSubmit = (data) => {
    const bed = beds.find((b) => b.id === data.bedId)
    const customerId = `cust-${Date.now()}`
    const checkInDate = data.checkInDateTime?.split('T')[0] || new Date().toISOString().split('T')[0]

    dispatch(addCustomer({
      id: customerId,
      name: data.name,
      phone: data.phone,
      email: `${data.name.replace(/\s+/g, '.').toLowerCase()}@email.com`,
      address: data.address,
      city: data.city,
      state: data.state,
      aadhaar: data.aadhaar,
      pan: data.pan,
      photo: data.photo,
      aadhaarDoc: data.aadhaarDoc,
      panDoc: data.panDoc,
      status: 'checked-in',
      roomId: data.roomId,
      bedId: data.bedId,
      roomNumber: bed?.roomNumber,
      bedNumber: bed?.bedNumber,
      checkInDate,
      checkInDateTime: data.checkInDateTime,
    }))
    dispatch(updateBed({ ...bed, status: 'occupied', customerId }))
    dispatch(addBooking({
      id: `booking-${Date.now()}`,
      customerId,
      customerName: data.name,
      phone: data.phone,
      bedId: data.bedId,
      roomId: data.roomId,
      roomNumber: bed?.roomNumber,
      bedNumber: bed?.bedNumber,
      floorNumber: bed?.floorNumber,
      stayType: data.stayType,
      duration: data.duration,
      bedCost: data.bedCost,
      totalAmount: data.totalAmount,
      advancePaid: data.advancePaid,
      balanceAmount: data.balanceAmount,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      status: 'active',
      checkInDate,
      checkInDateTime: data.checkInDateTime,
      checkOutDateTime: data.checkOutDateTime || '',
      createdAt: checkInDate,
      payments: data.advancePaid > 0 ? [{ amount: data.advancePaid, date: data.checkInDateTime, type: data.paymentType, status: data.paymentStatus }] : [],
    }))
    setDrawerOpen(false)
  }

  const handleDelete = (row) => {
    const booking = row.booking
    const bed = beds.find((b) => b.id === booking.bedId)
    if (bed) dispatch(updateBed({ ...bed, status: 'vacant', customerId: null }))
    dispatch(deleteBooking(booking.id))
    toast.success('Booking deleted')
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
      paymentDate: '',
      paymentTime: new Date().toTimeString().slice(0, 5),
      paymentType: b.paymentType || 'Cash',
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

  const handleEditSave = () => {
    if (!editBooking) return
    let updated = { ...editBooking }
    let changed = false
    const customer = customers.find((c) => c.id === editBooking.customerId)
    const newTotal = Number(editForm.totalAmount) || updated.totalAmount || 0
    const newAdvance = Number(editForm.advancePaid) || 0
    const newBalance = Math.max(0, newTotal - newAdvance)

    if (customer) {
      const customerChanged =
        editForm.name !== customer.name ||
        editForm.phone !== customer.phone ||
        editForm.address !== customer.address ||
        editForm.city !== customer.city ||
        editForm.state !== customer.state ||
        editForm.aadhaar !== customer.aadhaar ||
        editForm.pan !== customer.pan

      if (customerChanged) {
        dispatch(updateCustomer({
          ...customer,
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          aadhaar: editForm.aadhaar,
          pan: editForm.pan,
        }))
        changed = true
      }
    }

    if (
      editForm.name !== updated.customerName ||
      editForm.phone !== (customer?.phone || updated.phone) ||
      newTotal !== updated.totalAmount ||
      newAdvance !== updated.advancePaid ||
      editForm.paymentType !== updated.paymentType ||
      editForm.paymentStatus !== updated.paymentStatus
    ) {
      updated = {
        ...updated,
        customerName: editForm.name,
        phone: editForm.phone,
        totalAmount: newTotal,
        advancePaid: newAdvance,
        balanceAmount: newBalance,
        paymentType: editForm.paymentType,
        paymentStatus: editForm.paymentStatus,
      }
      changed = true
    }

    if (editForm.paymentDate && (updated.balanceAmount || 0) > 0) {
      const paymentDateTime = combineDateAndTime(editForm.paymentDate, editForm.paymentTime)
      const payAmount = updated.balanceAmount || 0
      const paidAdvance = (updated.advancePaid || 0) + payAmount
      const paidStatus = editForm.paymentStatus === 'completed' ? 'completed' : 'pending'
      updated = {
        ...updated,
        advancePaid: paidAdvance,
        balanceAmount: 0,
        paymentStatus: paidStatus,
        paymentType: editForm.paymentType,
        payments: [...(updated.payments || []), {
          amount: payAmount,
          date: paymentDateTime,
          type: editForm.paymentType,
          status: paidStatus,
        }],
      }
      changed = true
    }

    const extAmount = Number(editForm.extendedAmount) || 0
    if (editForm.extendedDate && extAmount > 0) {
      const extendedUpto = combineDateAndTime(editForm.extendedDate, editForm.extendedTime)
      const extendedPaymentDateTime = editForm.extendedPaymentDate
        ? combineDateAndTime(editForm.extendedPaymentDate, editForm.extendedTime)
        : ''
      updated = {
        ...updated,
        extendedUpto,
        extendedAmount: (updated.extendedAmount || 0) + extAmount,
        extendedStatus: editForm.extendedStatus,
        extendedPaymentType: editForm.extendedPaymentType,
        extendedPaymentDate: extendedPaymentDateTime || editForm.extendedPaymentDate,
        totalAmount: (updated.totalAmount || 0) + extAmount,
        balanceAmount: (updated.balanceAmount || 0) + extAmount,
        paymentStatus: editForm.extendedStatus === 'completed' ? updated.paymentStatus : 'pending',
      }
      changed = true
    }

    if (editForm.newBedId && editForm.newBedId !== editBooking.bedId) {
      if (!editForm.shiftDate) { toast.error('Enter shift date'); return }

      const newBed = beds.find((b) => b.id === editForm.newBedId)
      const oldBed = beds.find((b) => b.id === editBooking.bedId)
      if (!newBed) { toast.error('Invalid bed selected'); return }

      const shiftRecord = {
        shiftType: 'Room Shift',
        oldRoomNumber: editBooking.roomNumber,
        oldBedNumber: editBooking.bedNumber,
        oldFloorNumber: editBooking.floorNumber,
        newRoomNumber: newBed.roomNumber,
        newBedNumber: newBed.bedNumber,
        newFloorNumber: newBed.floorNumber,
        shiftDate: editForm.shiftDate,
        createdAt: new Date().toISOString(),
      }

      if (oldBed) dispatch(updateBed({ ...oldBed, status: 'vacant', customerId: null }))
      dispatch(updateBed({ ...newBed, status: 'occupied', customerId: editBooking.customerId }))

      if (customer) {
        dispatch(updateCustomer({
          ...customer,
          roomId: newBed.roomId,
          bedId: newBed.id,
          roomNumber: newBed.roomNumber,
          bedNumber: newBed.bedNumber,
        }))
      }

      updated = {
        ...updated,
        bedId: newBed.id,
        roomId: newBed.roomId,
        roomNumber: newBed.roomNumber,
        bedNumber: newBed.bedNumber,
        floorNumber: newBed.floorNumber,
        shifts: [...(updated.shifts || []), shiftRecord],
      }
      changed = true
    }

    if (!changed) {
      toast.error('Update booking details before saving')
      return
    }

    dispatch(updateBooking(updated))
    toast.success('Booking updated')
    setEditBooking(null)
    setEditForm(emptyEditForm)
  }

  const columns = [
    { field: 'customerName', headerName: 'Customer Name', minWidth: 140 },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'floorNumber', headerName: 'Floor', width: 70 },
    { field: 'roomNumber', headerName: 'Room', width: 70 },
    { field: 'bedNumber', headerName: 'Bed', width: 60 },
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
    { field: 'advancePaid', headerName: 'Advance', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'balanceAmount', headerName: 'Balance', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'paymentType', headerName: 'Payment Type', width: 120 },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 140,
      allowWrap: true,
      renderCell: ({ row }) => <PaymentStatusBadge status={row.paymentStatus} balanceAmount={row.balanceAmount} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
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

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">Bookings</h2>
          <p className="page-subtitle">{tableRows.length} bookings</p>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDrawerOpen(true)} sx={{ ...primaryButtonSx, flexShrink: 0 }}>
          Add Booking
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <TextField label="Search Booking" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
        <DatePickerField label="Booking Date" value={bookingDate} onChange={setBookingDate} sx={filterFieldSx} />
        <TextField select label="Payment Status" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} sx={filterFieldSx}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
      </div>

      <MuiDataGrid rows={tableRows} columns={columns} pageSize={10} />

      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Booking" variant="booking">
        <BookingForm floors={floors} rooms={rooms} beds={beds} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </RightDrawer>

      <BookingViewModal
        open={!!viewBooking}
        onClose={() => setViewBooking(null)}
        booking={viewBooking}
        customer={viewCustomer}
      />

      <Dialog open={!!editBooking} onClose={() => { setEditBooking(null); setEditForm(emptyEditForm) }} fullScreen>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Edit Booking</Typography>
            <Typography variant="body2" color="text.secondary">{editBooking?.customerName}</Typography>
          </Box>
          <IconButton onClick={() => { setEditBooking(null); setEditForm(emptyEditForm) }} aria-label="Close">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {editBooking && (
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
              <BookingEditForm
                booking={editBooking}
                customer={customers.find((c) => c.id === editBooking.customerId)}
                floors={floors}
                rooms={rooms}
                beds={beds}
                form={editForm}
                onChange={updateEditForm}
                onSave={handleEditSave}
                onCancel={() => { setEditBooking(null); setEditForm(emptyEditForm) }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

const Bookings = () => (
  <PageTransition className="page-container">
    <BookingsContent />
  </PageTransition>
)

export default Bookings
