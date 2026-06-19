import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from '@mui/material'
import { horizontalScrollbarSx } from '../utils/layout'

const DataTable = ({ columns, rows, actions, emptyMessage = 'No data found' }) => (
  <TableContainer
    component={Paper}
    elevation={0}
    className="rounded-2xl! border border-slate-100 horizontal-scrollbar"
    sx={horizontalScrollbarSx}
  >
    <Table sx={{ minWidth: 640 }}>
      <TableHead>
        <TableRow className="bg-slate-50">
          {columns.map((col) => (
            <TableCell key={col.field} className="font-semibold! text-slate-600!">{col.headerName}</TableCell>
          ))}
          {actions && <TableCell className="font-semibold! text-slate-600!">Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" className="py-10! text-slate-400">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={row.id || index} hover className="hover:bg-blue-50/30!">
              {columns.map((col) => (
                <TableCell key={col.field}>
                  {col.renderCell ? col.renderCell(row) : row[col.field]}
                </TableCell>
              ))}
              {actions && (
                <TableCell>
                  <div className="flex gap-1">
                    {actions.map((action) => (
                      <Tooltip key={action.label} title={action.label}>
                        <IconButton size="small" onClick={() => action.onClick(row)} color={action.color || 'primary'}>
                          <action.icon size={16} />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
)

export default DataTable
