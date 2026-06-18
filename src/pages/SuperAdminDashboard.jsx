import { useEffect, useState, useMemo } from 'react'
import {
  DoorOpen, Bed, Users, CalendarCheck,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import PageTransition from '../components/PageTransition'
import { StatCardSkeleton } from '../components/LoadingSkeleton'
import StatusBadge from '../components/StatusBadge'
import { useHotel, useBookings, useAccounts } from '../hooks/useStore'
import { formatDate, formatDateTime, getOccupancyPercentage } from '../utils/helpers'
import { formatCurrency } from '../utils/helpers'
import { motion } from 'framer-motion'

const SuperAdminDashboard = () => {
  const { stats } = useHotel()
  const { list: bookings } = useBookings()
  const { list: incomeRecords } = useAccounts()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const recentBookings = useMemo(
    () => [...bookings].slice(0, 6),
    [bookings],
  )

  const recentIncome = useMemo(
    () => [...incomeRecords].slice(0, 5),
    [incomeRecords],
  )

  const kpiCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: DoorOpen, color: 'violet' },
    { title: 'Total Beds', value: stats.totalBeds, icon: Bed, color: 'gold' },
    { title: 'Occupied Beds', value: stats.occupiedBeds, icon: Users, color: 'rose' },
    { title: 'Vacant Beds', value: stats.vacantBeds, icon: Bed, color: 'emerald' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'slate' },
    { title: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: 'royal' },
  ]

  const occupancyPct = getOccupancyPercentage(stats.occupiedBeds, stats.totalBeds)

  return (
    <PageTransition className="page-container">
        <div className="mb-6">
          <h2 className="section-title">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Monitor hotel data and operations — read-only view</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            : kpiCards.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <StatCard {...card} />
              </motion.div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <ChartCard title="Recent Bookings" subtitle="Latest booking activity">
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {recentBookings.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No bookings yet</p>
              ) : (
                recentBookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{booking.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Floor {booking.floorNumber} · Room {booking.roomNumber} · Bed {booking.bedNumber}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                      <div className="mt-1"><StatusBadge status="booked" /></div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ChartCard>

          <ChartCard title="Occupancy Summary" subtitle="Current bed utilization">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${occupancyPct * 2.64} 264`}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-bold text-slate-900 font-[Poppins]">{occupancyPct}%</p>
                  <p className="text-xs text-slate-500">Occupied</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-700">{stats.vacantBeds}</p>
                  <p className="text-xs text-emerald-600 mt-1">Vacant</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50">
                  <p className="text-lg font-bold text-red-700">{stats.occupiedBeds}</p>
                  <p className="text-xs text-red-600 mt-1">Occupied</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-lg font-bold text-amber-700">{stats.reservedBeds}</p>
                  <p className="text-xs text-amber-600 mt-1">Reserved</p>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Daily Income" subtitle="Submitted by Admin">
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {recentIncome.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No income records yet</p>
              ) : (
                recentIncome.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(record.totalIncome)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {record.bookedRooms} booked · {record.vacantRooms} vacant
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{formatDate(record.date)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(record.createdAt)}</p>
                  </motion.div>
                ))
              )}
            </div>
          </ChartCard>
        </div>
      </PageTransition>
  )
}

export default SuperAdminDashboard
