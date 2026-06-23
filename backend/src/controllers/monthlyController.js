import * as monthlyService from '../services/monthlyService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const list = asyncHandler(async (req, res) => {
  success(res, await monthlyService.listTenants(req.query))
})

export const listPending = asyncHandler(async (_req, res) => {
  await monthlyService.refreshPendingStatuses()
  success(res, await monthlyService.listPending())
})

export const listPaid = asyncHandler(async (_req, res) => {
  success(res, await monthlyService.listPaid())
})

export const listDues = asyncHandler(async (req, res) => {
  await monthlyService.refreshPendingStatuses()
  success(res, await monthlyService.listDues(req.query))
})

export const getById = asyncHandler(async (req, res) => {
  success(res, await monthlyService.getTenant(req.params.id))
})

export const create = asyncHandler(async (req, res) => {
  success(res, await monthlyService.createTenant(req.body), 201)
})

export const addPayment = asyncHandler(async (req, res) => {
  success(res, await monthlyService.addSplitPayment(req.params.id, req.body))
})

export const markPaid = asyncHandler(async (req, res) => {
  success(res, await monthlyService.markTenantPaid(req.params.id, req.body))
})

export const update = asyncHandler(async (req, res) => {
  success(res, await monthlyService.updateTenant(req.params.id, req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await monthlyService.deleteTenant(req.params.id)
  success(res, { deleted: true })
})

export const collectionSummary = asyncHandler(async (req, res) => {
  success(res, await monthlyService.getCollectionSummary(req.query))
})

export const exportCsv = asyncHandler(async (req, res) => {
  const data = await monthlyService.listDues(req.query)
  const headers = ['Customer', 'Phone', 'Room', 'Month', 'Rent', 'Paid', 'Balance', 'Status']
  const rows = data.map((d) => [
    d.customerName, d.phone, d.roomNumber, d.month,
    d.totalRent, d.totalPaid, d.balanceAmount, d.paymentStatus,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=monthly-dues.csv')
  res.send(csv)
})
