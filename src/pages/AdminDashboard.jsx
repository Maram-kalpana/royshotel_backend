import { useEffect, useState } from 'react'
import { LogIn, LogOut, Bed, Users, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import PageTransition from '../components/PageTransition'
import { StatCardSkeleton } from '../components/LoadingSkeleton'
import { useHotel } from '../hooks/useStore'
import { formatCurrency } from '../utils/helpers'
import { motion } from 'framer-motion'

const weeklyData = [
  { day: 'Mon', checkins: 5, checkouts: 3 },
  { day: 'Tue', checkins: 8, checkouts: 4 },
  { day: 'Wed', checkins: 6, checkouts: 7 },
  { day: 'Thu', checkins: 9, checkouts: 5 },
  { day: 'Fri', checkins: 12, checkouts: 8 },
  { day: 'Sat', checkins: 15, checkouts: 10 },
  { day: 'Sun', checkins: 10, checkouts: 6 },
]

const AdminDashboard = () => {
  const { stats } = useHotel()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const cards = [
    { title: "Today's Check-ins", value: stats.todayCheckIns, icon: LogIn, color: 'emerald' },
    { title: "Today's Check-outs", value: stats.todayCheckOuts, icon: LogOut, color: 'rose' },
    { title: 'Vacant Beds', value: stats.vacantBeds, icon: Bed, color: 'royal' },
    { title: 'Occupied Beds', value: stats.occupiedBeds, icon: Users, color: 'violet' },
    { title: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: CreditCard, color: 'gold' },
  ]

  return (
    <PageTransition className="page-container">
        <div className="mb-6">
          <h2 className="section-title">Today's Overview</h2>
          <p className="text-slate-500 mt-1">Manage daily hotel operations efficiently</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
            : cards.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <StatCard {...card} />
              </motion.div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Weekly Check-ins & Check-outs" subtitle="This week's activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="checkins" fill="#1e40af" radius={[4, 4, 0, 0]} name="Check-ins" />
                <Bar dataKey="checkouts" fill="#d4af37" radius={[4, 4, 0, 0]} name="Check-outs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold font-[Poppins] text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'New Booking', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Check-in Guest', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                { label: 'Check-out Guest', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                { label: 'View Vacancies', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl font-medium text-sm transition-colors ${action.color}`}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
  )
}

export default AdminDashboard
