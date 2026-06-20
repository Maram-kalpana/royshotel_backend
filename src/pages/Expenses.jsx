import { useState, useMemo, useEffect } from 'react'
import { Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, Stack, Typography, Box } from '@mui/material'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import DatePickerField from '../components/DatePickerField'
import RightDrawer from '../components/RightDrawer'
import DrawerFormStack from '../components/DrawerFormStack'
import { useExpenses, useAppDispatch } from '../hooks/useStore'
import { loadExpenses } from '../services/dataService'
import { expensesApi } from '../services/endpoints'
import { formatCurrency, formatDate } from '../utils/helpers'
import { filterFieldSx, fieldSx, primaryButtonSx } from '../utils/layout'

const TYPE_LABELS = {
  maintenance: 'Maintenance',
  utilities: 'Utilities',
  supplies: 'Supplies',
  staff: 'Staff',
  miscellaneous: 'Miscellaneous',
}

const emptyForm = {
  type: '',
  date: '',
  amount: '',
  description: '',
}

const Expenses = () => {
  const expensesData = useExpenses()
  const dispatch = useAppDispatch()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [searchDescription, setSearchDescription] = useState('')

  const expensesList = expensesData?.list || []

  useEffect(() => {
    loadExpenses(dispatch).catch(console.error)
  }, [dispatch])

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const filteredExpenses = useMemo(() => {
    let result = expensesList

    if (searchDescription) {
      result = result.filter((e) =>
        e.description?.toLowerCase().includes(searchDescription.toLowerCase()) ||
        e.type?.toLowerCase().includes(searchDescription.toLowerCase()),
      )
    }

    if (filterDate) {
      result = result.filter((e) => e.date === filterDate)
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expensesList, filterDate, searchDescription])

  const tableRows = useMemo(
    () =>
      filteredExpenses.map((e) => ({
        id: e.id,
        type: TYPE_LABELS[e.type] || e.type || '—',
        date: e.date,
        amount: e.amount,
        description: e.description || '—',
        expense: e,
      })),
    [filteredExpenses],
  )

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const handleOpenDrawer = (expense = null) => {
    if (expense) {
      setEditExpense(expense)
      setForm({
        type: TYPE_LABELS[expense.type] || expense.type || '',
        date: expense.date || '',
        amount: expense.amount ?? '',
        description: expense.description || '',
      })
    } else {
      setEditExpense(null)
      setForm(emptyForm)
    }
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setEditExpense(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.type?.trim() || !form.date || !form.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    const payload = {
      ...form,
      type: form.type.trim(),
      amount: Number(form.amount),
    }

    try {
      if (editExpense) {
        await expensesApi.update(editExpense.id, payload)
        toast.success('Expense updated successfully')
      } else {
        await expensesApi.create(payload)
        toast.success('Expense added successfully')
      }
      await loadExpenses(dispatch)
      handleCloseDrawer()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await expensesApi.remove(deleteConfirm.id)
        await loadExpenses(dispatch)
        toast.success('Expense deleted successfully')
        setDeleteConfirm(null)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete expense')
      }
    }
  }

  const columns = [
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 130 },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 130, valueFormatter: (v) => formatDate(v) },
    { field: 'amount', headerName: 'Amount', flex: 1, minWidth: 120, valueFormatter: (v) => formatCurrency(v) },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            onClick={() => handleOpenDrawer(row.expense)}
            title="Edit"
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteConfirm(row.expense)}
            title="Delete"
          >
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="flex flex-col gap-4">
        <div className="toolbar-row">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
            <p className="text-sm text-slate-500">Manage all expense records</p>
          </div>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDrawer()}
            sx={{ ...primaryButtonSx, flexShrink: 0 }}
          >
            Add Expense
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-1">
          <DatePickerField
            label="Date"
            value={filterDate}
            onChange={setFilterDate}
            slotProps={{ textField: { size: 'small', sx: { ...filterFieldSx, minWidth: { xs: '100%', md: 160 }, maxWidth: { md: 180 } } } }}
          />

          <TextField
            label="Search"
            placeholder="Search..."
            value={searchDescription}
            onChange={(e) => setSearchDescription(e.target.value)}
            size="small"
            sx={{ ...filterFieldSx, minWidth: { xs: '100%', md: 180 }, maxWidth: { md: 220 } }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 2,
              py: 1,
              minHeight: 40,
              borderRadius: 1,
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
              minWidth: { xs: '100%', md: 160 },
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.2 }}>
              Total ({filteredExpenses.length})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
              {formatCurrency(totalAmount)}
            </Typography>
          </Box>
        </div>

        <MuiDataGrid
          rows={tableRows}
          columns={columns}
          noHorizontalScroll
          onRowClick={(row) => handleOpenDrawer(row.expense)}
        />
      </div>

      <RightDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={editExpense ? 'Edit Expense' : 'Add Expense'}
        variant="income"
        footer={
          <>
            <Button onClick={handleCloseDrawer} sx={{ height: 44 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} sx={primaryButtonSx}>
              {editExpense ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <DrawerFormStack>
          <TextField
            label="Expense Type"
            value={form.type}
            onChange={(e) => updateForm({ type: e.target.value })}
            fullWidth
            required
            placeholder="e.g. Maintenance, Utilities..."
            sx={fieldSx}
          />

          <DatePickerField
            label="Date"
            value={form.date}
            onChange={(date) => updateForm({ date })}
            slotProps={{ textField: { fullWidth: true, required: true, sx: fieldSx } }}
          />

          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => updateForm({ amount: e.target.value })}
            fullWidth
            required
            inputProps={{ step: '0.01', min: '0' }}
            sx={fieldSx}
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder="Enter expense description..."
            sx={fieldSx}
          />
        </DrawerFormStack>
      </RightDrawer>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography variant="body2" className="my-4">
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setDeleteConfirm(null)} fullWidth>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete} fullWidth>
              Delete
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}

export default Expenses
