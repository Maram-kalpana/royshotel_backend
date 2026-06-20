import { useState, useMemo, useEffect } from 'react'
import { Avatar, TextField, Button, IconButton } from '@mui/material'
import { Eye } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import DatePickerField from '../components/DatePickerField'
import RightDrawer from '../components/RightDrawer'
import CustomerDetailCards from '../components/CustomerDetailCards'
import { useCustomers, useHotel, useBookings, useMonthlyPayments } from '../hooks/useStore'
import {
  formatCurrency, displayValue, mapStayTypeLabel,
  formatCheckInDateTime, formatCheckOutDateTime,
} from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'
import { loadCustomers } from '../services/dataService'
import { useAppDispatch } from '../hooks/useStore'

const Customers = () => {
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

  const columns = [
    { field: 'photo', headerName: 'Photo', width: 70, renderCell: ({ row }) => <Avatar src={row.photo} alt={row.name} sx={{ width: 40, height: 40 }} /> },
    { field: 'name', headerName: 'Name', minWidth: 140 },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'roomNumber', headerName: 'Room', width: 80 },
    { field: 'stayType', headerName: 'Stay Type', width: 100 },
    { field: 'checkInDisplay', headerName: 'Check-In Date & Time', minWidth: 160 },
    { field: 'checkOutDisplay', headerName: 'Checked Out Date', minWidth: 160 },
    { field: 'amount', headerName: 'Amount', minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center h-full">
          <IconButton size="small" color="info" onClick={() => openView(row)} title="View"><Eye size={16} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <TextField label="Search Customer" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
        <DatePickerField label="Check-In Date" value={checkInDate} onChange={setCheckInDate} sx={filterFieldSx} />
      </div>

      <MuiDataGrid rows={filtered} columns={columns} pageSize={10} />

      <RightDrawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Customer Details"
        variant="customer"
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

