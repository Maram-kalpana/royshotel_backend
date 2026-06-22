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
import { useMonthlyPayments, useAppDispatch, useHotel, useCustomers } from '../hooks/useStore'
import { formatCurrency, displayValue } from '../utils/helpers'
import { primaryButtonSx } from '../utils/layout'
import { loadMonthlyPayments, loadCustomers, loadRooms } from '../services/dataService'
import { monthlyPaymentsApi } from '../services/endpoints'
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
  const dispatch = useAppDispatch()

  const [tab, setTab] = useState(TAB_ALL)
  const [historyTenant, setHistoryTenant] = useState(null)
  const [markPaidTenant, setMarkPaidTenant] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTenant, setEditTenant] = useState(null)
  const [viewTenant, setViewTenant] = useState(null)

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

  const buildTenantPayload = (data, bed) => ({
    name: data.name,
    customerName: data.name,
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
    roomNumber: bed?.roomNumber,
    monthlyRent: data.monthlyRent,
    dueDay: data.dueDay || 1,
    checkInDateTime: data.checkInDateTime,
    advancePaid: data.advancePaid,
    paymentType: data.paymentType,
    paymentDate: data.paymentDate,
  })

  const handleAddTenant = async (data) => {
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
    try {
      const bed = beds.find((b) => b.id === data.bedId)
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
      await monthlyPaymentsApi.markPaid(payload.tenantId, {
        month: payload.month,
        amount: payload.amount,
        paymentMode: payload.paymentMode,
        paidDate: payload.paidDate,
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
    email: viewCustomer?.email,
    photo: viewTenant.photo || viewCustomer?.photo,
    aadhaarDoc: viewTenant.aadhaarDoc || viewCustomer?.aadhaarDoc,
    panDoc: viewTenant.panDoc || viewCustomer?.panDoc,
    checkInDateTime: viewTenant.checkInDateTime || viewCustomer?.checkInDateTime,
    checkOutDateTime: viewTenant.checkOutDateTime || viewCustomer?.checkOutDateTime || '',
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
