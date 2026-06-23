import { useState } from 'react'
import { Avatar, Dialog, IconButton } from '@mui/material'
import { X, ZoomIn } from 'lucide-react'
import { isValidImageUrl } from '../utils/helpers'

const DOC_FIELDS = [
  { key: 'photo', label: 'Photo' },
  { key: 'aadhaarFront', label: 'Aadhaar Front', fallback: 'aadhaarDoc' },
  { key: 'aadhaarBack', label: 'Aadhaar Back' },
]

const DocumentSection = ({ customer }) => {
  const [zoomSrc, setZoomSrc] = useState(null)

  const getSrc = (doc) => {
    const val = customer[doc.key] || (doc.fallback ? customer[doc.fallback] : null)
    return isValidImageUrl(val) ? val : null
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-[#0B1F4D]">Documents</h3>
        </div>
        <div className="p-2 grid grid-cols-3 gap-1.5">
          {DOC_FIELDS.map((doc) => {
            const src = getSrc(doc)
            return (
              <div key={doc.key} className="rounded-lg border border-slate-200 overflow-hidden">
                {src ? (
                  <button type="button" onClick={() => setZoomSrc(src)} className="w-full relative group">
                    <Avatar src={src} variant="rounded" sx={{ width: '100%', height: 56, borderRadius: 0 }} />
                    <span className="absolute top-1 right-1 p-0.5 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100">
                      <ZoomIn size={10} />
                    </span>
                  </button>
                ) : (
                  <div className="h-14 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400">—</div>
                )}
                <p className="text-[10px] font-medium text-slate-600 text-center py-1 bg-slate-50">{doc.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!zoomSrc} onClose={() => setZoomSrc(null)} maxWidth="md" fullWidth>
        <div className="relative p-2">
          <IconButton onClick={() => setZoomSrc(null)} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}><X size={18} /></IconButton>
          {zoomSrc && <img src={zoomSrc} alt="Document" className="w-full max-h-[80vh] object-contain rounded" />}
        </div>
      </Dialog>
    </>
  )
}

export default DocumentSection
