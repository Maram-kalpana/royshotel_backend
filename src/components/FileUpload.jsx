import { useRef, useState, useCallback, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Dialog } from '@mui/material'
import { Camera, Upload, X, FileText } from 'lucide-react'

const ACCEPTED = '.jpg,.jpeg,.png,.pdf'
const IMAGE_ACCEPT = 'image/*'
const CAMERA_DIALOG_Z = 2000

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
  const streamRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const imageOnly = accept === IMAGE_ACCEPT || !accept.includes('pdf')
  // Explicit check: treat as image if type starts with image/, OR if it has a
  // blob/object-URL preview (captured photos always have one), OR filename ends
  // with a known image extension — but NOT if it's a PDF.
  const isPdf = value?.type === 'application/pdf' || value?.name?.toLowerCase().endsWith('.pdf')
  const isImage =
    !isPdf &&
    (value?.type?.startsWith('image/') ||
      !!value?.preview ||
      /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(value?.name ?? ''))

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const openFilePicker = () => fileInputRef.current?.click()

  const openNativeCamera = () => {
    setCameraError('')
    cameraInputRef.current?.click()
  }

  // ─── Attach stream to video element ───────────────────────────────────────
  // Uses a ref-callback approach so the stream is attached the moment the
  // <video> DOM node exists, avoiding the race between useEffect and Dialog
  // mounting (which was causing the black screen / "Starting camera…" hang).
  const attachStream = useCallback((videoEl) => {
    videoRef.current = videoEl

    if (!videoEl || !streamRef.current) return

    setCameraReady(false)
    setCameraError('')

    const checkReady = () => {
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        setCameraReady(true)
        return true
      }
      return false
    }

    const onReady = () => { checkReady() }

    videoEl.addEventListener('loadedmetadata', onReady)
    videoEl.addEventListener('loadeddata', onReady)
    videoEl.addEventListener('canplay', onReady)

    videoEl.srcObject = streamRef.current
    videoEl.play().catch((err) => {
      console.error('Video play failed:', err)
      setCameraError('Could not start video preview. Please check camera permissions and try again.')
    })

    // Already ready (e.g. stream was warm)
    checkReady()

    const timeoutId = setTimeout(() => {
      if (!checkReady()) {
        setCameraError(
          'Camera is taking too long to start. Please close and try again, or use "Choose File" instead.'
        )
      }
    }, 6000)

    // Store cleanup on the element so we can call it when Dialog unmounts
    videoEl._cleanup = () => {
      clearTimeout(timeoutId)
      videoEl.removeEventListener('loadedmetadata', onReady)
      videoEl.removeEventListener('loadeddata', onReady)
      videoEl.removeEventListener('canplay', onReady)
    }
  }, [])

  // Run cleanup when the video element is removed from the DOM
  const videoRefCallback = useCallback(
    (el) => {
      // Cleanup previous element if any
      if (videoRef.current && videoRef.current._cleanup) {
        videoRef.current._cleanup()
      }
      if (el) {
        attachStream(el)
      } else {
        videoRef.current = null
      }
    },
    [attachStream]
  )

  // Re-attach whenever cameraOpen flips to true (Dialog re-mounts)
  useEffect(() => {
    if (!cameraOpen) return
    // If the video element is already mounted (keepMounted scenario), attach now
    if (videoRef.current && streamRef.current) {
      attachStream(videoRef.current)
    }
  }, [cameraOpen, attachStream])

  useEffect(() => () => stopStream(), [stopStream])

  // ─── Open camera ──────────────────────────────────────────────────────────
  const openCamera = async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      openNativeCamera()
      return
    }
    try {
      stopStream()
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: captureMode === 'user' ? 'user' : 'environment' },
        audio: false,
      })
      streamRef.current = mediaStream
      setCameraOpen(true)
    } catch (err) {
      console.warn('getUserMedia failed, falling back to native camera input:', err)
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
      setCameraError(
        isDenied
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Camera unavailable. Using device camera instead.'
      )
      openNativeCamera()
    }
  }

  // ─── Capture photo ────────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      setCameraError('Camera not ready. Please wait a moment and try again.')
      return
    }
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is still loading. Please wait and try again.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Failed to capture photo. Please try again.')
          return
        }
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        // Generate preview URL immediately from the blob so it's always available
        const preview = URL.createObjectURL(blob)
        onChange({ file, name: file.name, type: file.type, preview })
        stopStream()
        setCameraOpen(false)
        setCameraError('')
      },
      'image/jpeg',
      0.92
    )
  }

  const closeCamera = () => {
    stopStream()
    setCameraOpen(false)
    setCameraError('')
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
        {label}
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              justifyContent: 'center',
            }}
          >
            {enableCamera && (
              <Button
                variant="contained"
                startIcon={<Camera size={16} />}
                onClick={openCamera}
                sx={{ bgcolor: '#0B1F4D', '&:hover': { bgcolor: '#0a1a3d' }, height: 40 }}
              >
                Take Photo
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Upload size={16} />}
              onClick={openFilePicker}
              sx={{ height: 40 }}
            >
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
            <Box
              component="img"
              src={value.preview}
              alt={label}
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
                mb: 1,
                bgcolor: '#000',
                display: 'block',
              }}
            />
          )}
          {isPdf && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
                p: 1.5,
                bgcolor: '#fff',
                borderRadius: 1,
              }}
            >
              <FileText size={28} className="text-red-500" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                PDF Document
              </Typography>
            </Box>
          )}
          <Typography
            variant="caption"
            sx={{ display: 'block', color: '#64748b', mb: 1, wordBreak: 'break-all' }}
          >
            {value.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {enableCamera && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Camera size={14} />}
                onClick={openCamera}
              >
                Retake
              </Button>
            )}
            <Button size="small" variant="outlined" onClick={openFilePicker}>
              Replace
            </Button>
            <IconButton size="small" color="error" onClick={handleRemove}>
              <X size={16} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* ── Camera Dialog ── */}
      <Dialog
        open={cameraOpen}
        onClose={closeCamera}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: CAMERA_DIALOG_Z }}
        slotProps={{
          root: { sx: { zIndex: CAMERA_DIALOG_Z } },
          backdrop: { sx: { zIndex: CAMERA_DIALOG_Z - 1 } },
        }}
        disableEnforceFocus
        // keepMounted removed — caused videoRef to be null when useEffect ran
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            {label}
          </Typography>

          {/* ref callback ensures stream is attached as soon as the element exists */}
          <Box
            component="video"
            ref={videoRefCallback}
            autoPlay
            playsInline
            muted
            sx={{
              width: '100%',
              borderRadius: 1,
              bgcolor: '#000',
              maxHeight: 360,
              minHeight: 200,
              display: 'block',
            }}
          />

          {cameraError && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {cameraError}
            </Typography>
          )}
          {!cameraReady && !cameraError && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Starting camera…
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={closeCamera}>Cancel</Button>
            <Button
              variant="contained"
              onClick={capturePhoto}
              disabled={!cameraReady}
              sx={{ bgcolor: '#0B1F4D', '&:hover': { bgcolor: '#0a1a3d' } }}
            >
              Capture
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default FileUpload