import * as settingsService from '../services/settingsService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const get = asyncHandler(async (_req, res) => {
  success(res, await settingsService.getSettings())
})

export const update = asyncHandler(async (req, res) => {
  success(res, await settingsService.updateSettings(req.body))
})
