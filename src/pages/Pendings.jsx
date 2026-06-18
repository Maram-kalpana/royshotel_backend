import { useState, useMemo } from 'react'
import { TextField } from '@mui/material'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import FilterSection from '../components/FilterSection'
import DatePickerField from '../components/DatePickerField'
import StatusBadge from '../components/StatusBadge'
import { useBookings, useCustomers } from '../hooks/useStore'
import { formatCurrency, formatDate } from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'

const Pendings = () => {
  const { list: bookings } = useBookings()
  const { list: customers } = useCustomers()
  const [search, setSearch] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [applied, setApplied] = useState({ search: '', bookingDate: '' })

  const pendingRows = useMemo(() => {
    let rows = bookings
      .filter((b) => (b.balanceAmount ?? 0) > 0 && ['active', 'reserved', 'booked'].includes(b.status))
      .map((b) => {
        const customer = customers.find((c) => c.id === b.customerId)
        return {
          id: b.id,
          customerName: b.customerName,
          phone: customer?.phone || b.phone || '—',
          floorNumber: b.floorNumber,
          roomNumber: b.roomNumber,
          bedNumber: b.bedNumber,
          totalAmount: b.totalAmount,
          advancePaid: b.advancePaid,
          balanceAmount: b.balanceAmount,
          bookingDate: b.checkInDate,
          status: 'pending',
        }
      })

    const q = applied.search.toLowerCase().trim()
    if (q) {
      rows = rows.filter((r) =>
        r.customerName?.toLowerCase().includes(q) ||
        r.phone?.includes(q),
      )
    }
    if (applied.bookingDate) {
      rows = rows.filter((r) => r.bookingDate === applied.bookingDate)
    }
    return rows
  }, [bookings, customers, applied])

  const handleSearch = () => setApplied({ search, bookingDate })
  const handleReset = () => {
    setSearch('')
    setBookingDate('')
    setApplied({ search: '', bookingDate: '' })
  }

  const columns = [
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'phone', headerName: 'Phone Number', flex: 1, minWidth: 130 },
    { field: 'floorNumber', headerName: 'Floor Number', width: 110 },
    { field: 'roomNumber', headerName: 'Room Number', width: 110 },
    { field: 'bedNumber', headerName: 'Bed Number', width: 100 },
    { field: 'totalAmount', headerName: 'Total Amount', flex: 1, minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'advancePaid', headerName: 'Advance Paid', flex: 1, minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'balanceAmount', headerName: 'Balance Amount', flex: 1, minWidth: 130, valueFormatter: (v) => formatCurrency(v) },
    { field: 'bookingDate', headerName: 'Booking Date', flex: 1, minWidth: 130, valueFormatter: (v) => formatDate(v) },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: () => <StatusBadge status="pending" label="Pending" />,
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="page-header">
        <h2 className="section-title">Pendings</h2>
        <p className="page-subtitle">{pendingRows.length} customers with pending balance</p>
      </div>

      <FilterSection onSearch={handleSearch} onReset={handleReset}>
        <TextField label="Search Customer" value={search} onChange={(e) => setSearch(e.target.value)} sx={filterFieldSx} />
        <DatePickerField label="Booking Date" value={bookingDate} onChange={setBookingDate} sx={filterFieldSx} />
      </FilterSection>

      <MuiDataGrid rows={pendingRows} columns={columns} pageSize={10} />
    </PageTransition>
  )
}

export default Pendings
