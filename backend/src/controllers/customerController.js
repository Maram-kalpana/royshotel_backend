import * as customerService from '../services/customerService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const list = asyncHandler(async (req, res) => {
  success(res, await customerService.listCustomers(req.query))
})

export const getOne = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id)
  if (!data) return res.status(404).json({ success: false, message: 'Customer not found' })
  success(res, data)
})

export const create = asyncHandler(async (req, res) => {
  success(res, await customerService.createCustomer(req.body), 201)
})

export const update = asyncHandler(async (req, res) => {
  success(res, await customerService.updateCustomer(req.params.id, req.body))
})

export const checkout = asyncHandler(async (req, res) => {
  success(res, await customerService.checkoutCustomer(req.params.id))
})

export const remove = asyncHandler(async (req, res) => {
  const ok = await customerService.deleteCustomer(req.params.id)
  if (!ok) return res.status(404).json({ success: false, message: 'Customer not found' })
  success(res, { deleted: true })
})
