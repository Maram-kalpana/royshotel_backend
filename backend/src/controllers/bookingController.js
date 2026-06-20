import * as bookingService from '../services/bookingService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const list = asyncHandler(async (req, res) => {
  success(res, await bookingService.listBookings({ ...req.query, role: req.user.role }))
})

export const create = asyncHandler(async (req, res) => {
  success(res, await bookingService.createBooking(req.body), 201)
})

export const update = asyncHandler(async (req, res) => {
  success(res, await bookingService.updateBooking(req.params.id, req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await bookingService.deleteBooking(req.params.id)
  success(res, { deleted: true })
})
