import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Transaction } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { getCategoryColor } from '../expenses/utils';
import { hexToRgba, getBorderOpacity } from '../budget/utils';

interface ExpensesTableProps {
  expenses: Transaction[];
  displayCurrency: string;
  colors: any;
  colorPalette: string;
  categories: string[];
  exchangeRates: { [key: string]: number };
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  onEdit: (expense: Transaction) => void;
  onDelete: (transactionId: number) => void;
  loading?: boolean;
  onHide?: () => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  displayCurrency,
  colors,
  colorPalette,
  categories,
  exchangeRates,
  convertAmount,
  onEdit,
  onDelete,
  loading = false,
  onHide,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            color: colors.card_text,
            fontWeight: 600,
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          All Expenses
        </Typography>
        {onHide && (
          <Button
            variant="text"
            onClick={onHide}
            sx={{
              color: colors.card_subtext,
              fontFamily: 'Inter, -apple-system, sans-serif',
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_text, 0.05),
              },
            }}
          >
            Hide Table
          </Button>
        )}
      </Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          backgroundColor: colors.card_bg,
          borderRadius: 4,
          border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Date
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Merchant
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Category
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Account
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Amount
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Description
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Trip ID
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F5F5F5',
                  color: colors.card_text, 
                  fontWeight: 600, 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: colors.card_subtext, py: 4, borderBottom: 'none' }}>
                  No expenses found for the current period. Click "Add Expense" to get started.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow 
                  key={expense.transaction_id}
                  sx={{
                    backgroundColor: colors.card_bg,
                    '&:hover': {
                      backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#FAFAFA',
                    },
                    borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  }}
                >
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif', borderBottom: 'none' }}>
                    {new Date(expense.transaction_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 500, borderBottom: 'none' }}>
                    {expense.merchant || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}>
                    <Chip
                      label={expense.category || 'Uncategorized'}
                      size="small"
                      sx={{
                        backgroundColor: hexToRgba(getCategoryColor(expense.category || '', categories.indexOf(expense.category || ''), colorPalette, colors.donut_colors), 0.15),
                        color: getCategoryColor(expense.category || '', categories.indexOf(expense.category || ''), colorPalette, colors.donut_colors),
                        fontWeight: 500,
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        border: `1px solid ${hexToRgba(getCategoryColor(expense.category || '', categories.indexOf(expense.category || ''), colorPalette, colors.donut_colors), 0.3)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif', borderBottom: 'none' }}>
                    {expense.account_name || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 600, borderBottom: 'none' }}>
                    {currencyFormat(convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency), displayCurrency)}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_subtext, fontFamily: 'Inter, -apple-system, sans-serif', borderBottom: 'none' }}>
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif', borderBottom: 'none' }}>
                    {expense.trip_id || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(expense)}
                        sx={{ color: colors.card_accent }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(expense.transaction_id)}
                        sx={{ color: '#F44336' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ExpensesTable;

