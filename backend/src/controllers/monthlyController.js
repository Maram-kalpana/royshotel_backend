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

export const create = asyncHandler(async (req, res) => {
  success(res, await monthlyService.createTenant(req.body), 201)
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
