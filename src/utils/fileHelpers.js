import api from '../services/api.js'

/**
 * Converts a File or Blob to a Base64 data URL string.
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

/** Build FileUpload value from an existing stored URL (edit mode). */
export const fileStateFromUrl = (url, name = 'existing-image.jpg') => {
  if (!url || typeof url !== 'string' || url.startsWith('blob:')) return null
  return {
    file: null,
    name,
    type: 'image/jpeg',
    preview: url,
    existingUrl: url,
    isExisting: true,
  }
}

const UPLOAD_FIELD_DIRS = {
  photo: 'customers',
  aadhaarDoc: 'identity-proofs',
  aadhaarFront: 'identity-proofs',
  aadhaarBack: 'identity-proofs',
  panDoc: 'identity-proofs',
  receipt: 'identity-proofs',
}

/**
 * Upload a single file via multipart FormData to POST /api/uploads.
 * Returns persistent URL like /uploads/identity-proofs/123.jpg
 */
export const uploadImageFile = async (file, field = 'photo') => {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)
  formData.append('field', field)

  console.log('Selected File:', file)
  console.log('Upload field:', field)

  const res = await api.post('/uploads', formData)
  const payload = res.data?.data ?? res.data
  const url = payload?.url ?? null

  console.log('Upload response URL:', url)
  return url
}

/**
 * Resolve the URL to persist: upload new file, keep existing, or null if removed.
 */
export const resolveImageForSubmit = async (fileState, _existingUrl, field) => {
  if (fileState === null) return null
  if (fileState?.file) {
    return uploadImageFile(fileState.file, field)
  }
  if (fileState?.existingUrl) {
    return fileState.existingUrl
  }
  return null
}

/** Upload multiple identity proof images; returns array of URLs. */
export const uploadMultipleImages = async (images = []) => {
  const results = await Promise.all(
    images.map(({ file, field }) => uploadImageFile(file, field || 'identity-proofs')),
  )
  return results.filter(Boolean)
}

export { UPLOAD_FIELD_DIRS }
