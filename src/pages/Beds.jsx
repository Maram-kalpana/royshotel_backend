import { useMemo } from 'react'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import BedCard from '../components/BedCard'
import { useHotel } from '../hooks/useStore'
import { motion } from 'framer-motion'

const Beds = () => {
  const { beds, rooms } = useHotel()

  const roomGroups = useMemo(() => {
    const groups = {}
    rooms.forEach((room) => {
      groups[room.id] = { room, beds: beds.filter((b) => String(b.roomId) === String(room.id)) }
    })
    return Object.values(groups)
  }, [beds, rooms])

  return (
    <>
      <Navbar title="Bed Management" />
      <PageTransition className="page-container">
        <div className="mb-6">
          <h2 className="section-title">Bed Layout</h2>
          <p className="text-slate-500 mt-1">Visual room-wise bed status overview</p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          {[
            { label: 'Vacant', color: 'bg-emerald-500' },
            { label: 'Occupied', color: 'bg-red-500' },
            { label: 'Reserved', color: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roomGroups.map(({ room, beds: roomBeds }, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-[Poppins] text-slate-900">Room {room.roomNumber}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{room.roomType}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roomBeds.map((bed) => (
                  <BedCard key={bed.id} bed={bed} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </PageTransition>
    </>
  )
}

export default Beds
