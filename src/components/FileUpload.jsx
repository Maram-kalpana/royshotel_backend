import { useRef, useState, useCallback } from 'react'
import { Box, Typography, Button, IconButton, Dialog } from '@mui/material'
import { Camera, Upload, X, FileText } from 'lucide-react'

const ACCEPTED = '.jpg,.jpeg,.png,.pdf'
const IMAGE_ACCEPT = 'image/*'

const FileUpload = ({
  label,
  value,
  onChange,
  accept = ACCEPTED,
  enableCamera = true,
  captureMode = 'environment',
}) => {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream] = useState(null)

  const imageOnly = accept === IMAGE_ACCEPT || !accept.includes('pdf')
  const isImage = value?.type?.startsWith('image/') || (value?.preview && !value?.name?.endsWith('.pdf'))
  const isPdf = value?.type === 'application/pdf' || value?.name?.endsWith('.pdf')

  const handleFile = (file) => {
    if (!file) return
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    onChange({ file, name: file.name, type: file.type, preview })
  }

  const handleRemove = () => {
    if (value?.preview) URL.revokeObjectURL(value.preview)
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  const openFilePicker = () => fileInputRef.current?.click()

  const openCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: captureMode === 'user' ? 'user' : 'environment' },
          audio: false,
        })
        setStream(mediaStream)
        setCameraOpen(true)
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play().catch(() => {})
          }
        }, 100)
        return
      } catch {
        /* fall through to native capture input */
      }
    }
    cameraInputRef.current?.click()
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      handleFile(file)
      stopStream()
      setCameraOpen(false)
    }, 'image/jpeg', 0.92)
  }

  const closeCamera = () => {
    stopStream()
    setCameraOpen(false)
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>{label}</Typography>

      <input ref={fileInputRef} type="file" accept={accept} hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      {enableCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture={captureMode}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      )}
      <canvas ref={canvasRef} hidden />

      {!value ? (
        <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'center' }}>
            {enableCamera && (
              <Button variant="contained" startIcon={<Camera size={16} />} onClick={openCamera} sx={{ bgcolor: '#0B1F4D', '&:hover': { bgcolor: '#0a1a3d' }, height: 40 }}>
                Take Photo
              </Button>
            )}
            <Button variant="outlined" startIcon={<Upload size={16} />} onClick={openFilePicker} sx={{ height: 40 }}>
              Choose File
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            JPG, JPEG, PNG{!imageOnly ? ', PDF' : ''}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#f8fafc' }}>
          {isImage && value.preview && (
            <Box component="img" src={value.preview} alt={label} sx={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
          )}
          {isPdf && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1.5, bgcolor: '#fff', borderRadius: 1 }}>
              <FileText size={28} className="text-red-500" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>PDF Document</Typography>
            </Box>
          )}
          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 1, wordBreak: 'break-all' }}>{value.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {enableCamera && (
              <Button size="small" variant="outlined" startIcon={<Camera size={14} />} onClick={openCamera}>Retake</Button>
            )}
            <Button size="small" variant="outlined" onClick={openFilePicker}>Replace</Button>
            <IconButton size="small" color="error" onClick={handleRemove}><X size={16} /></IconButton>
          </Box>
        </Box>
      )}

      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>{label}</Typography>
          <Box component="video" ref={videoRef} autoPlay playsInline muted sx={{ width: '100%', borderRadius: 1, bgcolor: '#000', maxHeight: 360 }} />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={closeCamera}>Cancel</Button>
            <Button variant="contained" onClick={capturePhoto} sx={{ bgcolor: '#0B1F4D' }}>Capture</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default FileUpload
