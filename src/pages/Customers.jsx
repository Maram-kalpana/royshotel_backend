import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, IconButton, Box } from '@mui/material'
import { Eye, Trash2, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import DatePickerField from '../components/DatePickerField'
import RightDrawer from '../components/RightDrawer'
import CustomerDetailCards from '../components/CustomerDetailCards'
import { MergedCell, VerticalActions, CompactIconButton } from '../components/tableCells'
import { useCustomers, useHotel, useBookings, useMonthlyPayments } from '../hooks/useStore'
import {
  formatCurrency, displayValue, mapStayTypeLabel,
  formatCheckInDateTime, formatCheckOutDateTime,
} from '../utils/helpers'
import PageToolbar from '../components/PageToolbar'
import { filterFieldSx, toolbarSearchCompactSx } from '../utils/layout'
import { loadCustomers } from '../services/dataService'
import { customersApi } from '../services/endpoints'
import { useAppDispatch } from '../hooks/useStore'

const Customers = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { list } = useCustomers()
  const { list: bookings } = useBookings()
  const { beds } = useHotel()
  const { tenants } = useMonthlyPayments()

  const [search, setSearch] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    loadCustomers(dispatch).catch(console.error)
  }, [dispatch])

  const enrichedCustomers = useMemo(() => list.map((c) => {
    const bed = beds.find((b) => b.id === c.bedId)
    const booking = bookings.find((b) => b.customerId === c.id)
    const monthlyTenant = tenants.find((t) => t.customerId === c.id)
    const stayType = mapStayTypeLabel(c.stayType || booking?.stayType)

    return {
      ...c,
      floorNumber: bed?.floorNumber ?? c.floorNumber ?? '—',
      roomNumber: displayValue(c.roomNumber),
      bedNumber: displayValue(c.bedNumber),
      phone: displayValue(c.phone),
      name: displayValue(c.name),
      aadhaar: displayValue(c.aadhaar),
      stayType,
      checkInDisplay: formatCheckInDateTime(c, booking),
      checkOutDisplay: formatCheckOutDateTime(c, booking),
      monthlyRent: monthlyTenant?.monthlyRent ?? c.monthlyRent,
      dueDay: monthlyTenant?.dueDay ?? c.dueDay,
      securityDeposit: c.securityDeposit ?? (stayType === 'Monthly' ? booking?.advancePaid : null),
      amount: booking?.totalAmount ?? 0,
    }
  }), [list, beds, bookings, tenants])

  const filtered = useMemo(() => {
    let rows = enrichedCustomers
    const q = search.toLowerCase().trim()
    if (q) {
      rows = rows.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.aadhaar?.includes(q),
      )
    }
    if (checkInDate) rows = rows.filter((c) => c.checkInDate === checkInDate)
    return rows
  }, [enrichedCustomers, search, checkInDate])

  const openView = (row) => {
    setSelectedCustomer(row)
    setViewOpen(true)
  }

  const viewBed = selectedCustomer ? beds.find((b) => b.id === selectedCustomer.bedId) : null
  const viewBooking = selectedCustomer ? bookings.find((b) => b.customerId === selectedCustomer.id) : null
  const viewMonthly = selectedCustomer ? tenants.find((t) => t.customerId === selectedCustomer.id) : null

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer ${customer.name}?`)) return
    try {
      await customersApi.remove(customer.id)
      await loadCustomers(dispatch)
      toast.success('Customer deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer')
    }
  }

  const compactColumns = useMemo(() => [
    {
      field: 'details',
      headerName: 'Customer',
      compactWidth: '82%',
      allowWrap: true,
      renderCell: ({ row }) => (
        <MergedCell lines={[
          row.name,
          row.phone,
          `Room ${row.roomNumber} · ${row.stayType}`,
        ]} />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      compactWidth: '18%',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <VerticalActions>
          <CompactIconButton color="info" onClick={() => openView(row)} title="View"><Eye /></CompactIconButton>
          {row.status === 'checked-in' && (
            <CompactIconButton color="success" onClick={() => navigate(`/checkout/${row.id}`)} title="Checkout"><LogOut /></CompactIconButton>
          )}
          <CompactIconButton color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 /></CompactIconButton>
        </VerticalActions>
      ),
    },
  ], [])

  const columns = [
    { field: 'name', headerName: 'Name', minWidth: 140 },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'roomNumber', headerName: 'Room', width: 80 },
    { field: 'stayType', headerName: 'Stay Type', width: 100 },
    { field: 'checkInDisplay', headerName: 'Check-In Date & Time', minWidth: 160 },
    { field: 'checkOutDisplay', headerName: 'Checked Out Date', minWidth: 160 },
    { field: 'amount', headerName: 'Amount', minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="info" onClick={() => openView(row)} title="View"><Eye size={16} /></IconButton>
          {row.status === 'checked-in' && (
            <IconButton size="small" color="success" onClick={() => navigate(`/checkout/${row.id}`)} title="Checkout">
              <LogOut size={16} />
            </IconButton>
          )}
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <PageToolbar
        filters={(
          <>
            <TextField label="Search" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} sx={toolbarSearchCompactSx} size="small" />
            <DatePickerField label="Check-In Date" value={checkInDate} onChange={setCheckInDate} sx={{ ...filterFieldSx, flex: { xs: '0 0 auto', md: '1 1 180px' }, minWidth: { xs: 130, md: 180 }, display: { xs: 'none', sm: 'block' } }} />
          </>
        )}
        secondary={(
          <DatePickerField label="Check-In Date" value={checkInDate} onChange={setCheckInDate} sx={{ ...filterFieldSx, display: { xs: 'block', sm: 'none' }, width: '100%' }} />
        )}
      />

      <MuiDataGrid rows={filtered} columns={columns} compactColumns={compactColumns} pageSize={10} noHorizontalScroll />

      <RightDrawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Customer Details"
        variant="view"
        compact
        footer={<Button onClick={() => setViewOpen(false)} sx={{ height: 44 }}>Close</Button>}
      >
        {selectedCustomer && (
          <CustomerDetailCards
            customer={selectedCustomer}
            booking={viewBooking}
            bed={viewBed}
            monthlyTenant={viewMonthly}
          />
        )}
      </RightDrawer>
    </PageTransition>
  )
}

export default Customers

