import * as dashboardService from '../services/dashboardService.js'
import * as accountsService from '../services/accountsService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const stats = asyncHandler(async (_req, res) => {
  success(res, await dashboardService.getDashboardStats())
})

export const monthlyStats = asyncHandler(async (_req, res) => {
  success(res, await dashboardService.getMonthlyPaymentStats())
})

export const vacancyStats = asyncHandler(async (_req, res) => {
  success(res, await dashboardService.getVacancyStats())
})

export const accountsSummary = asyncHandler(async (req, res) => {
  success(res, await accountsService.getAccountsSummary(req.query))
})

export const profitLoss = asyncHandler(async (req, res) => {
  success(res, await accountsService.getProfitLossReport(req.query))
})
