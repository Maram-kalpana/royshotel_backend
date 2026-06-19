import { useEffect, useState } from 'react'
import {
  DoorOpen, Bed, Users, CalendarCheck,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import PageTransition from '../components/PageTransition'
import { StatCardSkeleton } from '../components/LoadingSkeleton'
import { useHotel, useBookings } from '../hooks/useStore'
import { motion } from 'framer-motion'

const SuperAdminDashboard = () => {
  const { stats } = useHotel()
  const { list: bookings } = useBookings()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const kpiCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: DoorOpen, color: 'violet' },
    { title: 'Total Beds', value: stats.totalBeds, icon: Bed, color: 'gold' },
    { title: 'Occupied Beds', value: stats.occupiedBeds, icon: Users, color: 'rose' },
    { title: 'Vacant Beds', value: stats.vacantBeds, icon: Bed, color: 'emerald' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'slate' },
    { title: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: 'royal' },
  ]

  return (
    <PageTransition className="page-container">
      <div className="mb-6">
        <h2 className="section-title">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Monitor hotel data and operations — read-only view</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpiCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StatCard {...card} />
            </motion.div>
          ))}
      </div>
    </PageTransition>
  )
}

export default SuperAdminDashboard
