import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  List,
} from '@mui/material';
import { Add, ChevronRight } from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { IncomeSource } from './types';
import { BudgetItemRow } from './BudgetItemRow';
import { getOpacity, getBorderOpacity, hexToRgba } from './utils';

interface IncomeCardProps {
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  income: number;
  incomeSources: IncomeSource[];
  budgetCurrency: string;
  isExpanded: boolean;
  editingIncome: { id: string; field: 'name' | 'amount' | 'icon' } | null;
  editingIncomeValue: string;
  onToggle: () => void;
  onAdd: () => void;
  onItemClick: (id: string, field: 'name' | 'amount' | 'icon', value: string | number) => void;
  onItemBlur: () => void;
  onItemKeyPress: (e: React.KeyboardEvent) => void;
  onDelete: (id: string) => void;
  onEditChange: (value: string) => void;
}

export const IncomeCard: React.FC<IncomeCardProps> = ({
  colors,
  income,
  incomeSources,
  budgetCurrency,
  isExpanded,
  editingIncome,
  editingIncomeValue,
  onToggle,
  onAdd,
  onItemClick,
  onItemBlur,
  onItemKeyPress,
  onDelete,
  onEditChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${colors.card_accent}${getOpacity(0.05)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 140,
        '&:hover': {
          borderColor: colors.card_accent + '40',
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${colors.card_accent}${getOpacity(0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      {/* Header - Clickable to expand/collapse */}
      <Box 
        sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          position: 'relative', 
          zIndex: 1,
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Chip
              label="Monthly Income"
              size="small"
              variant="outlined"
              sx={{
                color: colors.card_subtext,
                borderColor: colors.card_subtext + '30',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 22,
                fontFamily: 'Inter, -apple-system, sans-serif',
                mb: 1,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: colors.card_text,
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              {currencyFormat(income, budgetCurrency)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                minHeight: '1.2rem',
              }}
            >
              {' '}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isExpanded && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                sx={{
                  backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  color: colors.card_accent,
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.2),
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton
              sx={{
                color: colors.card_subtext,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Income Sources List - Collapsible */}
      <Box 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        {isExpanded && incomeSources.length > 0 && (
          <List sx={{ pt: 0, pb: 0 }}>
            {incomeSources.map((source, index) => {
              const isEditing = editingIncome?.id === source.id;
              const isEditingName = isEditing && editingIncome?.field === 'name';
              const isEditingAmount = isEditing && editingIncome?.field === 'amount';

              return (
                <BudgetItemRow
                  key={source.id}
                  item={source}
                  index={index}
                  isEditing={isEditing}
                  isEditingName={isEditingName}
                  isEditingAmount={isEditingAmount}
                  editValue={editingIncomeValue}
                  colors={colors}
                  accentColor={colors.card_accent}
                  budgetCurrency={budgetCurrency}
                  onNameClick={() => onItemClick(source.id, 'name', source.name)}
                  onAmountClick={() => onItemClick(source.id, 'amount', source.amount)}
                  onIconClick={() => onItemClick(source.id, 'icon', '')}
                  onDelete={() => onDelete(source.id)}
                  onEditChange={onEditChange}
                  onEditBlur={onItemBlur}
                  onEditKeyPress={onItemKeyPress}
                  canDelete={incomeSources.length > 1}
                  isIncome={true}
                />
              );
            })}
          </List>
        )}
        {isExpanded && incomeSources.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontStyle: 'italic',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              No income sources yet. Tap the + button to add one.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};



