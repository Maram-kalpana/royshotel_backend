import { useMemo, useState } from 'react'
import { TextField } from '@mui/material'
import PageTransition from '../components/PageTransition'
import StatCard from '../components/StatCard'
import MuiDataGrid from '../components/MuiDataGrid'
import FilterSection from '../components/FilterSection'
import StatusBadge from '../components/StatusBadge'
import { useAuth, useHotel } from '../hooks/useStore'
import { formatCurrency, ROLES } from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'
import { Bed, DoorOpen } from 'lucide-react'

const Vacancy = () => {
  const { user } = useAuth()
  const { beds, rooms } = useHotel()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [floorFilter, setFloorFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [applied, setApplied] = useState({ floor: '', room: '' })

  const vacantBeds = useMemo(() => beds.filter((b) => b.status === 'vacant'), [beds])

  const vacantRooms = useMemo(() => {
    const roomIds = new Set(vacantBeds.map((b) => b.roomId))
    return rooms.filter((r) => roomIds.has(r.id))
  }, [vacantBeds, rooms])

  const tableRows = useMemo(() => {
    let rows = vacantBeds.map((b) => ({
      id: b.id,
      floorNumber: b.floorNumber,
      roomNumber: b.roomNumber,
      bedNumber: b.bedNumber,
      costPerBed: b.cost,
      status: 'vacant',
    }))
    if (applied.floor) rows = rows.filter((r) => String(r.floorNumber).includes(applied.floor))
    if (applied.room) rows = rows.filter((r) => String(r.roomNumber).includes(applied.room))
    return rows
  }, [vacantBeds, applied])

  const handleSearch = () => setApplied({ floor: floorFilter, room: roomFilter })
  const handleReset = () => {
    setFloorFilter('')
    setRoomFilter('')
    setApplied({ floor: '', room: '' })
  }

  const baseColumns = [
    { field: 'floorNumber', headerName: 'Floor Number', flex: 1, minWidth: 120 },
    { field: 'roomNumber', headerName: 'Room Number', flex: 1, minWidth: 120 },
    { field: 'bedNumber', headerName: 'Bed Number', flex: 1, minWidth: 110 },
    { field: 'costPerBed', headerName: 'Cost Per Bed', flex: 1, minWidth: 130, valueFormatter: (value) => formatCurrency(value) },
  ]

  const columns = isSuperAdmin
    ? baseColumns
    : [...baseColumns, { field: 'status', headerName: 'Status', width: 110, renderCell: () => <StatusBadge status="vacant" /> }]

  return (
    <PageTransition className="page-container">
        <div className="page-header">
          <h2 className="section-title">Vacancy</h2>
          <p className="page-subtitle">
            {isSuperAdmin ? 'Monitor vacant rooms and beds' : 'Available rooms and beds for booking'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <StatCard title={isSuperAdmin ? 'Vacant Rooms' : 'Total Vacant Rooms'} value={vacantRooms.length} icon={DoorOpen} color="royal" />
          <StatCard title={isSuperAdmin ? 'Vacant Beds' : 'Total Vacant Beds'} value={vacantBeds.length} icon={Bed} color="emerald" />
        </div>

        <FilterSection onSearch={handleSearch} onReset={handleReset}>
          <TextField label="Floor Number" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} sx={filterFieldSx} />
          <TextField label="Room Number" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} sx={filterFieldSx} />
        </FilterSection>

        <MuiDataGrid rows={tableRows} columns={columns} pageSize={10} />
      </PageTransition>
  )
}

export default Vacancy
