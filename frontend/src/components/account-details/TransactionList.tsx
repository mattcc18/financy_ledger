import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Transaction, Account, Trip } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { ExpenseTrackingColors } from '../expenses/types';
import { getBorderOpacity, hexToRgba } from '../dashboard/utils';

interface TransactionListProps {
  transactions: Transaction[];
  transactionsByDate: { [key: string]: Transaction[] };
  account: Account | null;
  trips: Trip[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  colors: ExpenseTrackingColors;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  transactionsByDate,
  account,
  trips,
  onEdit,
  onDelete,
  colors,
}) => {
  if (transactions.length === 0) {
    return <Alert severity="info">No transactions found for this account</Alert>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Date
            </TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Type
            </TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Merchant
            </TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Category
            </TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Trip
            </TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Description
            </TableCell>
            <TableCell align="right" sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Amount
            </TableCell>
            <TableCell align="right" sx={{ color: colors.card_subtext, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(transactionsByDate).map(([dateKey, dateTransactions]) => (
            <React.Fragment key={dateKey}>
              {/* Date Header Row */}
              <TableRow
                sx={{
                  backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  '& td': {
                    borderBottom: `2px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                    py: 1.5,
                  },
                }}
              >
                <TableCell
                  colSpan={7}
                  sx={{
                    color: colors.card_text,
                    fontWeight: 700,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <Typography
                    component="span"
                    sx={{
                      ml: 2,
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      color: colors.card_subtext,
                    }}
                  >
                    ({dateTransactions.length} {dateTransactions.length === 1 ? 'transaction' : 'transactions'})
                  </Typography>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: colors.card_text,
                    fontWeight: 700,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontSize: '0.95rem',
                    minWidth: '140px',
                    pr: 3,
                  }}
                >
                  {(() => {
                    const dayTotal = dateTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                    return (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          color: dayTotal >= 0 ? colors.cash : '#EF4444',
                          whiteSpace: 'nowrap',
                          textAlign: 'right',
                          display: 'block',
                        }}
                      >
                        {dayTotal >= 0 ? '+' : ''}{currencyFormat(dayTotal, account?.currency_code || 'EUR')}
                      </Typography>
                    );
                  })()}
                </TableCell>
              </TableRow>
              {/* Transactions for this date */}
              {dateTransactions.map((tx) => (
                <TableRow
                  key={tx.transaction_id}
                  sx={{
                    '&:hover': {
                      backgroundColor: hexToRgba(colors.card_accent, 0.05),
                    },
                  }}
                >
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    {(() => {
                      const txDate = new Date(tx.transaction_date);
                      // Only show time if it's not midnight (00:00:00)
                      const hasTime = txDate.getHours() !== 0 || txDate.getMinutes() !== 0 || txDate.getSeconds() !== 0;
                      return hasTime 
                        ? txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '-';
                    })()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tx.transaction_type}
                      size="small"
                      sx={{
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        backgroundColor:
                          tx.transaction_type === 'income'
                            ? hexToRgba(colors.cash, 0.2)
                            : tx.transaction_type === 'expense'
                            ? hexToRgba('#EF4444', 0.2)
                            : hexToRgba(colors.card_accent, 0.2),
                        color: colors.card_text,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    {tx.merchant || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    {tx.category || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    {tx.trip_id !== null && tx.trip_id !== undefined && tx.trip_id !== 0
                      ? (() => {
                          const trip = trips.find(t => Number(t.trip_id) === Number(tx.trip_id));
                          return trip ? trip.trip_name : `Trip #${tx.trip_id}`;
                        })()
                      : '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    {tx.description || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        color: tx.amount >= 0 ? colors.cash : '#EF4444',
                      }}
                    >
                      {currencyFormat(Math.abs(tx.amount), account?.currency_code || 'EUR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(tx)}
                      sx={{
                        color: colors.card_accent,
                        '&:hover': {
                          backgroundColor: hexToRgba(colors.card_accent, 0.1),
                        },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(tx)}
                      sx={{
                        color: '#EF4444',
                        ml: 1,
                        '&:hover': {
                          backgroundColor: hexToRgba('#EF4444', 0.1),
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

