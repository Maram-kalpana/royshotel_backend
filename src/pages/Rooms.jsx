import { useState, useMemo } from 'react'
import { TextField, Button, IconButton, MenuItem } from '@mui/material'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import RightDrawer from '../components/RightDrawer'
import DrawerFormStack from '../components/DrawerFormStack'
import { useHotel, useAppDispatch } from '../hooks/useStore'
import { addRoom, updateRoom, deleteRoom } from '../redux/slices/hotelSlice'
import { formatCurrency, getRoomCostPerBed, displayValue } from '../utils/helpers'
import { fieldSx, primaryButtonSx } from '../utils/layout'
import toast from 'react-hot-toast'

const emptyForm = { floorNumber: '', roomNumber: '', bedType: '', acType: 'Non A/C', costOfBed: '' }
const acTypes = ['A/C', 'Non A/C']

const Rooms = () => {
  const { rooms, beds } = useHotel()
  const dispatch = useAppDispatch()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const tableRows = useMemo(() => rooms.map((room) => ({
    id: room.id,
    floorNumber: room.floorNumber,
    roomNumber: room.roomNumber,
    bedType: displayValue(room.bedType || room.roomType),
    acType: displayValue(room.acType, 'Non A/C'),
    costOfBed: getRoomCostPerBed(room, beds),
    room,
  })), [rooms, beds])

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tableRows
    return tableRows.filter((row) =>
      String(row.floorNumber).includes(q) ||
      row.roomNumber.toLowerCase().includes(q),
    )
  }, [tableRows, search])

  const openAdd = () => { setEditMode(false); setSelectedRoom(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (row) => {
    setEditMode(true)
    setSelectedRoom(row.room)
    setForm({
      floorNumber: row.floorNumber,
      roomNumber: row.roomNumber,
      bedType: row.bedType !== '—' ? row.bedType : row.room?.bedType || row.room?.roomType || '',
      acType: row.acType !== '—' ? row.acType : row.room?.acType || 'Non A/C',
      costOfBed: row.costOfBed,
    })
    setFormOpen(true)
  }
  const handleDelete = (row) => { dispatch(deleteRoom(row.id)); toast.success(`Room ${row.roomNumber} deleted`) }

  const handleSave = () => {
    if (!form.floorNumber || !form.roomNumber || !form.bedType || !form.acType || !form.costOfBed) {
      toast.error('Please fill all fields')
      return
    }
    const payload = {
      floorNumber: form.floorNumber,
      roomNumber: form.roomNumber,
      bedType: form.bedType,
      acType: form.acType,
      costOfBed: form.costOfBed,
      numberOfBeds: selectedRoom?.totalBeds || 1,
    }
    if (editMode && selectedRoom) {
      dispatch(updateRoom({ id: selectedRoom.id, ...payload }))
      toast.success('Room updated successfully')
    } else {
      dispatch(addRoom(payload))
      toast.success('Room added successfully')
    }
    setFormOpen(false)
    setForm(emptyForm)
  }

  const columns = [
    { field: 'floorNumber', headerName: 'Floor Number', flex: 1, minWidth: 120 },
    { field: 'roomNumber', headerName: 'Room Number', flex: 1, minWidth: 120 },
    { field: 'bedType', headerName: 'Bed Type', flex: 1, minWidth: 110 },
    { field: 'acType', headerName: 'Room Type', flex: 1, minWidth: 110 },
    { field: 'costOfBed', headerName: 'Cost of Bed', flex: 1, minWidth: 130, valueFormatter: (v) => formatCurrency(v) },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-0.5 h-full">
          <IconButton size="small" color="primary" onClick={() => openEdit(row)} title="Edit"><Pencil size={16} /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <PageTransition className="page-container">
      <div className="toolbar-row">
        <TextField
          placeholder="Search floor or room number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...fieldSx, width: { xs: '100%', sm: 320 } }}
          InputProps={{ startAdornment: <Search size={16} className="mr-2 text-slate-400 shrink-0" /> }}
        />
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd} sx={primaryButtonSx}>Add Room</Button>
      </div>

      <MuiDataGrid rows={filteredRows} columns={columns} pageSize={10} />

      <RightDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editMode ? 'Edit Room' : 'Add Room'}
        variant="room"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)} sx={{ height: 44 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} sx={primaryButtonSx}>Save</Button>
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
            fullWidth
            label="Bed Type"
            value={form.bedType}
            onChange={(e) => setForm({ ...form, bedType: e.target.value })}
            placeholder="e.g. Single, Double..."
            sx={fieldSx}
          />
          <TextField
            select
            fullWidth
            label="Room Type"
            value={form.acType}
            onChange={(e) => setForm({ ...form, acType: e.target.value })}
            sx={fieldSx}
          >
            {acTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </TextField>
          <TextField
            fullWidth
            label="Cost of Bed"
            type="number"
            value={form.costOfBed}
            onChange={(e) => setForm({ ...form, costOfBed: e.target.value })}
            sx={fieldSx}
          />
        </DrawerFormStack>
      </RightDrawer>
    </PageTransition>
  )
}

export default Rooms
