import { useState, useEffect } from 'react'
import { Box, IconButton, Select, MenuItem, Typography, useMediaQuery } from '@mui/material'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { horizontalScrollbarSx } from '../utils/layout'

const BORDER = '#cbd5e1'
const COMPACT_BREAKPOINT = '(max-width:1023px)'

const getTableMinWidth = (columns) =>
  columns.reduce((sum, col) => sum + (col.width || col.minWidth || 120), 0)

const getColumnSx = (col, compact) => {
  if (compact && col.compactWidth) {
    return {
      width: col.compactWidth,
      minWidth: col.compactWidth,
      maxWidth: col.compactWidth,
      whiteSpace: col.allowWrap ? 'normal' : 'nowrap',
      overflow: 'hidden',
    }
  }
  const base = {
    minWidth: col.minWidth || col.width,
    whiteSpace: col.allowWrap ? 'normal' : 'nowrap',
  }
  if (col.width) return { ...base, width: col.width }
  if (compact && col.flex) return { ...base, width: 'auto' }
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
  compactColumns,
  pageSize = 10,
  getRowId = (row) => row.id,
  emptyMessage = 'No records found',
  noHorizontalScroll = false,
  onRowClick,
  hidePagination = false,
  mobileGrid = true,
}) => {
  const isCompact = useMediaQuery(COMPACT_BREAKPOINT)
  const isMobile = useMediaQuery('(max-width:767px)')
  const activeColumns = isCompact && compactColumns?.length ? compactColumns : columns
  const useCardGrid = mobileGrid && isMobile && !compactColumns?.length
  const compactTable = isCompact && !!compactColumns?.length

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  useEffect(() => {
    setPage(0)
  }, [rows.length, activeColumns.length])

  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * rowsPerPage
  const pageRows = rows.slice(start, start + rowsPerPage)

  const goToPage = (p) => setPage(Math.max(0, Math.min(p, totalPages - 1)))
  const tableMinWidth = (noHorizontalScroll || compactTable) ? '100%' : getTableMinWidth(activeColumns)
  const showPagination = !hidePagination && totalRows > rowsPerPage
  const dataColumns = activeColumns.filter((c) => c.field !== 'actions')

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {useCardGrid ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {pageRows.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: '#94a3b8', fontSize: '0.875rem' }}>
              {emptyMessage}
            </Typography>
          ) : (
            pageRows.map((row) => (
              <Box
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 2,
                  px: 1.25,
                  py: 1,
                  bgcolor: '#fff',
                  cursor: onRowClick ? 'pointer' : 'default',
                  minWidth: 0,
                  flexWrap: 'wrap',
                  '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fafc' },
                }}
              >
                <Box sx={{ display: 'flex', flex: 1, minWidth: 0, flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center' }}>
                  {dataColumns.map((col) => (
                    <Box key={col.field} sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5, maxWidth: '100%' }}>
                      <Typography component="span" variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                        {col.headerName}:
                      </Typography>
                      <Typography component="span" variant="body2" sx={{ color: '#334155', fontSize: '0.8125rem', fontWeight: 500, wordBreak: 'break-word' }}>
                        {col.renderCell
                          ? col.renderCell({ row, value: row[col.field] })
                          : getCellValue(row, col)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {activeColumns.find((c) => c.field === 'actions')?.renderCell && (
                  <Box sx={{ flexShrink: 0, ml: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    {activeColumns.find((c) => c.field === 'actions').renderCell({ row, value: row.actions })}
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            overflowX: (noHorizontalScroll || compactTable) ? 'hidden' : 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            ...((noHorizontalScroll || compactTable) ? {} : horizontalScrollbarSx),
            border: `1px solid ${BORDER}`,
            bgcolor: '#fff',
          }}
        >
          <Box
            component="table"
            sx={{
              width: '100%',
              minWidth: tableMinWidth,
              tableLayout: (noHorizontalScroll || compactTable) ? 'fixed' : 'auto',
              borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Box component="thead">
              <Box component="tr" sx={{ bgcolor: '#f8fafc' }}>
                {activeColumns.map((col) => (
                  <Box
                    component="th"
                    key={col.field}
                    sx={{
                      px: compactTable ? 1 : (noHorizontalScroll ? 1 : 2),
                      py: compactTable ? 1 : 1.5,
                      textAlign: 'left',
                      fontSize: compactTable ? '0.75rem' : '0.8125rem',
                      fontWeight: 600,
                      color: '#475569',
                      borderBottom: `1px solid ${BORDER}`,
                      borderRight: `1px solid ${BORDER}`,
                      ...getColumnSx(col, compactTable),
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
                  <Box component="td" colSpan={activeColumns.length} sx={{ px: 2, py: 6, textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', borderBottom: `1px solid ${BORDER}` }}>
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
                      {activeColumns.map((col) => (
                        <Box
                          component="td"
                          key={col.field}
                          sx={{
                            px: compactTable ? 1 : (noHorizontalScroll ? 1 : 2),
                            py: compactTable ? 0.75 : (noHorizontalScroll ? 1 : 1.25),
                            fontSize: compactTable ? '0.75rem' : '0.8125rem',
                            color: '#334155',
                            borderBottom: isLastRow ? 'none' : `1px solid ${BORDER}`,
                            borderRight: `1px solid ${BORDER}`,
                            verticalAlign: 'middle',
                            ...getColumnSx(col, compactTable),
                          }}
                        >
                          {col.renderCell
                            ? col.renderCell({ row, value: row[col.field] })
                            : getCellValue(row, col)}
                        </Box>
                      ))}
                    </Box>
                  )
                })
              )}
            </Box>
          </Box>
        </Box>
      )}

      {showPagination && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, pt: 2, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>Rows per page:</Typography>
            <Select size="small" variant="standard" disableUnderline value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }} sx={{ fontSize: '0.8125rem', minWidth: 48 }}>
              {[5, 10, 25, 50].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
            {totalRows === 0 ? '0 of 0' : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} of ${totalRows}`}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <IconButton size="small" onClick={() => goToPage(0)} disabled={safePage === 0}><ChevronsLeft size={17} /></IconButton>
            <IconButton size="small" onClick={() => goToPage(safePage - 1)} disabled={safePage === 0}><ChevronLeft size={17} /></IconButton>
            <Typography variant="body2" sx={{ mx: 1, fontSize: '0.8125rem' }}>Page {safePage + 1} of {totalPages}</Typography>
            <IconButton size="small" onClick={() => goToPage(safePage + 1)} disabled={safePage >= totalPages - 1}><ChevronRight size={17} /></IconButton>
            <IconButton size="small" onClick={() => goToPage(totalPages - 1)} disabled={safePage >= totalPages - 1}><ChevronsRight size={17} /></IconButton>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default PlainTable
