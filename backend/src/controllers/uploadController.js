import { asyncHandler, success } from '../utils/helpers.js'

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const url = `/uploads/${req.file.filename}`
  success(res, { url, filename: req.file.filename, mimeType: req.file.mimetype, field: req.body.field })
})
