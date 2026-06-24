import { useState, useMemo, useEffect } from 'react'

import { TextField, MenuItem, Typography, Box, Button, IconButton } from '@mui/material'

import { Eye } from 'lucide-react'

import PageTransition from '../components/PageTransition'

import MuiDataGrid from '../components/MuiDataGrid'

import DatePickerField from '../components/DatePickerField'

import RightDrawer from '../components/RightDrawer'

import { useAccounts, useAppDispatch } from '../hooks/useStore'

import { formatCurrency, formatDate } from '../utils/helpers'

import { filterFieldSx } from '../utils/layout'

import { loadAccounts } from '../services/dataService'



const compactFilterSx = {

  ...filterFieldSx,

  flex: { xs: '0 0 auto', md: '0 0 180px' },

  minWidth: { xs: 120, md: 180 },

  maxWidth: { md: 200 },

}



const Accounts = () => {

  const dispatch = useAppDispatch()

  const { summary } = useAccounts()

  const [searchDate, setSearchDate] = useState('')

  const [filterMode, setFilterMode] = useState('day')

  const [viewRow, setViewRow] = useState(null)



  useEffect(() => {

    loadAccounts(dispatch, { view: filterMode, date: searchDate || undefined }).catch(console.error)

  }, [dispatch, filterMode, searchDate])



  const rows = useMemo(() => summary?.rows || [], [summary])

  const cards = summary?.cards || {}



  const dayColumns = [

    { field: 'period', headerName: 'Date', flex: 1, minWidth: 120, valueFormatter: (v) => formatDate(v) },

    { field: 'total', headerName: 'Amount', flex: 1, minWidth: 120, valueFormatter: (v) => formatCurrency(v) },

    { field: 'cash', headerName: 'Cash', width: 100, valueFormatter: (v) => formatCurrency(v) },

    { field: 'upi', headerName: 'UPI', width: 100, valueFormatter: (v) => formatCurrency(v) },

    { field: 'card', headerName: 'Card', width: 100, valueFormatter: (v) => formatCurrency(v) },

    { field: 'bank', headerName: 'Bank', width: 100, valueFormatter: (v) => formatCurrency(v) },

    {

      field: 'actions',

      headerName: 'Actions',

      width: 70,

      sortable: false,

      filterable: false,

      renderCell: ({ row }) => (

        <IconButton size="small" color="info" onClick={() => setViewRow(row)} title="View">

          <Eye size={16} />

        </IconButton>

      ),

    },

  ]



  const compactColumns = useMemo(() => [

    { field: 'period', headerName: 'Date', flex: 1, minWidth: 100, valueFormatter: (v) => formatDate(v) },

    { field: 'total', headerName: 'Amount', width: 90, valueFormatter: (v) => formatCurrency(v) },

    {

      field: 'actions',

      headerName: 'Actions',

      width: 52,

      sortable: false,

      filterable: false,

      renderCell: ({ row }) => (

        <IconButton size="small" color="info" onClick={() => setViewRow(row)} title="View">

          <Eye size={15} />

        </IconButton>

      ),

    },

  ], [])



  return (

    <PageTransition className="page-container">

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 3 }}>

        <TextField select label="View By" value={filterMode} onChange={(e) => setFilterMode(e.target.value)} sx={compactFilterSx}>

          <MenuItem value="day">Day</MenuItem>

          <MenuItem value="month">Month</MenuItem>

        </TextField>

        <DatePickerField label="Search By Date" value={searchDate} onChange={setSearchDate} sx={compactFilterSx} />

        <Box sx={{ px: 2, py: 1, minHeight: 44, borderRadius: 1, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', flex: { xs: '1 1 100%', md: '0 0 200px' } }}>

          <Typography variant="caption" color="text.secondary">Total Revenue</Typography>

          <Typography variant="body1" fontWeight={600}>{formatCurrency(cards.totalRevenue || 0)}</Typography>

        </Box>

      </Box>



      <MuiDataGrid rows={rows} columns={dayColumns} compactColumns={compactColumns} pageSize={10} noHorizontalScroll />



      <RightDrawer

        open={!!viewRow}

        onClose={() => setViewRow(null)}

        title={`Income — ${viewRow ? formatDate(viewRow.period) : ''}`}

        variant="view"

        compact

        footer={<Button onClick={() => setViewRow(null)} sx={{ height: 44 }}>Close</Button>}

      >

        {viewRow && (

          <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#fafbfc' }}>

            {[

              ['Date', formatDate(viewRow.period)],

              ['Total', formatCurrency(viewRow.total)],

              ['Cash', formatCurrency(viewRow.cash)],

              ['UPI', formatCurrency(viewRow.upi)],

              ['Card', formatCurrency(viewRow.card)],

              ['Bank', formatCurrency(viewRow.bank)],

            ].map(([label, value]) => (

              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 } }}>

                <Typography variant="body2" sx={{ color: '#64748b' }}>{label}</Typography>

                <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>

              </Box>

            ))}

          </Box>

        )}

      </RightDrawer>

    </PageTransition>

  )

}



export default Accounts

