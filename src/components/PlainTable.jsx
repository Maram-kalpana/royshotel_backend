import { useState, useEffect } from 'react'
import { Box, IconButton, Select, MenuItem, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { horizontalScrollbarSx } from '../utils/layout'

const BORDER = '#cbd5e1'

const getTableMinWidth = (columns) =>
  columns.reduce((sum, col) => sum + (col.width || col.minWidth || 120), 0)

const getColumnSx = (col) => {
  const base = {
    minWidth: col.minWidth || col.width,
    whiteSpace: col.allowWrap ? 'normal' : 'nowrap',
  }
  if (col.width) return { ...base, width: col.width }
  return base
}

const getCellValue = (row, col) => {
  if (col.valueGetter) return col.valueGetter(row[col.field], row)
  const raw = row[col.field]
  if (col.valueFormatter) return col.valueFormatter(raw)
  return raw ?? '—'
}

const PlainTable = ({
  rows = [],
  columns = [],
  pageSize = 10,
  getRowId = (row) => row.id,
  emptyMessage = 'No records found',
  noHorizontalScroll = false,
  onRowClick,
  hidePagination = false,
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  useEffect(() => {
    setPage(0)
  }, [rows.length])

  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * rowsPerPage
  const pageRows = rows.slice(start, start + rowsPerPage)

  const goToPage = (p) => setPage(Math.max(0, Math.min(p, totalPages - 1)))
  const tableMinWidth = noHorizontalScroll ? '100%' : getTableMinWidth(columns)
  const showPagination = !hidePagination && totalRows > rowsPerPage

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: noHorizontalScroll ? 'hidden' : 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          ...(noHorizontalScroll ? {} : horizontalScrollbarSx),
          border: `1px solid ${BORDER}`,
          bgcolor: '#fff',
        }}
      >
        <Box
          component="table"
          sx={{
            width: '100%',
            minWidth: tableMinWidth,
            tableLayout: noHorizontalScroll ? 'fixed' : 'auto',
            borderCollapse: 'collapse',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Box component="thead">
            <Box component="tr" sx={{ bgcolor: '#f8fafc' }}>
              {columns.map((col) => (
                <Box
                  component="th"
                  key={col.field}
                  sx={{
                    px: 2,
                    py: 1.5,
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#475569',
                    borderBottom: `1px solid ${BORDER}`,
                    borderRight: `1px solid ${BORDER}`,
                    ...getColumnSx(col),
                  }}
                >
                  {col.headerName}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {pageRows.length === 0 ? (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={columns.length}
                  sx={{ px: 2, py: 6, textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', borderBottom: `1px solid ${BORDER}` }}
                >
                  {emptyMessage}
                </Box>
              </Box>
            ) : (
              pageRows.map((row, idx) => {
                const isLastRow = idx === pageRows.length - 1
                return (
                <Box
                  component="tr"
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    bgcolor: idx % 2 === 0 ? '#fff' : '#fafbfc',
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': { bgcolor: 'rgba(11, 31, 77, 0.04)' },
                  }}
                >
                  {columns.map((col) => (
                    <Box
                      component="td"
                      key={col.field}
                      sx={{
                        px: 2,
                        py: 1.25,
                        fontSize: '0.8125rem',
                        color: '#334155',
                        borderBottom: isLastRow ? 'none' : `1px solid ${BORDER}`,
                        borderRight: `1px solid ${BORDER}`,
                        verticalAlign: 'middle',
                        ...getColumnSx(col),
                      }}
                    >
                      {col.renderCell
                        ? col.renderCell({ row, value: row[col.field] })
                        : getCellValue(row, col)}
                    </Box>
                  ))}
                </Box>
              )})
            )}
          </Box>
        </Box>
      </Box>

      {showPagination && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pt: 2,
          pb: 0.5,
          bgcolor: 'transparent',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>Rows per page:</Typography>
          <Select
            size="small"
            variant="standard"
            disableUnderline
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
            sx={{ fontSize: '0.8125rem', minWidth: 48, color: '#475569', '& .MuiSelect-select': { py: 0.25 } }}
          >
            {[5, 10, 25, 50].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
          {totalRows === 0 ? '0 of 0' : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} of ${totalRows}`}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton size="small" onClick={() => goToPage(0)} disabled={safePage === 0} sx={{ color: '#64748b' }} aria-label="First page">
            <ChevronsLeft size={17} />
          </IconButton>
          <IconButton size="small" onClick={() => goToPage(safePage - 1)} disabled={safePage === 0} sx={{ color: '#64748b' }} aria-label="Previous page">
            <ChevronLeft size={17} />
          </IconButton>
          <Typography variant="body2" sx={{ mx: 1, color: '#475569', fontSize: '0.8125rem' }}>
            Page {safePage + 1} of {totalPages}
          </Typography>
          <IconButton size="small" onClick={() => goToPage(safePage + 1)} disabled={safePage >= totalPages - 1} sx={{ color: '#64748b' }} aria-label="Next page">
            <ChevronRight size={17} />
          </IconButton>
          <IconButton size="small" onClick={() => goToPage(totalPages - 1)} disabled={safePage >= totalPages - 1} sx={{ color: '#64748b' }} aria-label="Last page">
            <ChevronsRight size={17} />
          </IconButton>
        </Box>
      </Box>
      )}
    </Box>
  )
}

export default PlainTable
