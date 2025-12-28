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
import { BudgetCategory } from './types';
import { BudgetItemRow } from './BudgetItemRow';
import { getOpacity, getBorderOpacity, hexToRgba, getTypeConfig } from './utils';
import { BudgetTotals } from './types';

interface ExpenseCategoryCardProps {
  type: 'needs' | 'wants' | 'savings';
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  categories: BudgetCategory[];
  totals: BudgetTotals;
  budgetCurrency: string;
  colorPalette: string;
  isExpanded: boolean;
  editingItem: { id: string; field: 'name' | 'budgeted' | 'icon' | 'mapping' } | null;
  editValue: string;
  onToggle: () => void;
  onAdd: () => void;
  onItemClick: (id: string, field: 'name' | 'budgeted' | 'icon' | 'mapping', value: string | number) => void;
  onItemBlur: () => void;
  onItemKeyPress: (e: React.KeyboardEvent) => void;
  onDelete: (id: string) => void;
  onEditChange: (value: string) => void;
}

export const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({
  type,
  colors,
  categories,
  totals,
  budgetCurrency,
  colorPalette,
  isExpanded,
  editingItem,
  editValue,
  onToggle,
  onAdd,
  onItemClick,
  onItemBlur,
  onItemKeyPress,
  onDelete,
  onEditChange,
}) => {
  const config = getTypeConfig(type, totals, colorPalette);
  const sectionItems = categories.filter(c => c.type === type);

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${config.accentColor}${getOpacity(0.05)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        minHeight: 140,
        '&:hover': {
          borderColor: config.accentColor + '40',
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
          background: `radial-gradient(circle, ${config.accentColor}${getOpacity(0.1)} 0%, transparent 70%)`,
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
              label={config.label}
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
              {currencyFormat(config.total, budgetCurrency)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              {config.percent.toFixed(1)}% of income
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
                  backgroundColor: hexToRgba(config.accentColor, 0.1),
                  color: config.accentColor,
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: hexToRgba(config.accentColor, 0.2),
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

      {/* Items List - Collapsible */}
      <Box 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        {isExpanded && sectionItems.length > 0 && (
          <List sx={{ pt: 0, pb: 0 }}>
            {sectionItems.map((item, index) => {
              const isEditing = editingItem?.id === item.id;
              const isEditingName = isEditing && editingItem?.field === 'name';
              const isEditingBudgeted = isEditing && editingItem?.field === 'budgeted';

              return (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  isEditing={isEditing}
                  isEditingName={isEditingName}
                  isEditingAmount={isEditingBudgeted}
                  editValue={editValue}
                  colors={colors}
                  accentColor={config.accentColor}
                  budgetCurrency={budgetCurrency}
                  onNameClick={() => onItemClick(item.id, 'name', item.name)}
                  onAmountClick={() => onItemClick(item.id, 'budgeted', item.budgeted)}
                  onIconClick={() => onItemClick(item.id, 'icon', '')}
                  onDelete={() => onDelete(item.id)}
                  onEditChange={onEditChange}
                  onEditBlur={onItemBlur}
                  onEditKeyPress={onItemKeyPress}
                  canDelete={true}
                  isIncome={false}
                />
              );
            })}
          </List>
        )}
        {isExpanded && sectionItems.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontStyle: 'italic',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              No items yet. Tap the + button to add one.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};



