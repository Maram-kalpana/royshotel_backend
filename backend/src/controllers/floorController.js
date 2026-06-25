import * as floorService from '../services/floorService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const list = asyncHandler(async (_req, res) => {
  success(res, await floorService.listFloors())
})
