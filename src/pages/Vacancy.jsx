import { useMemo, useState } from 'react'
import { TextField } from '@mui/material'
import PageTransition from '../components/PageTransition'
import MuiDataGrid from '../components/MuiDataGrid'
import { useHotel } from '../hooks/useStore'
import { formatCurrency } from '../utils/helpers'
import { filterFieldSx } from '../utils/layout'

const Vacancy = () => {
  const { beds } = useHotel()

  const [floorFilter, setFloorFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')

  const tableRows = useMemo(() => {
    let rows = beds
      .filter((b) => b.status === 'vacant')
      .map((b) => ({
        id: b.id,
        floorNumber: b.floorNumber,
        roomNumber: b.roomNumber,
        bedNumber: b.bedNumber,
        costPerBed: b.cost,
      }))
    if (floorFilter) rows = rows.filter((r) => String(r.floorNumber).includes(floorFilter))
    if (roomFilter) rows = rows.filter((r) => String(r.roomNumber).includes(roomFilter))
    return rows
  }, [beds, floorFilter, roomFilter])

  const columns = [
    { field: 'floorNumber', headerName: 'Floor Number', flex: 1, minWidth: 120 },
    { field: 'roomNumber', headerName: 'Room Number', flex: 1, minWidth: 120 },
    { field: 'bedNumber', headerName: 'Bed Number', flex: 1, minWidth: 110 },
    { field: 'costPerBed', headerName: 'Cost Per Bed', flex: 1, minWidth: 130, valueFormatter: (value) => formatCurrency(value) },
  ]

  return (
    <PageTransition className="page-container">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <TextField label="Floor Number" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} sx={filterFieldSx} />
        <TextField label="Room Number" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} sx={filterFieldSx} />
      </div>

      <MuiDataGrid rows={tableRows} columns={columns} pageSize={10} />
    </PageTransition>
  )
}

export default Vacancy
