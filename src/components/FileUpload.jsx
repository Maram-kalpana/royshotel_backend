import { useRef } from 'react'
import { Box, Typography, Button, IconButton } from '@mui/material'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

const ACCEPTED = '.jpg,.jpeg,.png,.pdf'

const FileUpload = ({ label, value, onChange, accept = ACCEPTED }) => {
  const inputRef = useRef(null)
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
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>{label}</Typography>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {!value ? (
        <Box
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed #cbd5e1',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59,130,246,0.04)' },
          }}
        >
          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
          <Typography variant="body2" color="text.secondary">Click to select file</Typography>
          <Typography variant="caption" color="text.secondary">JPG, JPEG, PNG, PDF</Typography>
        </Box>
      ) : (
        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#f8fafc' }}>
          {isImage && value.preview && (
            <Box
              component="img"
              src={value.preview}
              alt={label}
              sx={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 1, mb: 1.5 }}
            />
          )}
          {isPdf && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 2, bgcolor: '#fff', borderRadius: 1 }}>
              <FileText size={32} className="text-red-500" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>PDF Document</Typography>
            </Box>
          )}
          {!isImage && !isPdf && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ImageIcon size={20} className="text-slate-400" />
            </Box>
          )}
          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 1.5, wordBreak: 'break-all' }}>
            {value.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => inputRef.current?.click()}>Replace</Button>
            <IconButton size="small" color="error" onClick={handleRemove}><X size={16} /></IconButton>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default FileUpload
