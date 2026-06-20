import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { env } from '../config/env.js'

const uploadPath = path.resolve(env.uploadDir)
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, name)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) cb(null, true)
  else cb(new Error('Only JPG, PNG, and PDF files are allowed'))
}

export const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSize },
  fileFilter,
})
