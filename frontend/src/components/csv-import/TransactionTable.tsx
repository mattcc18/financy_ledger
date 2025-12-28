import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Warning, Delete, Save, Cancel } from '@mui/icons-material';
import { Account, Trip, Category } from '../../services/api';
import { getDashboardPalette } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgba, getBorderOpacity } from '../dashboard/utils';

export interface ParsedTransaction {
  transaction_type: string;
  account_id: number | null;
  account_confidence: number;
  amount: number;
  currency: string;
  transaction_date: string;
  transaction_time?: string | null;
  description: string;
  merchant: string | null;
  category: string | null;
  trip_id: number | null;
  trip_name: string | null;
  transfer_to_account_id?: number | null;
  confidence: number;
  row_number?: number;
  raw_data: any;
}

interface TransactionTableProps {
  transactions: ParsedTransaction[];
  accounts: Account[];
  trips: Trip[];
  categories: Category[];
  isUncertain?: boolean;
  onUpdateTransaction: (rowNumber: number | undefined, field: string, value: any) => void;
  onDelete: (tx: ParsedTransaction) => void;
  onImport?: () => void;
  importing?: boolean;
  onAddCategory?: (name: string, type: 'expense' | 'income') => Promise<void>;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  accounts,
  trips,
  categories,
  isUncertain = false,
  onUpdateTransaction,
  onDelete,
  onImport,
  importing = false,
  onAddCategory,
}) => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<boolean>(false);

  const getTransactionTypeColor = (transactionType: string): string => {
    switch (transactionType.toLowerCase()) {
      case 'expense':
        return '#F44336'; // Red
      case 'transfer':
        return '#2196F3'; // Blue
      case 'income':
        return '#4CAF50'; // Green
      default:
        return colors.card_text;
    }
  };

  const getCategoriesForType = (transactionType: string): Category[] => {
    if (transactionType === 'expense') {
      return categories.filter(c => c.category_type === 'expense');
    } else if (transactionType === 'income') {
      return categories.filter(c => c.category_type === 'income');
    }
    return categories;
  };

  const handleAddNewCategory = async (transactionType: 'expense' | 'income') => {
    if (!newCategoryName.trim() || !onAddCategory) return;
    
    try {
      await onAddCategory(newCategoryName.trim(), transactionType);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transaction_date).getTime();
    const dateB = new Date(b.transaction_date).getTime();
    return dateB - dateA; // Sort descending (newest first)
  });

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${hexToRgba(colors.card_bg, 0.6)} 0%, ${hexToRgba(colors.card_subtext, 0.02)} 100%)`,
        borderRadius: 4,
        p: 3,
        mb: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {isUncertain ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Warning sx={{ color: '#F57C00' }} />
            <Typography
              variant="h6"
              sx={{
                color: colors.card_text,
                fontWeight: 600,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Review Required ({transactions.length})
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 600,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Confident Transactions ({transactions.length})
          </Typography>
        )}
        {onImport && (
          <Button
            variant="contained"
            onClick={onImport}
            disabled={importing}
            startIcon={importing ? <CircularProgress size={16} /> : <CheckCircle />}
            sx={{
              backgroundColor: colors.card_accent,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.8),
              },
            }}
          >
            {importing ? 'Importing...' : `Import ${transactions.length} Transactions`}
          </Button>
        )}
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Merchant</TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Amount</TableCell>
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Account</TableCell>
            {isUncertain && (
              <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Confidence</TableCell>
            )}
            <TableCell sx={{ color: colors.card_subtext, fontWeight: 600 }}>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTransactions.map((tx, idx) => {
            const typeColor = getTransactionTypeColor(tx.transaction_type);
            
            return (
              <TableRow 
                key={idx} 
                sx={{ 
                  backgroundColor: hexToRgba(typeColor, 0.05),
                  borderLeft: `3px solid ${typeColor}`,
                }}
              >
                <TableCell sx={{ color: colors.card_text }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      type="date"
                      value={tx.transaction_date}
                      onChange={(e) => onUpdateTransaction(tx.row_number, 'transaction_date', e.target.value)}
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                        },
                      }}
                    />
                    <TextField
                      type="time"
                      value={tx.transaction_time || ''}
                      onChange={(e) => onUpdateTransaction(tx.row_number, 'transaction_time', e.target.value || null)}
                      size="small"
                      label="Time"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        width: 120,
                        '& .MuiOutlinedInput-root': {
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={tx.transaction_type}
                      onChange={(e) => {
                        onUpdateTransaction(tx.row_number, 'transaction_type', e.target.value);
                        if (e.target.value !== 'transfer') {
                          onUpdateTransaction(tx.row_number, 'transfer_to_account_id', null);
                        }
                      }}
                      sx={{
                        color: typeColor,
                        backgroundColor: colors.card_bg,
                        fontWeight: 600,
                      }}
                    >
                      <MenuItem value="income">Income</MenuItem>
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ color: colors.card_text }}>
                  <TextField
                    value={tx.merchant || tx.description || ''}
                    onChange={(e) => {
                      onUpdateTransaction(tx.row_number, 'merchant', e.target.value);
                      onUpdateTransaction(tx.row_number, 'description', e.target.value);
                    }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: colors.card_text }}>
                  <Box>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={tx.category || ''}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setShowNewCategoryInput(true);
                          } else {
                            onUpdateTransaction(tx.row_number, 'category', e.target.value || null);
                          }
                        }}
                        displayEmpty
                        sx={{
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                        }}
                      >
                        <MenuItem value="">
                          <em>No Category</em>
                        </MenuItem>
                        {getCategoriesForType(tx.transaction_type).map((cat) => (
                          <MenuItem key={cat.category_id} value={cat.category_name}>
                            {cat.category_name}
                          </MenuItem>
                        ))}
                        {onAddCategory && (
                          <MenuItem value="__add_new__">
                            + Add New Category
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                    {showNewCategoryInput && onAddCategory && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          placeholder="New category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          size="small"
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: colors.card_text,
                              backgroundColor: colors.card_bg,
                            },
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNewCategory(tx.transaction_type as 'expense' | 'income');
                            }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleAddNewCategory(tx.transaction_type as 'expense' | 'income')}
                          sx={{ color: colors.card_accent }}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategoryName('');
                          }}
                          sx={{ color: colors.card_subtext }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: colors.card_text, fontWeight: 600 }}>
                  <TextField
                    type="number"
                    value={tx.amount}
                    onChange={(e) => onUpdateTransaction(tx.row_number, 'amount', parseFloat(e.target.value) || 0)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: colors.card_text }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={tx.account_id || ''}
                      onChange={(e) => onUpdateTransaction(tx.row_number, 'account_id', e.target.value as number)}
                      sx={{
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                      }}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          {account.account_name} ({account.institution})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {tx.transaction_type === 'transfer' && (
                    <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                      <InputLabel sx={{ color: colors.card_subtext }}>Transfer To</InputLabel>
                      <Select
                        value={tx.transfer_to_account_id || ''}
                        onChange={(e) => onUpdateTransaction(tx.row_number, 'transfer_to_account_id', e.target.value || null)}
                        label="Transfer To"
                        sx={{
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                        }}
                      >
                        <MenuItem value="">No Account</MenuItem>
                        {accounts
                          .filter(acc => acc.account_id !== tx.account_id)
                          .map((account) => (
                            <MenuItem key={account.account_id} value={account.account_id}>
                              {account.account_name} ({account.institution})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}
                  {tx.transaction_type === 'expense' && (
                    <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                      <InputLabel sx={{ color: colors.card_subtext }}>Trip</InputLabel>
                      <Select
                        value={tx.trip_id || ''}
                        onChange={(e) => onUpdateTransaction(tx.row_number, 'trip_id', e.target.value ? Number(e.target.value) : null)}
                        label="Trip"
                        sx={{
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                        }}
                      >
                        <MenuItem value="">No Trip</MenuItem>
                        {trips.map((trip) => (
                          <MenuItem key={trip.trip_id} value={trip.trip_id}>
                            {trip.trip_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </TableCell>
                {isUncertain && (
                  <TableCell sx={{ color: colors.card_text }}>
                    <Chip
                      label={`${Math.round(tx.confidence * 100)}%`}
                      size="small"
                      sx={{
                        backgroundColor: hexToRgba('#F57C00', 0.2),
                        color: colors.card_text,
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(tx)}
                    sx={{ color: '#F44336' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default TransactionTable;

