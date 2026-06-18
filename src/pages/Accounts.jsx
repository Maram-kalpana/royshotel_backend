import { useState, useMemo } from 'react'
import { TextField, Button, IconButton } from '@mui/material'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import FilterSection from '../components/FilterSection'
import DatePickerField from '../components/DatePickerField'
import DrawerFormStack from '../components/DrawerFormStack'
import DrawerDetailItem from '../components/DrawerDetailItem'
import { useAuth, useAppDispatch, useAccounts } from '../hooks/useStore'
import { addIncome, updateIncome, deleteIncome } from '../redux/slices/accountsSlice'
import { formatCurrency, formatDate, ROLES, isInDateRange } from '../utils/helpers'
import { fieldSx, filterFieldSx, primaryButtonSx } from '../utils/layout'
import toast from 'react-hot-toast'

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  totalIncome: '', bookedRooms: '', vacantRooms: '',
  cashCollection: '', upiCollection: '', cardCollection: '', remarks: '',
}

const AdminAccounts = () => {
  const { user } = useAuth()
  const { list } = useAccounts()
  const dispatch = useAppDispatch()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewRecord, setViewRecord] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openAdd = () => { setEditMode(false); setEditId(null); setForm(emptyForm); setDrawerOpen(true) }
  const openEdit = (record) => {
    setEditMode(true); setEditId(record.id)
    setForm({ date: record.date, totalIncome: record.totalIncome, bookedRooms: record.bookedRooms, vacantRooms: record.vacantRooms, cashCollection: record.cashCollection, upiCollection: record.upiCollection, cardCollection: record.cardCollection, remarks: record.remarks })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.date || !form.totalIncome) { toast.error('Please fill required fields'); return }
    const payload = {
      date: form.date, totalIncome: Number(form.totalIncome), bookedRooms: Number(form.bookedRooms) || 0,
      vacantRooms: Number(form.vacantRooms) || 0, cashCollection: Number(form.cashCollection) || 0,
      upiCollection: Number(form.upiCollection) || 0, cardCollection: Number(form.cardCollection) || 0, remarks: form.remarks,
    }
    if (editMode && editId) {
      dispatch(updateIncome({ id: editId, ...payload }))
      toast.success('Income record updated')
    } else {
      dispatch(addIncome({ id: `income-${Date.now()}`, ...payload, adminName: user?.name || 'Admin', adminId: user?.id || 'admin-1', createdAt: new Date().toISOString() }))
      toast.success('Income record saved')
    }
    setDrawerOpen(false); setForm(emptyForm)
  }

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, valueFormatter: (v) => formatDate(v) },
    { field: 'totalIncome', headerName: 'Income', flex: 1, minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    { field: 'bookedRooms', headerName: 'Booked Rooms', width: 120 },
    { field: 'vacantRooms', headerName: 'Vacant Rooms', width: 120 },
    { field: 'cashCollection', headerName: 'Cash', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'upiCollection', headerName: 'UPI', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'cardCollection', headerName: 'Card', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 140 },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false,
      renderCell: (p) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="primary" onClick={() => setViewRecord(p.row)} title="View"><Eye size={16} /></IconButton>
          <IconButton size="small" color="info" onClick={() => openEdit(p.row)} title="Edit"><Pencil size={16} /></IconButton>
          <IconButton size="small" color="error" onClick={() => { dispatch(deleteIncome(p.row.id)); toast.success('Record deleted') }} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ]

  const formFields = [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'totalIncome', label: 'Total Income', type: 'number' },
    { key: 'bookedRooms', label: 'Number Of Booked Rooms', type: 'number' },
    { key: 'vacantRooms', label: 'Number Of Vacant Rooms', type: 'number' },
    { key: 'cashCollection', label: 'Cash Collection', type: 'number' },
    { key: 'upiCollection', label: 'UPI Collection', type: 'number' },
    { key: 'cardCollection', label: 'Card Collection', type: 'number' },
  ]

  return (
    <>
      <div className="toolbar-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">Accounts</h2>
          <p className="page-subtitle">Daily income records · {list.length} entries</p>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd} sx={primaryButtonSx}>Add Income</Button>
      </div>
      <MuiDataGrid rows={list} columns={columns} pageSize={10} />
      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editMode ? 'Edit Income' : 'Add Daily Income'} variant="income" footer={<><Button onClick={() => setDrawerOpen(false)} sx={{ height: 44 }}>Cancel</Button><Button variant="contained" onClick={handleSave} sx={primaryButtonSx}>Save</Button></>}>
        <DrawerFormStack>
          {formFields.map(({ key, label, type }) => (
            key === 'date' ? (
              <DatePickerField key={key} label={label} value={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
            ) : (
              <TextField key={key} fullWidth label={label} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} sx={fieldSx} />
            )
          ))}
          <TextField fullWidth multiline rows={3} label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} sx={fieldSx} />
        </DrawerFormStack>
      </RightDrawer>
      <RightDrawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="Income Details" variant="income" footer={<Button onClick={() => setViewRecord(null)} sx={{ height: 44 }}>Close</Button>}>
        {viewRecord && (
          <DrawerFormStack>
            {[
              ['Date', formatDate(viewRecord.date)], ['Total Income', formatCurrency(viewRecord.totalIncome)],
              ['Booked Rooms', viewRecord.bookedRooms], ['Vacant Rooms', viewRecord.vacantRooms],
              ['Cash Collection', formatCurrency(viewRecord.cashCollection)], ['UPI Collection', formatCurrency(viewRecord.upiCollection)],
              ['Card Collection', formatCurrency(viewRecord.cardCollection)], ['Remarks', viewRecord.remarks || '—'],
            ].map(([label, value]) => <DrawerDetailItem key={label} label={label} value={value} />)}
          </DrawerFormStack>
        )}
      </RightDrawer>
    </>
  )
}

const SuperAdminAccounts = () => {
  const { list } = useAccounts()
  const [searchDate, setSearchDate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [applied, setApplied] = useState({ searchDate: '', fromDate: '', toDate: '' })
  const [viewRecord, setViewRecord] = useState(null)

  const filtered = useMemo(() => {
    let rows = [...list]
    if (applied.searchDate) rows = rows.filter((r) => r.date === applied.searchDate)
    else if (applied.fromDate && applied.toDate) rows = rows.filter((r) => isInDateRange(r.date, applied.fromDate, applied.toDate))
    else if (applied.fromDate) rows = rows.filter((r) => r.date >= applied.fromDate)
    else if (applied.toDate) rows = rows.filter((r) => r.date <= applied.toDate)
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [list, applied])

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, valueFormatter: (v) => formatDate(v) },
    { field: 'totalIncome', headerName: 'Income', flex: 1, minWidth: 110, valueFormatter: (v) => formatCurrency(v) },
    { field: 'bookedRooms', headerName: 'Booked Rooms', width: 120 },
    { field: 'vacantRooms', headerName: 'Vacant Rooms', width: 120 },
    { field: 'cashCollection', headerName: 'Cash', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'upiCollection', headerName: 'UPI', width: 100, valueFormatter: (v) => formatCurrency(v) },
    { field: 'cardCollection', headerName: 'Card', width: 100, valueFormatter: (v) => formatCurrency(v) },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false,
      renderCell: (p) => <IconButton size="small" color="primary" onClick={() => setViewRecord(p.row)} title="View"><Eye size={16} /></IconButton>,
    },
  ]

  return (
    <>
      <div className="page-header">
        <h2 className="section-title">Accounts</h2>
        <p className="page-subtitle">View daily income reports · {filtered.length} records</p>
      </div>
      <FilterSection onSearch={() => setApplied({ searchDate, fromDate, toDate })} onReset={() => { setSearchDate(''); setFromDate(''); setToDate(''); setApplied({ searchDate: '', fromDate: '', toDate: '' }) }}>
        <DatePickerField label="Search By Date" value={searchDate} onChange={setSearchDate} sx={filterFieldSx} />
        <DatePickerField label="From Date" value={fromDate} onChange={setFromDate} sx={filterFieldSx} />
        <DatePickerField label="To Date" value={toDate} onChange={setToDate} sx={filterFieldSx} />
      </FilterSection>
      <MuiDataGrid rows={filtered} columns={columns} pageSize={10} />
      <RightDrawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="Income Details" variant="income" footer={<Button onClick={() => setViewRecord(null)} sx={{ height: 44 }}>Close</Button>}>
        {viewRecord && (
          <DrawerFormStack>
            {[
              ['Date', formatDate(viewRecord.date)], ['Total Income', formatCurrency(viewRecord.totalIncome)],
              ['Booked Rooms', viewRecord.bookedRooms], ['Vacant Rooms', viewRecord.vacantRooms],
              ['Cash', formatCurrency(viewRecord.cashCollection)], ['UPI', formatCurrency(viewRecord.upiCollection)],
              ['Card', formatCurrency(viewRecord.cardCollection)], ['Admin', viewRecord.adminName],
            ].map(([label, value]) => <DrawerDetailItem key={label} label={label} value={value} />)}
          </DrawerFormStack>
        )}
      </RightDrawer>
    </>
  )
}

const Accounts = () => {
  const { user } = useAuth()
  return (
    <PageTransition className="page-container">
      {user?.role === ROLES.SUPER_ADMIN ? <SuperAdminAccounts /> : <AdminAccounts />}
    </PageTransition>
  )
}

export default Accounts
