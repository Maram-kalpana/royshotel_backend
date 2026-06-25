import { useMemo } from 'react'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import StatCard from '../components/StatCard'
import { useHotel } from '../hooks/useStore'
import { getBedStatusColor, getOccupancyPercentage } from '../utils/helpers'
import { Bed, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const Vacancies = () => {
  const { floors, rooms, beds, stats } = useHotel()

  const occupancyMap = useMemo(() => floors.map((floor) => ({
    ...floor,
    rooms: rooms
      .filter((r) => String(r.floorId) === String(floor.id))
      .map((room) => ({
        ...room,
        beds: beds.filter((b) => String(b.roomId) === String(room.id)),
      })),
  })), [floors, rooms, beds])

  const occupancyPct = getOccupancyPercentage(stats.occupiedBeds, stats.totalBeds)

  return (
    <>
      <Navbar title="Vacancy Management" />
      <PageTransition className="page-container">
        <div className="mb-6">
          <h2 className="section-title">Hotel Occupancy Map</h2>
          <p className="text-slate-500 mt-1">Real-time vacancy overview across all floors</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Vacant Beds" value={stats.vacantBeds} icon={Bed} color="emerald" />
          <StatCard title="Occupied Beds" value={stats.occupiedBeds} icon={Users} color="rose" />
          <StatCard title="Occupancy Rate" value={`${occupancyPct}%`} icon={TrendingUp} color="royal" />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="space-y-6">
            {occupancyMap.map((floor, fi) => (
              <motion.div
                key={floor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: fi * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg gradient-royal flex items-center justify-center text-white text-sm font-bold">
                    {floor.number}
                  </div>
                  <h3 className="font-semibold font-[Poppins] text-lg text-slate-900">{floor.name}</h3>
                  <span className="text-xs text-slate-400 ml-auto">{floor.rooms.length} rooms</span>
                </div>

                <div className="ml-4 border-l-2 border-blue-100 pl-6 space-y-4">
                  {floor.rooms.map((room) => (
                    <div key={room.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600 font-mono text-sm">├</span>
                        <span className="font-medium text-slate-800">Room {room.roomNumber}</span>
                        <span className="text-xs text-slate-400">({room.roomType})</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {room.beds.map((bed, bi) => {
                          const colors = getBedStatusColor(bed.status)
                          const isLast = bi === room.beds.length - 1
                          return (
                            <div key={bed.id} className="flex items-center gap-2 text-sm">
                              <span className="text-slate-300 font-mono">{isLast ? '└' : '├'}</span>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${colors.bg} ${colors.text} font-medium capitalize`}>
                                <span className={`h-2 w-2 rounded-full`} style={{ backgroundColor: colors.hex }} />
                                Bed {bed.bedNumber} — {bed.status}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </PageTransition>
    </>
  )
}

export default Vacancies
