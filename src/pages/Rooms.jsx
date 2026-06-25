import { useState, useMemo, useEffect } from 'react'
import { TextField, Button, IconButton, MenuItem, Typography, Box, Divider } from '@mui/material'
import { Plus, Pencil, Trash2, Search, Eye, X } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import DrawerFormStack from '../components/DrawerFormStack'
import { useHotel, useAppDispatch } from '../hooks/useStore'
import { loadRooms } from '../services/dataService'
import { roomsApi, bedsApi } from '../services/endpoints'
import { formatCurrency, displayValue } from '../utils/helpers'
import { MergedCell, VerticalActions } from '../components/tableCells'
import PageToolbar from '../components/PageToolbar'
import { fieldSx, primaryButtonSx, amountFieldSx, toolbarSearchSx, toolbarButtonSx, drawerSelectMenuProps } from '../utils/layout'
import toast from 'react-hot-toast'

const acTypes = ['A/C', 'Non A/C']

const createEmptyBed = (bedNumber) => ({
  id: null,
  bedNumber,
  bedType: 'Single',
  cost: '',
})

const emptyForm = {
  floorNumber: '',
  roomNumber: '',
  acType: 'Non A/C',
  beds: [createEmptyBed(1)],
}

const Rooms = () => {
  const { rooms, beds } = useHotel()
  const dispatch = useAppDispatch()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [viewRoom, setViewRoom] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadRooms(dispatch).catch(console.error)
  }, [dispatch])

  const tableRows = useMemo(() => {
    const rows = []
    for (const room of rooms) {
      const roomBeds = beds
        .filter((b) => String(b.roomId) === String(room.id))
        .sort((a, b) => a.bedNumber - b.bedNumber)

      if (!roomBeds.length) {
        rows.push({
          id: room.id,
          floorNumber: room.floorNumber,
          roomNumber: room.roomNumber,
          acType: displayValue(room.acType, 'Non A/C'),
          bedNumber: '—',
          bedType: '—',
          cost: null,
          room,
          bed: null,
        })
        continue
      }

      for (const bed of roomBeds) {
        rows.push({
          id: `${room.id}-${bed.id}`,
          floorNumber: room.floorNumber,
          roomNumber: room.roomNumber,
          acType: displayValue(room.acType, 'Non A/C'),
          bedNumber: bed.bedNumber,
          bedType: bed.bedType || '—',
          cost: bed.cost,
          room,
          bed: { ...bed, status: bed.status },
        })
      }
    }
    return rows
  }, [rooms, beds])

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tableRows
    return tableRows.filter((row) =>
      String(row.floorNumber).includes(q) ||
      row.roomNumber.toLowerCase().includes(q),
    )
  }, [tableRows, search])

  const viewBeds = useMemo(() => {
    if (!viewRoom) return []
    return beds
      .filter((b) => String(b.roomId) === String(viewRoom.id))
      .sort((a, b) => a.bedNumber - b.bedNumber)
  }, [viewRoom, beds])

  const openAdd = () => {
    setEditMode(false)
    setSelectedRoom(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    const roomBeds = beds
      .filter((b) => String(b.roomId) === String(row.room.id))
      .sort((a, b) => a.bedNumber - b.bedNumber)

    setEditMode(true)
    setSelectedRoom(row.room)
    setForm({
      floorNumber: row.floorNumber,
      roomNumber: row.roomNumber,
      acType: row.acType !== '—' ? row.acType : row.room?.acType || 'Non A/C',
      beds: roomBeds.length
        ? roomBeds.map((b) => ({
          id: b.id,
          bedNumber: b.bedNumber,
          bedType: b.bedType || 'Single',
          cost: b.cost,
        }))
        : [createEmptyBed(1)],
    })
    setFormOpen(true)
  }

  const openView = async (row) => {
    try {
      const detail = await roomsApi.get(row.room.id)
      setViewRoom(detail || row.room)
      setViewOpen(true)
    } catch {
      setViewRoom(row.room)
      setViewOpen(true)
    }
  }

  const handleDelete = async (row) => {
    try {
      if (row.bed?.id) {
        if (row.bed.status === 'occupied') {
          toast.error('Bed is in use')
          return
        }
        await bedsApi.remove(row.bed.id)
        toast.success(`Bed ${row.bedNumber} deleted`)
      } else {
        await roomsApi.remove(row.room.id)
        toast.success(`Room ${row.roomNumber} deleted`)
      }
      await loadRooms(dispatch)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const updateBedRow = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      beds: prev.beds.map((bed, i) => (i === index ? { ...bed, ...patch } : bed)),
    }))
  }

  const addBedRow = () => {
    setForm((prev) => ({
      ...prev,
      beds: [...prev.beds, createEmptyBed(prev.beds.length + 1)],
    }))
  }

  const removeBedRow = (index) => {
    setForm((prev) => {
      if (prev.beds.length <= 1) {
        toast.error('Room must have at least one bed')
        return prev
      }
      return {
        ...prev,
        beds: prev.beds
          .filter((_, i) => i !== index)
          .map((bed, i) => ({ ...bed, bedNumber: i + 1 })),
      }
    })
  }

  const handleSave = async () => {
    if (!form.floorNumber || !form.roomNumber || !form.acType) {
      toast.error('Please fill floor number, room number, and room type')
      return
    }
    if (!form.beds.length) {
      toast.error('Add at least one bed')
      return
    }
    for (const bed of form.beds) {
      if (!bed.bedType || bed.cost === '' || bed.cost == null) {
        toast.error('Each bed needs a type and cost')
        return
      }
    }

    const payload = {
      floorNumber: Number(form.floorNumber),
      roomNumber: String(form.roomNumber).trim(),
      acType: form.acType,
      beds: form.beds.map((bed, index) => ({
        id: bed.id || undefined,
        bedNumber: Number(bed.bedNumber) || index + 1,
        bedType: bed.bedType,
        cost: Number(bed.cost),
      })),
    }

    try {
      if (editMode && selectedRoom) {
        await roomsApi.update(selectedRoom.id, payload)
        toast.success('Room updated successfully')
      } else {
        await roomsApi.create(payload)
        toast.success('Room added successfully')
      }
      await loadRooms(dispatch)
      setFormOpen(false)
      setForm(emptyForm)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room')
    }
  }

  const compactColumns = useMemo(() => [
    {
      field: 'roomBed',
      headerName: 'Room / Bed',
      flex: 1,
      minWidth: 120,
      allowWrap: true,
      renderCell: ({ row }) => (
        <MergedCell lines={[
          `Floor ${row.floorNumber} · Room ${row.roomNumber} · ${row.acType}`,
          `Bed ${row.bedNumber} · ${row.bedType}`,
        ]} />
      ),
    },
    {
      field: 'cost',
      headerName: 'Cost',
      width: 80,
      valueFormatter: (v) => (v != null ? formatCurrency(v) : '—'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 52,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <VerticalActions>
          <IconButton size="small" color="primary" onClick={() => openView(row)} title="View"><Eye size={15} /></IconButton>
          <IconButton size="small" color="info" onClick={() => openEdit(row)} title="Edit"><Pencil size={15} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={15} /></IconButton>
        </VerticalActions>
      ),
    },
  ], [])

  const columns = [
    { field: 'floorNumber', headerName: 'Floor Number', flex: 1, minWidth: 110 },
    { field: 'roomNumber', headerName: 'Room Number', flex: 1, minWidth: 110 },
    { field: 'acType', headerName: 'Room Type', flex: 1, minWidth: 100 },
    { field: 'bedNumber', headerName: 'Bed Number', flex: 1, minWidth: 100 },
    { field: 'bedType', headerName: 'Bed Type', flex: 1, minWidth: 110 },
    { field: 'cost', headerName: 'Cost', flex: 1, minWidth: 100, valueFormatter: (v) => (v != null ? formatCurrency(v) : '—') },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="primary" onClick={() => openView(row)} title="View"><Eye size={16} /></IconButton>
          <IconButton size="small" color="info" onClick={() => openEdit(row)} title="Edit"><Pencil size={16} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <PageToolbar
        filters={(
          <TextField
            placeholder="Search floor or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={toolbarSearchSx}
            size="small"
            InputProps={{ startAdornment: <Search size={16} className="mr-2 text-slate-400 shrink-0" /> }}
          />
        )}
        action={(
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd} sx={toolbarButtonSx}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Room</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          </Button>
        )}
      />

      <MuiDataGrid rows={filteredRows} columns={columns} compactColumns={compactColumns} pageSize={10} noHorizontalScroll />

      <RightDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editMode ? 'Edit Room' : 'Add Room'}
        variant="room"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)} sx={{ height: 44 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} sx={primaryButtonSx}>Save Room</Button>
          </>
        }
      >
        <DrawerFormStack>
          <TextField
            fullWidth
            label="Floor Number"
            type="number"
            value={form.floorNumber}
            onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Room Number"
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            sx={fieldSx}
          />
          <TextField
            select
            fullWidth
            label="Room Type"
            value={form.acType}
            onChange={(e) => setForm({ ...form, acType: e.target.value })}
            sx={fieldSx}
            SelectProps={{ MenuProps: drawerSelectMenuProps }}
          >
            {acTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </TextField>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>Beds</Typography>
            <Button size="small" startIcon={<Plus size={16} />} onClick={addBedRow} sx={{ textTransform: 'none' }}>
              Add Bed
            </Button>
          </Box>

          {form.beds.map((bed, index) => (
            <Box
              key={bed.id || `new-bed-${index}`}
              sx={{
                p: 1.5,
                border: '1px solid #e2e8f0',
                borderRadius: 1,
                bgcolor: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Bed {bed.bedNumber}
                </Typography>
                <IconButton size="small" color="error" onClick={() => removeBedRow(index)} title="Remove bed">
                  <X size={16} />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                  label="Bed Number"
                  type="number"
                  size="small"
                  value={bed.bedNumber}
                  onChange={(e) => updateBedRow(index, { bedNumber: e.target.value })}
                  sx={{ ...fieldSx, flex: '1 1 80px', minWidth: 80 }}
                />
                <TextField
                  label="Bed Type"
                  size="small"
                  value={bed.bedType}
                  onChange={(e) => updateBedRow(index, { bedType: e.target.value })}
                  placeholder="Standard"
                  sx={{ ...fieldSx, flex: '2 1 140px', minWidth: 140 }}
                />
                <TextField
                  label="Cost"
                  type="number"
                  size="small"
                  value={bed.cost}
                  onChange={(e) => updateBedRow(index, { cost: e.target.value })}
                  sx={{ ...amountFieldSx, flex: '1 1 100px', minWidth: 100 }}
                />
              </Box>
            </Box>
          ))}
        </DrawerFormStack>
      </RightDrawer>

      <RightDrawer
        open={viewOpen}
        onClose={() => { setViewOpen(false); setViewRoom(null) }}
        title={viewRoom ? `Room ${viewRoom.roomNumber}` : 'Room Details'}
        variant="room"
        footer={<Button onClick={() => { setViewOpen(false); setViewRoom(null) }} sx={{ height: 44 }}>Close</Button>}
      >
        {viewRoom && (
          <DrawerFormStack>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#fafbfc' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Room Information</Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>Floor: {viewRoom.floorNumber}</Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>Room: {viewRoom.roomNumber}</Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>Type: {displayValue(viewRoom.acType, 'Non A/C')}</Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Beds: {(viewRoom.beds || viewBeds).length}
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>Bed List</Typography>
            {(viewRoom.beds || viewBeds).map((bed) => (
              <Box
                key={bed.id}
                sx={{
                  p: 1.5,
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Bed {bed.bedNumber} → {bed.bedType}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {formatCurrency(bed.cost)}
                </Typography>
              </Box>
            ))}
          </DrawerFormStack>
        )}
      </RightDrawer>
    </PageTransition>
  )
}

export default Rooms
