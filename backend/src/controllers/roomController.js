import * as roomService from '../services/roomService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const getOne = asyncHandler(async (req, res) => {
  const data = await roomService.getRoomById(req.params.id)
  if (!data) return res.status(404).json({ success: false, message: 'Room not found' })
  success(res, data)
})

export const listRooms = asyncHandler(async (req, res) => {
  success(res, await roomService.listRooms(req.query))
})

export const listBeds = asyncHandler(async (req, res) => {
  success(res, await roomService.listBeds(req.query))
})

export const createRoom = asyncHandler(async (req, res) => {
  success(res, await roomService.createRoom(req.body), 201)
})

export const updateRoom = asyncHandler(async (req, res) => {
  success(res, await roomService.updateRoom(req.params.id, req.body))
})

export const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.id)
  success(res, { deleted: true })
})

export const deleteBed = asyncHandler(async (req, res) => {
  await roomService.deleteBed(req.params.id)
  success(res, { deleted: true })
})
