import { useState, useMemo, useEffect } from 'react'
import { Button, IconButton, TextField, MenuItem, Box, Typography } from '@mui/material'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import DatePickerField from '../components/DatePickerField'
import { combineDateAndTime, splitDateTime } from '../components/DateTimeSplitField'
import BookingForm from '../components/BookingForm'
import BookingEditForm from '../components/BookingEditForm'
import CustomerDetailCards from '../components/CustomerDetailCards'
import { MergedCell, VerticalActions, CompactIconButton } from '../components/tableCells'
import { useAuth, useAppDispatch, useHotel, useBookings, useCustomers, useMonthlyPayments } from '../hooks/useStore'
import { useVacancyOptions } from '../hooks/useVacancyOptions'
import { formatCurrency, ROLES, getPaymentStatus, formatStayDuration } from '../utils/helpers'
import PageToolbar from '../components/PageToolbar'
import { filterFieldSx, primaryButtonSx, toolbarEqualFieldSx, toolbarButtonSx } from '../utils/layout'
import { filterVacantBeds, normId } from '../utils/vacancyHelpers'
import { loadBookings, loadCustomers, loadRooms } from '../services/dataService'
import { bookingsApi } from '../services/endpoints'

const LocationCell = ({ floorNumber, roomNumber, bedNumber }) => (
  <Box sx={{ lineHeight: 1.25, py: 0.25 }}>
    <Box sx={{ fontSize: '0.6875rem', color: '#64748b' }}>F{floorNumber ?? '—'}</Box>
    <Box sx={{ fontSize: '0.75rem', color: '#334155', fontWeight: 500 }}>R{roomNumber ?? '—'}</Box>
    <Box sx={{ fontSize: '0.6875rem', color: '#64748b' }}>B{bedNumber ?? '—'}</Box>
  </Box>
)

const emptyEditForm = {
  name: '', phone: '', address: '', city: '', state: '', aadhaar: '', pan: '',
  totalAmount: '', advancePaid: '',
  advancePaymentType: 'Cash', advancePaymentDate: '',
  balancePaymentType: 'Cash', balancePaymentDate: '',
  paymentStatus: 'pending',
  checkOutDate: '', checkOutTime: '12:00',
  extendedDate: '', extendedTime: '12:00', extendedAmount: '', extendedStatus: 'pending',
  extendedPaymentType: 'Cash', extendedPaymentDate: '',
  shiftDate: '', newFloorId: '', newRoomId: '', newBedId: '',
}

const BookingsContent = () => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const { floors: storeFloors, rooms: storeRooms, beds: storeBeds } = useHotel()
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
  const [editSnapshot, setEditSnapshot] = useState(null)
  const updateEditForm = (patch) => setEditForm((prev) => ({ ...prev, ...patch }))

  const vacancy = useVacancyOptions({ enabled: drawerOpen || !!editBooking, debugLabel: 'BookingForm' })
  const floors = drawerOpen || editBooking ? vacancy.floors : storeFloors
  const rooms = drawerOpen || editBooking ? vacancy.rooms : storeRooms
  const beds = drawerOpen || editBooking ? vacancy.beds : storeBeds
  const roomsLoading = vacancy.loading

  useEffect(() => {
    Promise.all([
      loadBookings(dispatch),
      loadCustomers(dispatch),
      loadRooms(dispatch),
    ]).catch(console.error)
  }, [dispatch])

  const tableRows = useMemo(() => {
    let rows = bookings
      .filter((b) => !['Months', 'Monthly'].includes(b.stayType))
      .filter((b) => isSuperAdmin ? ['active', 'reserved', 'booked'].includes(b.status) : true)
      .map((b) => {
        const customer = customers.find((c) => String(c.id) === String(b.customerId))
        const status = b.paymentStatus || getPaymentStatus(b.balanceAmount)
        const bookingDate = (b.checkInDateTime || b.checkInDate || '').split('T')[0]
        const payments = b.payments || []
        const completedPayments = payments.filter((p) => p.status === 'completed')
        const advancePayment = completedPayments[0]
        const balancePayment = completedPayments.length > 1
          ? completedPayments[completedPayments.length - 1]
          : null
        const advanceStatus = (b.advancePaid ?? 0) > 0 ? 'completed' : 'pending'
        const balanceStatus = status === 'completed' ? 'completed' : 'pending'
        return {
          id: b.id,
          customerName: b.customerName,
          phone: customer?.phone || b.phone || '—',
          floorNumber: b.floorNumber,
          roomNumber: b.roomNumber,
          bedNumber: b.bedNumber,
          checkInDateTime: b.checkInDateTime || b.checkInDate,
          bookingDate,
          checkOutDateTime: b.checkOutDateTime || '',
          extendedUpto: b.extendedUpto || '',
          extendedAmount: b.extendedAmount ?? 0,
          extendedPaymentType: b.extendedPaymentType || '',
          extendedPaymentDate: b.extendedPaymentDate || '',
          extendedStatus: b.extendedStatus || '',
          stayDuration: formatStayDuration(b.duration, b.stayType, b.durationLabel),
          totalAmount: b.totalAmount,
          advancePaid: b.advancePaid ?? 0,
          advancePaymentType: advancePayment?.type || b.paymentType || 'Cash',
          advancePaymentDate: advancePayment?.date?.split('T')[0] || bookingDate,
          advancePaymentStatus: advanceStatus,
          paymentType: b.paymentType || '—',
          paymentStatus: status,
          balanceAmount: b.balanceAmount ?? 0,
          balancePaymentType: balancePayment?.type || b.paymentType || 'Cash',
          balancePaymentDate: balancePayment?.date?.split('T')[0] || (balanceStatus === 'completed' ? bookingDate : ''),
          balancePaymentStatus: balanceStatus,
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
    if (!data.floorId || !data.roomId || !data.bedId) {
      toast.error('Please select floor, room, and bed')
      return
    }
    const bed = beds.find((b) => String(b.id) === String(data.bedId))
    if (!bed || !filterVacantBeds([bed]).length) {
      toast.error('Selected bed is no longer available. Please choose another bed.')
      await vacancy.reload()
      return
    }

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
        aadhaarFront: data.aadhaarFront,
        aadhaarBack: data.aadhaarBack,
        bedId: data.bedId,
        stayType: data.stayType,
        duration: data.duration,
        durationLabel: data.durationLabel,
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
    const checkout = splitDateTime(b.checkOutDateTime || '')
    const snapshot = {
      checkOutDate: checkout.date,
      checkOutTime: checkout.time || '12:00',
      extendedDate: ext.date,
      extendedTime: ext.time || '12:00',
      extendedStatus: b.extendedStatus || 'pending',
      extendedPaymentType: b.extendedPaymentType || 'Cash',
      extendedPaymentDate: b.extendedPaymentDate?.split('T')[0] || '',
    }
    setEditSnapshot(snapshot)
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
      advancePaymentStatus: b.paymentStatus === 'completed' ? 'completed' : 'pending',
      balancePaymentType: b.paymentType || 'Cash',
      balancePaymentDate: b.paymentStatus === 'completed' && b.balanceAmount <= 0 ? today : '',
      balancePaymentStatus: b.paymentStatus === 'completed' ? 'completed' : 'pending',
      paymentStatus: b.paymentStatus || getPaymentStatus(b.balanceAmount),
      checkOutDate: checkout.date,
      checkOutTime: checkout.time || '12:00',
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

    const shiftStarted = editForm.newFloorId || editForm.newRoomId || editForm.newBedId
    if (shiftStarted) {
      if (!editForm.newFloorId || !editForm.newRoomId || !editForm.newBedId) {
        toast.error('Please select floor, room, and bed for room shift')
        return
      }
      if (!editForm.shiftDate) {
        toast.error('Please select a shift date')
        return
      }
    }

    const newTotal = Number(editForm.totalAmount) || editBooking.totalAmount || 0
    const newAdvance = Number(editForm.advancePaid) || 0
    const newBalance = Math.max(0, newTotal - newAdvance)
    const balanceMarkedPaid = editForm.balancePaymentStatus === 'completed'
    const effectiveBalance = balanceMarkedPaid ? 0 : newBalance

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
      balanceAmount: effectiveBalance,
      paymentType: editForm.advancePaymentType,
      balancePaymentStatus: editForm.balancePaymentStatus,
      paymentStatus: balanceMarkedPaid ? 'completed' : editForm.paymentStatus,
      checkOutDateTime: editBooking.checkOutDateTime,
      extendedUpto: editBooking.extendedUpto,
      extendedAmount: editBooking.extendedAmount,
      extendedStatus: editBooking.extendedStatus,
      extendedPaymentType: editBooking.extendedPaymentType,
      extendedPaymentDate: editBooking.extendedPaymentDate,
      status: editBooking.status,
    }

    if (balanceMarkedPaid && newBalance > 0) {
      payload.balancePaymentAmount = newBalance
      payload.balancePaymentType = editForm.balancePaymentType || 'Cash'
      if (editForm.balancePaymentDate) {
        payload.balancePaymentDate = combineDateAndTime(editForm.balancePaymentDate, editForm.paymentTime || '12:00')
        payload.paymentType = editForm.balancePaymentType || 'Cash'
      }
    } else if (editForm.balancePaymentDate && newBalance > 0) {
      payload.balancePaymentDate = combineDateAndTime(editForm.balancePaymentDate, editForm.paymentTime || '12:00')
      payload.balancePaymentAmount = newBalance
      payload.balancePaymentType = editForm.balancePaymentType
      payload.paymentType = editForm.balancePaymentType
      payload.paymentStatus = 'completed'
      payload.balanceAmount = 0
    }

    const checkoutChanged = editSnapshot && (
      editForm.checkOutDate !== editSnapshot.checkOutDate ||
      editForm.checkOutTime !== editSnapshot.checkOutTime
    )
    if (checkoutChanged && editForm.checkOutDate) {
      payload.checkOutDateTime = combineDateAndTime(editForm.checkOutDate, editForm.checkOutTime || '12:00')
      payload.status = 'completed'
    }

    if (editForm.newBedId) {
      payload.newBedId = editForm.newBedId
      payload.newRoomId = editForm.newRoomId
      payload.newFloorId = editForm.newFloorId
      payload.shiftDate = editForm.shiftDate
    }

    const extChanged = editSnapshot && (
      editForm.extendedDate !== editSnapshot.extendedDate ||
      editForm.extendedTime !== editSnapshot.extendedTime ||
      editForm.extendedStatus !== editSnapshot.extendedStatus ||
      editForm.extendedPaymentType !== editSnapshot.extendedPaymentType ||
      editForm.extendedPaymentDate !== editSnapshot.extendedPaymentDate ||
      Number(editForm.extendedAmount) > 0
    )
    const extAmount = Number(editForm.extendedAmount) || 0
    if (extChanged && editForm.extendedDate) {
      payload.extendedUpto = combineDateAndTime(editForm.extendedDate, editForm.extendedTime)
      if (extAmount > 0) {
        payload.extendedAmount = (editBooking.extendedAmount || 0) + extAmount
        payload.totalAmount = newTotal + extAmount
        payload.balanceAmount = (payload.balanceAmount ?? effectiveBalance) + extAmount
      }
      payload.extendedStatus = editForm.extendedStatus
      payload.extendedPaymentType = editForm.extendedPaymentType
      payload.extendedPaymentDate = editForm.extendedPaymentDate
        ? combineDateAndTime(editForm.extendedPaymentDate, '12:00')
        : null
      if (editForm.extendedStatus !== 'completed') {
        payload.paymentStatus = 'pending'
      }
    }

    try {
      await bookingsApi.update(editBooking.id, payload)
      await reloadBookingData()
      toast.success('Booking updated')
      setEditBooking(null)
      setEditSnapshot(null)
      setEditForm(emptyEditForm)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking')
    }
  }

  const bookingColumns = useMemo(() => [
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 100,
      allowWrap: true,
      renderCell: ({ row }) => (
        <Box sx={{ lineHeight: 1.3, py: 0.25 }}>
          <Box sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{row.customerName}</Box>
          <Box sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{row.phone}</Box>
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Room & Bed',
      width: 68,
      minWidth: 64,
      allowWrap: true,
      renderCell: ({ row }) => (
        <LocationCell floorNumber={row.floorNumber} roomNumber={row.roomNumber} bedNumber={row.bedNumber} />
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      width: 72,
      minWidth: 68,
      valueFormatter: (v) => formatCurrency(v),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <IconButton size="small" color="primary" onClick={() => setViewBooking(row.booking)} title="View"><Eye size={16} /></IconButton>
          <IconButton size="small" color="info" onClick={() => openEdit(row)} title="Edit"><Pencil size={16} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ], [])

  const compactColumns = useMemo(() => [
    {
      field: 'details',
      headerName: 'Booking',
      compactWidth: '58%',
      allowWrap: true,
      renderCell: ({ row }) => (
        <MergedCell lines={[
          row.customerName,
          row.phone,
          `R${row.roomNumber ?? '—'} · B${row.bedNumber ?? '—'}`,
        ]} />
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Amt',
      compactWidth: '20%',
      valueFormatter: (v) => formatCurrency(v),
    },
    {
      field: 'actions',
      headerName: '',
      compactWidth: '22%',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <VerticalActions>
          <CompactIconButton color="primary" onClick={() => setViewBooking(row.booking)} title="View"><Eye /></CompactIconButton>
          <CompactIconButton color="info" onClick={() => openEdit(row)} title="Edit"><Pencil /></CompactIconButton>
          <CompactIconButton color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 /></CompactIconButton>
        </VerticalActions>
      ),
    },
  ], [])

  const columns = bookingColumns

  const viewCustomer = viewBooking ? customers.find((c) => String(c.id) === String(viewBooking.customerId)) : null
  const viewBed = viewBooking ? beds.find((b) => String(b.id) === String(viewBooking.bedId)) : null
  const viewMonthly = viewBooking ? tenants.find((t) => String(t.customerId) === String(viewBooking.customerId)) : null

  return (
    <>
      <PageToolbar
        filters={(
          <>
            <TextField
              placeholder="Search..."
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={toolbarEqualFieldSx}
              size="small"
              InputLabelProps={{ sx: { display: { xs: 'none', sm: 'block' } } }}
            />
            <DatePickerField
              label="Booking Date"
              value={bookingDate}
              onChange={setBookingDate}
              sx={toolbarEqualFieldSx}
            />
          </>
        )}
        secondary={(
          <>
            <TextField
              select
              label="Status"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              sx={toolbarEqualFieldSx}
              size="small"
              SelectProps={{ MenuProps: { sx: { zIndex: 1600 } } }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Paid</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDrawerOpen(true)} sx={toolbarButtonSx}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Booking</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
            </Button>
          </>
        )}
      />

      <MuiDataGrid rows={tableRows} columns={columns} compactColumns={compactColumns} pageSize={10} noHorizontalScroll />

      {vacancy.error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {vacancy.error} — try closing and reopening the form.
        </Typography>
      )}
      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Booking" variant="booking">
        {drawerOpen && (
          <BookingForm
            floors={floors}
            rooms={rooms}
            beds={beds}
            loading={roomsLoading}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
      </RightDrawer>

      <RightDrawer
        open={!!viewBooking}
        onClose={() => setViewBooking(null)}
        title={`Booking Details — ${viewCustomer?.name || viewBooking?.customerName || ''}`}
        variant="view"
        compact
        footer={<Button onClick={() => setViewBooking(null)} sx={{ height: 44 }}>Close</Button>}
      >
       {viewBooking && (
  <CustomerDetailCards
    customer={{
      // base customer fields from store
      ...(viewCustomer || {
        id: viewBooking.customerId,
        name: viewBooking.customerName,
        phone: viewBooking.phone,
      }),
      // images — pull from booking since that's where they're saved
      photo:        viewCustomer?.photo        || viewBooking?.photo,
      aadhaarDoc:   viewCustomer?.aadhaarDoc   || viewBooking?.aadhaarDoc,
      aadhaarFront: viewCustomer?.aadhaarFront || viewBooking?.aadhaarDoc  || viewBooking?.aadhaarFront,
      aadhaarBack:  viewCustomer?.aadhaarBack  || viewBooking?.aadhaarBack,
    }}
    booking={viewBooking}
    bed={viewBed}
    monthlyTenant={viewMonthly}
  />
)}
      </RightDrawer>

      <RightDrawer
        open={!!editBooking}
        onClose={() => { setEditBooking(null); setEditSnapshot(null); setEditForm(emptyEditForm) }}
        title={`Edit Booking — ${editBooking?.customerName || ''}`}
        variant="booking"
        footer={
          <>
            <Button onClick={() => { setEditBooking(null); setEditSnapshot(null); setEditForm(emptyEditForm) }} sx={{ height: 44 }}>
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
            customer={customers.find((c) => String(c.id) === String(editBooking.customerId))}
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
