import { useState, useMemo, useEffect } from 'react'
import { TextField, Button, IconButton, Box, MenuItem } from '@mui/material'
import { Plus, History, CheckCircle, Pencil, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import PaymentHistoryContent from '../components/monthlyPayments/PaymentHistoryContent'
import SplitPaymentDrawer from '../components/monthlyPayments/SplitPaymentDrawer'
import TenantForm from '../components/monthlyPayments/TenantForm'
import CustomerDetailCards from '../components/CustomerDetailCards'
import { MergedCell, GridActions } from '../components/tableCells'
import { useMonthlyPayments, useAppDispatch, useHotel, useCustomers } from '../hooks/useStore'
import { useVacancyOptions } from '../hooks/useVacancyOptions'
import { formatCurrency, displayValue } from '../utils/helpers'
import PageToolbar from '../components/PageToolbar'
import { toolbarEqualFieldSx, toolbarButtonSx } from '../utils/layout'
import { filterVacantBeds, normId } from '../utils/vacancyHelpers'
import { loadMonthlyPayments, loadCustomers, loadRooms } from '../services/dataService'
import { monthlyPaymentsApi } from '../services/endpoints'
import {
  getDueDateLabel,
  getCurrentMonthYear,
  isCurrentMonthPending,
  resolveTenantStatus,
  MONTHLY_PAYMENT_STATUS,
} from '../utils/monthlyPaymentHelpers'

const FILTER_ALL = 'all'
const FILTER_PAID = 'paid'
const FILTER_PENDING = 'pending'

const MonthlyPayments = () => {
  const { tenants } = useMonthlyPayments()
  const { floors: storeFloors, rooms: storeRooms, beds: storeBeds } = useHotel()
  const { list: customers } = useCustomers()
  const dispatch = useAppDispatch()

  const [statusFilter, setStatusFilter] = useState(FILTER_ALL)
  const [historyTenant, setHistoryTenant] = useState(null)
  const [markPaidTenant, setMarkPaidTenant] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)
  const [viewTenant, setViewTenant] = useState(null)

  const vacancy = useVacancyOptions({
    enabled: drawerOpen || !!editTenant,
    debugLabel: 'TenantForm',
  })
  const floors = drawerOpen || editTenant ? vacancy.floors : storeFloors
  const rooms = drawerOpen || editTenant ? vacancy.rooms : storeRooms
  const beds = drawerOpen || editTenant ? vacancy.beds : storeBeds
  const roomsLoading = vacancy.loading

  useEffect(() => {
    Promise.all([
      loadMonthlyPayments(dispatch),
      loadCustomers(dispatch),
      loadRooms(dispatch),
    ]).catch(console.error)
  }, [dispatch])

  const reloadTenantData = async () => {
    await Promise.all([
      loadMonthlyPayments(dispatch),
      loadCustomers(dispatch),
      loadRooms(dispatch),
    ])
  }

  const currentMonth = getCurrentMonthYear()

  const tableRows = useMemo(() => tenants.map((t) => {
    const customer = customers.find((c) => c.id === t.customerId)
    return {
      id: t.id,
      customerName: displayValue(t.customerName),
      roomNumber: displayValue(t.roomNumber),
      monthlyRent: t.monthlyRent,
      advancePaid: t.advancePaid ?? customer?.securityDeposit ?? 0,
      dueDate: getDueDateLabel(t.dueDay),
      lastPaidMonth: displayValue(t.lastPaidMonth, '—'),
      status: resolveTenantStatus(t, currentMonth),
      tenant: t,
    }
  }), [tenants, customers, currentMonth])

  const filteredRows = useMemo(() => {
    let rows = tableRows
    if (statusFilter === FILTER_PAID) {
      rows = rows.filter((r) => r.status === MONTHLY_PAYMENT_STATUS.PAID)
    } else if (statusFilter === FILTER_PENDING) {
      rows = rows.filter((r) => isCurrentMonthPending(r.tenant, currentMonth))
    }
    return rows
  }, [tableRows, statusFilter, currentMonth])

  const editCustomer = editTenant ? customers.find((c) => c.id === editTenant.customerId) : null

  const buildTenantPayload = (data, bed) => ({
    name: data.name,
    customerName: data.name,
    phone: data.phone ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    aadhaar: data.aadhaar ?? null,
    pan: data.pan ?? null,
    photo: data.photo ?? null,
    aadhaarDoc: data.aadhaarDoc ?? null,
    aadhaarFront: data.aadhaarFront ?? null,
    aadhaarBack: data.aadhaarBack ?? null,
    bedId: data.newBedId || data.bedId,
    newBedId: data.newBedId || null,
    shiftDate: data.shiftDate || null,
    roomNumber: bed?.roomNumber ?? null,
    monthlyRent: data.monthlyRent,
    dueDay: data.dueDay || 1,
    checkInDateTime: data.checkInDateTime ?? null,
    checkOutDateTime: data.checkOutDateTime ?? null,
    advancePaid: data.advancePaid ?? 0,
    paymentType: data.paymentType ?? null,
    paymentDate: data.paymentDate ?? null,
    paymentStatus: data.paymentStatus ?? null,
  })

  const handleAddTenant = async (data) => {
    if (!data.floorId || !data.roomId || !data.bedId) {
      toast.error('Please select floor, room, and bed')
      return
    }
    const bed = beds.find((b) => normId(b.id) === normId(data.bedId))
    if (!bed || !filterVacantBeds([bed]).length) {
      toast.error('Selected bed is no longer available. Please choose another bed.')
      await vacancy.reload()
      return
    }

    try {
      const bed = beds.find((b) => b.id === data.bedId)
      await monthlyPaymentsApi.create(buildTenantPayload(data, bed))
      await reloadTenantData()
      toast.success('Monthly tenant added successfully')
      setDrawerOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add tenant')
    }
  }

  const handleEditTenant = async (data) => {
    if (!editTenant) return
    if (data.newBedId && (!data.newFloorId || !data.newRoomId)) {
      toast.error('Please complete the room shift selection')
      return
    }
    if (data.newBedId && !data.shiftDate) {
      toast.error('Please select a shift date')
      return
    }
    try {
      const targetBedId = data.newBedId || data.bedId
      const bed = beds.find((b) => b.id === targetBedId)
      await monthlyPaymentsApi.update(editTenant.id, {
        ...buildTenantPayload(data, bed),
        customerName: data.name,
        roomNumber: bed?.roomNumber || editTenant.roomNumber,
      })
      await reloadTenantData()
      toast.success('Tenant updated successfully')
      setEditTenant(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tenant')
    }
  }

  const handleMarkPaid = async (payload) => {
    try {
      await monthlyPaymentsApi.addPayment(payload.tenantId, {
        month: payload.month,
        payments: payload.payments,
        paymentStatus: payload.paymentStatus,
      })
      await reloadTenantData()
      toast.success(`Payment recorded for ${markPaidTenant.customerName}`)
      setMarkPaidTenant(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    }
  }

  const openAdd = () => { setEditTenant(null); setDrawerOpen(true) }
  const openEdit = (tenant) => { setDrawerOpen(false); setViewTenant(null); setEditTenant(tenant) }
  const openView = (tenant) => { setEditTenant(null); setViewTenant(tenant) }

  const handleDelete = async (tenant) => {
    try {
      await monthlyPaymentsApi.remove(tenant.id)
      await reloadTenantData()
      toast.success(`Tenant ${tenant.customerName} removed`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tenant')
    }
  }

  const viewCustomer = viewTenant ? customers.find((c) => c.id === viewTenant.customerId) : null
  const viewBed = viewTenant ? beds.find((b) => b.id === (viewTenant.bedId || viewCustomer?.bedId)) : null
  const viewCustomerMerged = viewTenant ? {
    ...(viewCustomer || {}),
    ...viewTenant,
    id: viewTenant.customerId || viewTenant.id,
    name: viewTenant.customerName || viewCustomer?.name,
    photo: viewTenant.photo || viewCustomer?.photo,
    aadhaarDoc: viewTenant.aadhaarDoc || viewCustomer?.aadhaarDoc,
    checkInDateTime: viewTenant.checkInDateTime || viewCustomer?.checkInDateTime,
    checkOutDateTime: viewTenant.checkOutDateTime || viewCustomer?.checkOutDateTime || '',
    stayType: 'Monthly',
  } : null

  const compactColumns = useMemo(() => [
    {
      field: 'tenantInfo',
      headerName: 'Tenant',
      flex: 1,
      minWidth: 110,
      allowWrap: true,
      renderCell: ({ row }) => <MergedCell lines={[row.customerName, `Room ${row.roomNumber}`]} />,
    },
    {
      field: 'monthlyRent',
      headerName: 'Rent',
      width: 90,
      valueFormatter: (v) => formatCurrency(v),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 72,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <GridActions>
          <IconButton size="small" color="info" onClick={() => openView(row.tenant)} title="View"><Eye size={15} /></IconButton>
          <IconButton size="small" color="info" onClick={() => setHistoryTenant(row.tenant)} title="History"><History size={15} /></IconButton>
          <IconButton size="small" color="success" onClick={() => setMarkPaidTenant(row.tenant)} title="Mark Paid"><CheckCircle size={15} /></IconButton>
          <IconButton size="small" color="primary" onClick={() => openEdit(row.tenant)} title="Edit"><Pencil size={15} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row.tenant)} title="Delete"><Trash2 size={15} /></IconButton>
        </GridActions>
      ),
    },
  ], [])

  const columns = [
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'roomNumber', headerName: 'Room Number', width: 110 },
    { field: 'monthlyRent', headerName: 'Monthly Rent', minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'advancePaid', headerName: 'Advance', minWidth: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'dueDate', headerName: 'Due Date', minWidth: 160 },
    { field: 'lastPaidMonth', headerName: 'Last Paid Month', minWidth: 140 },
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
      <PageToolbar
        filters={(
          <TextField
            select
            label="Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ ...toolbarEqualFieldSx, maxWidth: { md: 200 } }}
            size="small"
            SelectProps={{ MenuProps: { sx: { zIndex: 1600 } } }}
          >
            <MenuItem value={FILTER_ALL}>All Tenants</MenuItem>
            <MenuItem value={FILTER_PAID}>Paid</MenuItem>
            <MenuItem value={FILTER_PENDING}>Pending</MenuItem>
          </TextField>
        )}
        action={(
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd} sx={toolbarButtonSx}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Tenant</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          </Button>
        )}
      />

      <MuiDataGrid rows={filteredRows} columns={columns} compactColumns={compactColumns} pageSize={10} noHorizontalScroll />

      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Monthly Tenant"
        variant="booking"
      >
        {drawerOpen && (
          <TenantForm
            floors={floors}
            rooms={rooms}
            beds={beds}
            loading={roomsLoading}
            onSubmit={handleAddTenant}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
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
            editMode
            loading={roomsLoading}
            onSubmit={handleEditTenant}
            onCancel={() => setEditTenant(null)}
          />
        )}
      </RightDrawer>

      <RightDrawer
        open={!!historyTenant}
        onClose={() => setHistoryTenant(null)}
        title={`Payment History — ${historyTenant?.customerName || ''}`}
        variant="view"
        compact
        footer={<Button onClick={() => setHistoryTenant(null)} sx={{ height: 44 }}>Close</Button>}
      >
        <PaymentHistoryContent tenant={historyTenant} />
      </RightDrawer>

      <RightDrawer
        open={!!markPaidTenant}
        onClose={() => setMarkPaidTenant(null)}
        title={`Mark Paid — ${markPaidTenant?.customerName || ''}`}
        variant="income"
      >
        {markPaidTenant && (
          <SplitPaymentDrawer
            tenant={markPaidTenant}
            onSubmit={handleMarkPaid}
            onCancel={() => setMarkPaidTenant(null)}
          />
        )}
      </RightDrawer>

      <RightDrawer
        open={!!viewTenant}
        onClose={() => setViewTenant(null)}
        title={`Tenant Details — ${viewTenant?.customerName || ''}`}
        variant="view"
        compact
        footer={<Button onClick={() => setViewTenant(null)} sx={{ height: 44 }}>Close</Button>}
      >
        {viewCustomerMerged && (
          <CustomerDetailCards
            customer={viewCustomerMerged}
            booking={null}
            bed={viewBed}
            monthlyTenant={viewTenant}
          />
        )}
      </RightDrawer>
    </PageTransition>
  )
}

export default MonthlyPayments
