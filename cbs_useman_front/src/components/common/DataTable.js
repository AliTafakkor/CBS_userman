import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';

const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView,
  emptyMessage = "No data available" 
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const renderCellValue = (row, column) => {
    const value = column.field.split('.').reduce((obj, key) => obj?.[key], row);

    if (column.renderCell) {
      return column.renderCell(row);
    }

    if (column.type === 'status') {
      const colorMap = {
        active: 'success',
        pending: 'warning',
        inactive: 'default',
      };
      return <Chip label={value} color={colorMap[value] || 'default'} size="small" />;
    }

    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    return value || '-';
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.field} align={column.align || 'left'}>
                {column.headerName}
              </TableCell>
            ))}
            {(onEdit || onDelete || onView) && (
              <TableCell align="right">Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} hover>
              {columns.map((column) => (
                <TableCell key={column.field} align={column.align || 'left'}>
                  {renderCellValue(row, column)}
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell align="right">
                  {onView && (
                    <IconButton size="small" onClick={() => onView(row)} color="info">
                      <ViewIcon />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton size="small" onClick={() => onEdit(row)} color="primary">
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton size="small" onClick={() => onDelete(row)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
