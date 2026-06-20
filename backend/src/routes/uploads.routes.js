import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import { upload } from '../middleware/upload.js'
import * as uploadController from '../controllers/uploadController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.post('/', upload.single('file'), uploadController.uploadFile)

export default router
