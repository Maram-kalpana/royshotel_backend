import { useParams } from 'react-router-dom'
import { Tabs, Tab, Box, Typography, Avatar, Chip } from '@mui/material'
import { useState } from 'react'
import PageTransition from '../components/PageTransition'
import ProfileCard from '../components/ProfileCard'
import DataTable from '../components/DataTable'
import { useCustomers, useBookings } from '../hooks/useStore'
import { formatCurrency, formatDate, displayValue, getImageSrc } from '../utils/helpers'

const CustomerProfile = () => {
  const { id } = useParams()
  const { list } = useCustomers()
  const { list: bookings } = useBookings()
  const [tab, setTab] = useState(0)

  const customer = list.find((c) => c.id === id)
  const booking = bookings.find((b) => b.customerId === id)
  const customerBookings = bookings.filter((b) => b.customerId === id)

  if (!customer) {
    return (
      <PageTransition className="page-container">
        <Typography>Customer not found</Typography>
      </PageTransition>
    )
  }

  const paymentHistory = customerBookings.map((b) => ({
    id: b.id,
    date: formatDate(b.createdAt),
    amount: formatCurrency(b.totalAmount),
    paid: formatCurrency(b.advancePaid),
    balance: formatCurrency(b.balanceAmount),
    status: b.balanceAmount > 0 ? 'Pending' : 'Paid',
  }))

  return (
    <PageTransition className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileCard customer={customer} booking={booking} />

          <div className="lg:col-span-2">
            <Box className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label="Profile" />
                <Tab label="Documents" />
                <Tab label="Payment History" />
                <Tab label="Booking History" />
              </Tabs>

              <Box className="p-6">
                {tab === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ['Full Name', customer.name], ['Phone', customer.phone], ['Email', customer.email],
                      ['Aadhaar', customer.aadhaar], ['PAN', customer.pan], ['City', customer.city],
                      ['State', customer.state], ['Status', customer.status],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="font-medium text-slate-900 capitalize mt-1">{displayValue(value)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Customer Photo', src: getImageSrc(customer.photo) },
                      { label: 'Aadhaar Front', src: getImageSrc(customer.aadhaarFront || customer.aadhaarDoc) },
                      { label: 'Aadhaar Back', src: getImageSrc(customer.aadhaarBack) },
                      { label: 'PAN Document', src: getImageSrc(customer.panDoc) },
                    ].map((doc) => (
                      <div key={doc.label} className="rounded-xl border border-slate-200 p-4 text-center">
                        {doc.src ? (
                          <Avatar src={doc.src} variant="rounded" sx={{ width: '100%', height: 160, borderRadius: 3 }} />
                        ) : (
                          <div className="h-40 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Document uploaded</div>
                        )}
                        <p className="mt-2 text-sm font-medium text-slate-700">{doc.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 2 && (
                  <DataTable
                    columns={[
                      { field: 'date', headerName: 'Date' },
                      { field: 'amount', headerName: 'Total' },
                      { field: 'paid', headerName: 'Paid' },
                      { field: 'balance', headerName: 'Balance' },
                      { field: 'status', headerName: 'Status', renderCell: (row) => (
                        <Chip label={row.status} size="small" color={row.status === 'Paid' ? 'success' : 'warning'} />
                      )},
                    ]}
                    rows={paymentHistory}
                  />
                )}

                {tab === 3 && (
                  <DataTable
                    columns={[
                      { field: 'roomNumber', headerName: 'Room', renderCell: (row) => `Room ${row.roomNumber}` },
                      { field: 'bedNumber', headerName: 'Bed' },
                      { field: 'stayType', headerName: 'Stay Type' },
                      { field: 'duration', headerName: 'Duration' },
                      { field: 'checkInDate', headerName: 'Check-In', renderCell: (row) => formatDate(row.checkInDate) },
                      { field: 'totalAmount', headerName: 'Amount', renderCell: (row) => formatCurrency(row.totalAmount) },
                    ]}
                    rows={customerBookings}
                  />
                )}
              </Box>
            </Box>
          </div>
        </div>
      </PageTransition>
  )
}

export default CustomerProfile
