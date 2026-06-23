import { motion } from 'framer-motion'
import { cn } from '../utils/helpers'

const StatCard = ({ title, value, icon: Icon, color = 'royal', trend, subtitle }) => {
  const colorMap = {
    royal: 'from-blue-600 to-blue-400',
    gold: 'from-amber-500 to-yellow-400',
    emerald: 'from-emerald-600 to-emerald-400',
    rose: 'from-rose-600 to-rose-400',
    violet: 'from-violet-600 to-violet-400',
    slate: 'from-slate-600 to-slate-400',
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(30, 64, 175, 0.12)' }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-blue-100 transition-colors h-full flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', colorMap[color])}>
          {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500 font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 font-[Poppins]">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </motion.div>
  )
}

export default StatCard
