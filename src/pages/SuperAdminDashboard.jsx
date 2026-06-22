import { useEffect, useState } from 'react'
import {
  DoorOpen, Bed, Users, CalendarCheck, Receipt, AlertCircle,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import PageTransition from '../components/PageTransition'
import { StatCardSkeleton } from '../components/LoadingSkeleton'
import { useHotel, useBookings, useCustomers, useMonthlyPayments } from '../hooks/useStore'
import { computeHotelStats } from '../utils/helpers'
import { computeMonthlyPaymentStats } from '../utils/monthlyPaymentHelpers'
import { dashboardApi } from '../services/endpoints'
import { motion } from 'framer-motion'

const SuperAdminDashboard = () => {
  const hotel = useHotel()
  const { list: bookings } = useBookings()
  const customers = useCustomers()
  const { tenants } = useMonthlyPayments()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = computeHotelStats(hotel, customers, { list: bookings })
  const monthlyStats = computeMonthlyPaymentStats(tenants)

  const kpiCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: DoorOpen, color: 'violet' },
    { title: 'Total Beds', value: stats.totalBeds, icon: Bed, color: 'gold', subtitle: `${stats.occupiedBeds} occupied · ${stats.vacantBeds} vacant` },
    { title: 'Occupied Beds', value: stats.occupiedBeds, icon: Users, color: 'rose' },
    { title: 'Vacant Beds', value: stats.vacantBeds, icon: Bed, color: 'emerald' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'royal' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, color: 'violet' },
    { title: 'Monthly Tenants', value: monthlyStats.monthlyTenants, icon: Receipt, color: 'royal' },
    { title: 'Payments Due', value: monthlyStats.paymentsDue, icon: AlertCircle, color: 'rose' },
    { title: 'Pending Payments', value: monthlyStats.pendingPayments, icon: AlertCircle, color: 'gold' },
  ]

  return (
    <PageTransition className="page-container">
      <div className="mb-6">
        <h2 className="section-title">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">
          {stats.totalBeds} total beds · {stats.occupiedBeds} occupied · {stats.vacantBeds} vacant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpiCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <StatCard {...card} />
            </motion.div>
          ))}
      </div>
    </PageTransition>
  )
}

export default SuperAdminDashboard
