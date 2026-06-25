import { asyncHandler, success } from '../utils/helpers.js'
import { SUBDIRS } from '../middleware/upload.js'

export const uploadFile = asyncHandler(async (req, res) => {
  console.log('req.files:', req.file ? [req.file] : req.files)
  console.log('req.body:', req.body)

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const field = req.body.field || 'photo'
  const subdir = SUBDIRS[field] || 'identity-proofs'
  const url = `/uploads/${subdir}/${req.file.filename}`

  success(res, {
    url,
    imageUrl: url,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    field,
  })
})
