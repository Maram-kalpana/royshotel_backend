import { useState } from 'react'
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, IconButton,
} from '@mui/material'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import { useAuth, useAppDispatch, useReports } from '../hooks/useStore'
import { addReport, updateReport, deleteReport } from '../redux/slices/reportsSlice'
import { formatDate, formatDateTime, ROLES } from '../utils/helpers'
import toast from 'react-hot-toast'

const emptyForm = {
  reportDate: new Date().toISOString().split('T')[0],
  title: '',
  description: '',
  occupancySummary: '',
  issuesFaced: '',
  remarks: '',
}

const SuperAdminReports = () => {
  const { list } = useReports()
  const [viewReport, setViewReport] = useState(null)

  const columns = [
    {
      field: 'reportDate',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => formatDate(value),
    },
    { field: 'adminName', headerName: 'Admin Name', flex: 1, minWidth: 140 },
    { field: 'title', headerName: 'Report Title', flex: 1.2, minWidth: 160 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 200 },
    {
      field: 'createdAt',
      headerName: 'Created Time',
      flex: 1,
      minWidth: 160,
      valueFormatter: (value) => formatDateTime(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => setViewReport(params.row)} title="View">
          <Eye size={16} />
        </IconButton>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h2 className="section-title">Reports</h2>
        <p className="text-slate-500 mt-1">View daily reports submitted by Admin · {list.length} reports</p>
      </div>

      <MuiDataGrid rows={list} columns={columns} pageSize={10} mobileGrid />

      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="font-[Poppins] font-semibold">Report Details</DialogTitle>
        <DialogContent>
          {viewReport && (
            <div className="space-y-3 mt-2">
              {[
                { label: 'Date', value: formatDate(viewReport.reportDate) },
                { label: 'Admin Name', value: viewReport.adminName },
                { label: 'Report Title', value: viewReport.title },
                { label: 'Description', value: viewReport.description },
                { label: 'Occupancy Summary', value: viewReport.occupancySummary },
                { label: 'Issues Faced', value: viewReport.issuesFaced },
                { label: 'Remarks', value: viewReport.remarks },
                { label: 'Created Time', value: formatDateTime(viewReport.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-sm text-slate-900 mt-1">{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setViewReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const AdminReports = () => {
  const { user } = useAuth()
  const { list } = useReports()
  const dispatch = useAppDispatch()
  const [formOpen, setFormOpen] = useState(false)
  const [viewReport, setViewReport] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openAddForm = () => {
    setEditMode(false)
    setEditId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditForm = (report) => {
    setEditMode(true)
    setEditId(report.id)
    setForm({
      reportDate: report.reportDate,
      title: report.title,
      description: report.description,
      occupancySummary: report.occupancySummary,
      issuesFaced: report.issuesFaced,
      remarks: report.remarks,
    })
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.title || !form.description) {
      toast.error('Please fill required fields')
      return
    }

    if (editMode && editId) {
      dispatch(updateReport({ id: editId, ...form, createdAt: new Date().toISOString() }))
      toast.success('Report updated successfully')
    } else {
      dispatch(addReport({
        id: `report-${Date.now()}`,
        ...form,
        adminName: user?.name || 'Admin',
        adminId: user?.id || 'admin-1',
        createdAt: new Date().toISOString(),
      }))
      toast.success('Report submitted successfully')
    }

    setFormOpen(false)
    setForm(emptyForm)
  }

  const handleReset = () => setForm(emptyForm)

  const handleDelete = (id) => {
    dispatch(deleteReport(id))
    toast.success('Report deleted')
  }

  const columns = [
    {
      field: 'reportDate',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => formatDate(value),
    },
    { field: 'title', headerName: 'Title', flex: 1.2, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 180 },
    { field: 'occupancySummary', headerName: 'Occupancy Summary', flex: 1.2, minWidth: 160 },
    {
      field: 'createdAt',
      headerName: 'Created Time',
      flex: 1,
      minWidth: 160,
      valueFormatter: (value) => formatDateTime(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-1 h-full">
          <IconButton size="small" color="primary" onClick={() => setViewReport(params.row)} title="View">
            <Eye size={16} />
          </IconButton>
          <IconButton size="small" color="info" onClick={() => openEditForm(params.row)} title="Edit">
            <Pencil size={16} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)} title="Delete">
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Daily Reports</h2>
          <p className="text-slate-500 mt-1">Submit and manage daily hotel reports · {list.length} total</p>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAddForm}>
          Add Report
        </Button>
      </div>

      <MuiDataGrid rows={list} columns={columns} pageSize={10} mobileGrid />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="font-[Poppins] font-semibold">
          {editMode ? 'Edit Report' : 'Add Daily Report'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-1">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Report Date"
                value={form.reportDate}
                onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Report Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Occupancy Summary"
                value={form.occupancySummary}
                onChange={(e) => setForm({ ...form, occupancySummary: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Issues Faced"
                value={form.issuesFaced}
                onChange={(e) => setForm({ ...form, issuesFaced: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={handleReset}>Reset</Button>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit Report</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="font-[Poppins] font-semibold">Report Details</DialogTitle>
        <DialogContent>
          {viewReport && (
            <div className="space-y-3 mt-2">
              {[
                { label: 'Date', value: formatDate(viewReport.reportDate) },
                { label: 'Title', value: viewReport.title },
                { label: 'Description', value: viewReport.description },
                { label: 'Occupancy Summary', value: viewReport.occupancySummary },
                { label: 'Issues Faced', value: viewReport.issuesFaced },
                { label: 'Remarks', value: viewReport.remarks },
                { label: 'Created Time', value: formatDateTime(viewReport.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-sm text-slate-900 mt-1">{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setViewReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const Reports = () => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  return (
    <>
      <Navbar title="Reports" />
      <PageTransition className="page-container">
        {isSuperAdmin ? <SuperAdminReports /> : <AdminReports />}
      </PageTransition>
    </>
  )
}

export default Reports
