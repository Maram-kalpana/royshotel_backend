import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { Box } from '@mui/material'

const GRID_BORDER = '#cbd5e1'

const MuiDataGrid = ({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  minHeight = 420,
  checkboxSelection = false,
  disableRowSelectionOnClick = true,
  getRowId = (row) => row.id,
  showToolbar = true,
}) => (
  <Box
    sx={{
      width: '100%',
      minHeight,
      border: `1px solid ${GRID_BORDER}`,
      borderRadius: 2,
      overflow: 'hidden',
      bgcolor: '#fff',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
    }}
  >
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={getRowId}
      checkboxSelection={checkboxSelection}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      pageSizeOptions={[5, 10, 25, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize } },
      }}
      slots={showToolbar ? { toolbar: GridToolbar } : undefined}
      slotProps={showToolbar ? {
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 300 },
        },
      } : undefined}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'grid-row-even' : 'grid-row-odd'}
      sx={{
        width: '100%',
        border: 'none',
        fontFamily: 'Inter, sans-serif',
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f1f5f9',
          borderBottom: `1px solid ${GRID_BORDER}`,
          fontWeight: 600,
          color: '#334155',
          fontSize: '0.8125rem',
          minHeight: '48px !important',
          maxHeight: '48px !important',
        },
        '& .MuiDataGrid-columnHeader': {
          borderRight: `1px solid ${GRID_BORDER}`,
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 600,
        },
        '& .MuiDataGrid-cell': {
          borderRight: `1px solid ${GRID_BORDER}`,
          borderBottom: `1px solid ${GRID_BORDER}`,
          fontSize: '0.8125rem',
        },
        '& .grid-row-even': {
          backgroundColor: '#ffffff',
        },
        '& .grid-row-odd': {
          backgroundColor: '#f8fafc',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(11, 31, 77, 0.06) !important',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: `1px solid ${GRID_BORDER}`,
          minHeight: 52,
        },
        '& .MuiDataGrid-toolbarContainer': {
          borderBottom: `1px solid ${GRID_BORDER}`,
          px: 1.5,
          py: 1,
        },
      }}
    />
  </Box>
)

export default MuiDataGrid
