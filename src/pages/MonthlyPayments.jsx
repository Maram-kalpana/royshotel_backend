import { useState, useMemo, useEffect } from 'react'
import { Tabs, Tab, Button, IconButton } from '@mui/material'
import { Plus, History, CheckCircle, Pencil, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import PaymentHistoryModal from '../components/monthlyPayments/PaymentHistoryModal'
import MarkPaidModal from '../components/monthlyPayments/MarkPaidModal'
import TenantForm from '../components/monthlyPayments/TenantForm'
import CustomerDetailCards from '../components/CustomerDetailCards'
import MonthlyPaymentStatusBadge from '../components/monthlyPayments/MonthlyPaymentStatusBadge'
import { useMonthlyPayments, useAppDispatch, useHotel, useCustomers, useBookings } from '../hooks/useStore'
import { markTenantPaid, addTenant, updateTenant, deleteTenant } from '../redux/slices/monthlyPaymentsSlice'
import { addCustomer, updateCustomer, checkoutCustomer } from '../redux/slices/customerSlice'
import { addBooking, updateBooking, deleteBooking } from '../redux/slices/bookingSlice'
import { updateBed } from '../redux/slices/hotelSlice'
import { formatCurrency, displayValue } from '../utils/helpers'
import { primaryButtonSx } from '../utils/layout'
import { loadMonthlyPayments } from '../services/dataService'
import {
  getDueDateLabel,
  getCurrentMonthYear,
  isCurrentMonthPending,
  resolveTenantStatus,
  MONTHLY_PAYMENT_STATUS,
} from '../utils/monthlyPaymentHelpers'

const TAB_ALL = 0
const TAB_PAID = 1
const TAB_PENDING = 2

const MonthlyPayments = () => {
  const { tenants } = useMonthlyPayments()
  const { floors, rooms, beds } = useHotel()
  const { list: customers } = useCustomers()
  const { list: bookings } = useBookings()
  const dispatch = useAppDispatch()

  const [tab, setTab] = useState(TAB_ALL)
  const [historyTenant, setHistoryTenant] = useState(null)
  const [markPaidTenant, setMarkPaidTenant] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)
  const [viewTenant, setViewTenant] = useState(null)

  useEffect(() => {
    loadMonthlyPayments(dispatch).catch(console.error)
  }, [dispatch])

  const currentMonth = getCurrentMonthYear()

  const tableRows = useMemo(() => tenants.map((t) => ({
    id: t.id,
    customerName: displayValue(t.customerName),
    roomNumber: displayValue(t.roomNumber),
    monthlyRent: t.monthlyRent,
    dueDate: getDueDateLabel(t.dueDay),
    lastPaidMonth: displayValue(t.lastPaidMonth, '—'),
    status: resolveTenantStatus(t, currentMonth),
    tenant: t,
  })), [tenants, currentMonth])

  const filteredRows = useMemo(() => {
    if (tab === TAB_PAID) {
      return tableRows.filter((r) => r.status === MONTHLY_PAYMENT_STATUS.PAID)
    }
    if (tab === TAB_PENDING) {
      return tableRows.filter((r) => isCurrentMonthPending(r.tenant, currentMonth))
    }
    return tableRows
  }, [tableRows, tab, currentMonth])

  const editCustomer = editTenant ? customers.find((c) => c.id === editTenant.customerId) : null
  const editBooking = editTenant ? bookings.find((b) => b.customerId === editTenant.customerId) : null

  const buildTenantPayload = (data, existingTenant = null) => {
    const bed = beds.find((b) => b.id === data.bedId)
    const checkInDate = data.checkInDateTime?.split('T')[0] || data.checkInDate
    return {
      customerName: data.name,
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
      floorId: data.floorId,
      roomId: data.roomId,
      bedId: data.bedId,
      roomNumber: bed?.roomNumber || existingTenant?.roomNumber,
      bedNumber: bed?.bedNumber,
      floorNumber: bed?.floorNumber,
      checkInDate,
      checkInDateTime: data.checkInDateTime,
      checkOutDate: data.checkOutDate || null,
      checkOutDateTime: data.checkOutDateTime || '',
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      stayType: 'Months',
      duration: data.duration,
      monthlyRent: data.monthlyRent,
      dueDay: data.dueDay,
      securityDeposit: data.securityDeposit,
      advancePaid: data.advancePaid,
      advancePaidDate: data.advancePaidDate || data.paymentDate,
      totalAmount: data.totalAmount,
      balanceAmount: data.balanceAmount,
      paymentDate: data.paymentDate,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
    }
  }

  const syncCustomerAndBooking = (data, customerId, bookingId, isNew) => {
    const bed = beds.find((b) => b.id === data.bedId)
    const checkInDate = data.checkInDateTime?.split('T')[0] || data.checkInDate
    const customerPayload = {
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
      stayType: 'Monthly',
      roomId: data.roomId,
      bedId: data.bedId,
      roomNumber: bed?.roomNumber,
      bedNumber: bed?.bedNumber,
      floorNumber: bed?.floorNumber,
      checkInDate,
      checkInDateTime: data.checkInDateTime,
      checkOutDate: data.checkOutDate || null,
      checkOutDateTime: data.checkOutDateTime || '',
      checkInTime: data.checkInTime,
      exitDate: data.checkOutDate,
      exitTime: data.checkOutTime,
      monthlyRent: data.monthlyRent,
      dueDay: data.dueDay,
      securityDeposit: data.securityDeposit,
    }

    const bookingPayload = {
      id: bookingId,
      customerId,
      customerName: data.name,
      phone: data.phone,
      bedId: data.bedId,
      roomId: data.roomId,
      roomNumber: bed?.roomNumber,
      bedNumber: bed?.bedNumber,
      floorNumber: bed?.floorNumber,
      stayType: 'Months',
      duration: data.duration,
      bedCost: bed?.cost || data.monthlyRent,
      totalAmount: data.totalAmount,
      advancePaid: data.advancePaid,
      balanceAmount: data.balanceAmount,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      paymentDate: data.paymentDate,
      status: 'active',
      checkInDate,
      checkInDateTime: data.checkInDateTime,
      checkOutDateTime: data.checkOutDateTime || '',
      createdAt: checkInDate,
      payments: data.advancePaid > 0
        ? [{ amount: data.advancePaid, date: data.paymentDate, type: data.paymentType, status: data.paymentStatus }]
        : [],
    }

    if (isNew) {
      dispatch(addCustomer(customerPayload))
      dispatch(addBooking(bookingPayload))
      if (bed) dispatch(updateBed({ ...bed, status: 'occupied', customerId }))
    } else {
      dispatch(updateCustomer(customerPayload))
      dispatch(updateBooking(bookingPayload))
    }
  }

  const handleAddTenant = (data) => {
    const customerId = `cust-${Date.now()}`
    const tenantId = `mp-${Date.now()}`
    syncCustomerAndBooking(data, customerId, `booking-${Date.now()}`, true)
    dispatch(addTenant({
      id: tenantId,
      customerId,
      ...buildTenantPayload(data),
    }))
    toast.success('Monthly tenant added successfully')
    setDrawerOpen(false)
  }

  const handleEditTenant = (data) => {
    if (!editTenant) return
    const customerId = editTenant.customerId || `cust-${Date.now()}`
    const booking = bookings.find((b) => b.customerId === customerId)
    syncCustomerAndBooking(data, customerId, booking?.id || `booking-${Date.now()}`, !editTenant.customerId)

    dispatch(updateTenant({
      tenantId: editTenant.id,
      customerId,
      ...buildTenantPayload(data, editTenant),
    }))
    toast.success('Tenant updated successfully')
    setEditTenant(null)
  }

  const handleMarkPaid = (payload) => {
    dispatch(markTenantPaid(payload))
    toast.success(`Payment recorded for ${markPaidTenant.customerName}`)
    setMarkPaidTenant(null)
  }

  const openAdd = () => { setEditTenant(null); setDrawerOpen(true) }
  const openEdit = (tenant) => { setDrawerOpen(false); setViewTenant(null); setEditTenant(tenant) }
  const openView = (tenant) => { setEditTenant(null); setViewTenant(tenant) }

  const handleDelete = (tenant) => {
    if (tenant.customerId) {
      const booking = bookings.find((b) => b.customerId === tenant.customerId)
      const bed = beds.find((b) => b.id === tenant.bedId || b.id === booking?.bedId)
      if (bed) dispatch(updateBed({ ...bed, status: 'vacant', customerId: null }))
      if (booking) dispatch(deleteBooking(booking.id))
      dispatch(checkoutCustomer(tenant.customerId))
    }
    dispatch(deleteTenant(tenant.id))
    toast.success(`Tenant ${tenant.customerName} removed`)
  }

  const viewCustomer = viewTenant ? customers.find((c) => c.id === viewTenant.customerId) : null
  const viewBooking = viewTenant ? bookings.find((b) => b.customerId === viewTenant.customerId) : null
  const viewBed = viewTenant ? beds.find((b) => b.id === (viewTenant.bedId || viewCustomer?.bedId)) : null
  const viewCustomerMerged = viewTenant ? {
    ...(viewCustomer || {}),
    ...viewTenant,
    id: viewTenant.customerId || viewTenant.id,
    name: viewTenant.customerName || viewCustomer?.name,
    email: viewCustomer?.email,
    photo: viewTenant.photo || viewCustomer?.photo,
    aadhaarDoc: viewTenant.aadhaarDoc || viewCustomer?.aadhaarDoc,
    panDoc: viewTenant.panDoc || viewCustomer?.panDoc,
    checkInDateTime: viewTenant.checkInDateTime || viewBooking?.checkInDateTime || viewCustomer?.checkInDateTime,
    checkOutDateTime: viewTenant.checkOutDateTime || viewBooking?.checkOutDateTime || '',
    stayType: 'Monthly',
  } : null

  const columns = [
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'roomNumber', headerName: 'Room Number', width: 110 },
    { field: 'monthlyRent', headerName: 'Monthly Rent', minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'dueDate', headerName: 'Due Date', minWidth: 160 },
    { field: 'lastPaidMonth', headerName: 'Last Paid Month', minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ row }) => <MonthlyPaymentStatusBadge status={row.status} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 190,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="info" onClick={() => openView(row.tenant)} title="View">
            <Eye size={16} />
          </IconButton>
          <IconButton size="small" color="info" onClick={() => setHistoryTenant(row.tenant)} title="View History">
            <History size={16} />
          </IconButton>
          <IconButton size="small" color="success" onClick={() => setMarkPaidTenant(row.tenant)} title="Mark Paid">
            <CheckCircle size={16} />
          </IconButton>
          <IconButton size="small" color="primary" onClick={() => openEdit(row.tenant)} title="Edit Tenant">
            <Pencil size={16} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row.tenant)} title="Delete">
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="toolbar-row" style={{ marginBottom: 12, borderBottom: 'none' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 48 }}>
          <Tab label="All Tenants" sx={{ minHeight: 48, py: 1.5 }} />
          <Tab label="Paid" sx={{ minHeight: 48, py: 1.5 }} />
          <Tab label="Pending" sx={{ minHeight: 48, py: 1.5 }} />
        </Tabs>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd} sx={{ ...primaryButtonSx, flexShrink: 0 }}>
          Add Tenant
        </Button>
      </div>

      <MuiDataGrid rows={filteredRows} columns={columns} pageSize={10} />

      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Monthly Tenant"
        variant="booking"
      >
        <TenantForm
          floors={floors}
          rooms={rooms}
          beds={beds}
          onSubmit={handleAddTenant}
          onCancel={() => setDrawerOpen(false)}
        />
      </RightDrawer>

      <RightDrawer
        open={!!editTenant}
        onClose={() => setEditTenant(null)}
        title={`Edit Tenant — ${editTenant?.customerName || ''}`}
        variant="booking"
      >
        {editTenant && (
          <TenantForm
            floors={floors}
            rooms={rooms}
            beds={beds}
            tenant={editTenant}
            customer={editCustomer}
            booking={editBooking}
            editMode
            onSubmit={handleEditTenant}
            onCancel={() => setEditTenant(null)}
          />
        )}
      </RightDrawer>

      <PaymentHistoryModal
        open={!!historyTenant}
        onClose={() => setHistoryTenant(null)}
        tenant={historyTenant}
      />

      <MarkPaidModal
        open={!!markPaidTenant}
        onClose={() => setMarkPaidTenant(null)}
        tenant={markPaidTenant}
        onSubmit={handleMarkPaid}
      />

      <RightDrawer
        open={!!viewTenant}
        onClose={() => setViewTenant(null)}
        title={`Tenant Details — ${viewTenant?.customerName || ''}`}
        variant="customer"
        footer={<Button onClick={() => setViewTenant(null)} sx={{ height: 44 }}>Close</Button>}
      >
        {viewCustomerMerged && (
          <CustomerDetailCards
            customer={viewCustomerMerged}
            booking={viewBooking}
            bed={viewBed}
            monthlyTenant={viewTenant}
          />
        )}
      </RightDrawer>
    </PageTransition>
  )
}

export default MonthlyPayments
