import { useState, useMemo, useEffect } from 'react'
import { TextField, MenuItem, Typography, Box } from '@mui/material'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import DatePickerField from '../components/DatePickerField'
import { useAccounts, useAppDispatch } from '../hooks/useStore'
import { formatCurrency, formatDate } from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'
import { loadAccounts } from '../services/dataService'

const Accounts = () => {
  const dispatch = useAppDispatch()
  const { summary } = useAccounts()
  const [searchDate, setSearchDate] = useState('')
  const [filterMode, setFilterMode] = useState('day')

  useEffect(() => {
    loadAccounts(dispatch, { view: filterMode, date: searchDate || undefined }).catch(console.error)
  }, [dispatch, filterMode, searchDate])

  const filtered = useMemo(() => summary?.rows || [], [summary])
  const cards = summary?.cards || {}

  const dayColumns = [
    { field: 'period', headerName: 'Date', flex: 1, minWidth: 120, valueFormatter: (v) => formatDate(v) },
    { field: 'total', headerName: 'Amount', flex: 1, minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'cash', headerName: 'Cash', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'upi', headerName: 'UPI', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'card', headerName: 'Card', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'bank', headerName: 'Bank', width: 100, valueFormatter: (v) => formatCurrency(v) },
  ]

  return (
    <PageTransition className="page-container">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <TextField select label="View By" value={filterMode} onChange={(e) => setFilterMode(e.target.value)} sx={filterFieldSx}>
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="month">Month</MenuItem>
        </TextField>
        {filterMode === 'day' && (
          <DatePickerField label="Search By Date" value={searchDate} onChange={setSearchDate} sx={filterFieldSx} />
        )}
      </div>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total Revenue', value: cards.totalRevenue },
          { label: 'Total Expenses', value: cards.totalExpenses },
          { label: 'Net Profit', value: cards.netProfit },
          { label: 'Pending Amount', value: cards.pendingAmount },
        ].map((c) => (
          <Box key={c.label} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary">{c.label}</Typography>
            <Typography variant="h6" fontWeight={600}>{formatCurrency(c.value || 0)}</Typography>
          </Box>
        ))}
      </Box>

      <MuiDataGrid rows={filtered} columns={dayColumns} pageSize={10} />
    </PageTransition>
  )
}

export default Accounts
