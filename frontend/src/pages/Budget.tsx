import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme as useMUITheme,
} from '@mui/material';
import { getDashboardPalette, PALETTE_BACKGROUNDS, PALETTE_TEXT_COLORS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { api, Budget as ApiBudget } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { BudgetHeader } from '../components/budget/BudgetHeader';
import { SummaryCard } from '../components/budget/SummaryCard';
import { ExpenseBreakdownChart } from '../components/budget/ExpenseBreakdownChart';
import { BudgetMobileList } from '../components/budget/BudgetMobileList';
import { IncomeCard } from '../components/budget/IncomeCard';
import { ExpenseCategoryCard } from '../components/budget/ExpenseCategoryCard';
import { IconPickerDialog } from '../components/budget/IconPickerDialog';
import { BudgetDialogs } from '../components/budget/BudgetDialogs';
import { getBorderOpacity } from '../components/budget/utils';
import type { BudgetCategory, IncomeSource, BudgetTotals } from '../components/budget/types';

// Helper functions to convert between API format and component format
// Use a stable ID generation based on index to avoid re-rendering issues
let idCounter = 0;
const generateStableId = (prefix: string, index: number) => `${prefix}-${index}`;

const convertIncomeSourcesToComponent = (sources: { name: string; amount: number }[]): IncomeSource[] => {
  return sources.map((source, index) => ({
    id: generateStableId('income', index),
    name: source.name,
    amount: source.amount,
    icon: undefined,
  }));
};

const convertIncomeSourcesToAPI = (sources: IncomeSource[]): { name: string; amount: number }[] => {
  return sources.map(source => ({
    name: source.name,
    amount: source.amount,
  }));
};

const convertCategoriesToComponent = (categories: { name: string; budgeted_amount?: number; budgeted?: number; type: string }[]): BudgetCategory[] => {
  return categories.map((cat, index) => ({
    id: generateStableId('category', index),
    name: cat.name,
    type: cat.type as 'needs' | 'wants' | 'savings',
    budgeted: cat.budgeted_amount ?? cat.budgeted ?? 0,
    icon: undefined,
    mapped_expense_categories: undefined,
  }));
};

const convertCategoriesToAPI = (categories: BudgetCategory[]): { name: string; budgeted_amount: number; type: string }[] => {
  return categories.map(cat => ({
    name: cat.name,
    budgeted_amount: cat.budgeted,
    type: cat.type,
  }));
};

const Budget: React.FC = () => {
  const { colorPalette } = useTheme();
  const { selectedCurrency } = useDashboard();
  const colors = getDashboardPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  
  const [editingIncome, setEditingIncome] = useState<{ id: string; field: 'name' | 'amount' | 'icon' } | null>(null);
  const [editingIncomeValue, setEditingIncomeValue] = useState<string>('');
  const [editingItem, setEditingItem] = useState<{ id: string; field: 'name' | 'budgeted' | 'icon' | 'mapping' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState<boolean>(false);
  const [newBudgetName, setNewBudgetName] = useState<string>('');
  const [newBudgetCurrency, setNewBudgetCurrency] = useState<string>('EUR');
  const [renameBudgetDialogOpen, setRenameBudgetDialogOpen] = useState<boolean>(false);
  const [renameBudgetName, setRenameBudgetName] = useState<string>('');
  const [renameBudgetCurrency, setRenameBudgetCurrency] = useState<string>('EUR');
  const [creatingBudget, setCreatingBudget] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    income: false,
    needs: false,
    wants: false,
    savings: false,
  });
  const [budgetCurrency, setBudgetCurrency] = useState<string>('EUR');
  const [chartView, setChartView] = useState<'all' | 'needs' | 'wants' | 'savings'>('all');
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);

  // Load budgets from API
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true);
        const loadedBudgets = await api.getBudgets();
        setBudgets(loadedBudgets);
        
        if (loadedBudgets.length > 0 && !selectedBudgetId) {
          setSelectedBudgetId(loadedBudgets[0].budget_id);
        }
      } catch (error) {
        console.error('Failed to load budgets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBudgets();
  }, []);

  // Load budget data when selection changes
  useEffect(() => {
    const loadBudget = async () => {
      if (selectedBudgetId) {
        try {
          const budget = await api.getBudget(selectedBudgetId as number);
          setIncomeSources(convertIncomeSourcesToComponent(budget.income_sources || []));
          setCategories(convertCategoriesToComponent(budget.categories || []));
          setBudgetCurrency(budget.currency || 'EUR');
        } catch (error) {
          console.error('Failed to load budget:', error);
        }
      }
    };
    
    loadBudget();
  }, [selectedBudgetId]);

  // Save budget when data changes (debounced)
  useEffect(() => {
    if (!selectedBudgetId || loading) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        setSaving(true);
        await api.updateBudget(selectedBudgetId as number, {
          income_sources: convertIncomeSourcesToAPI(incomeSources),
          categories: convertCategoriesToAPI(categories),
        });
        // Refresh budgets list to get updated timestamps
        const updatedBudgets = await api.getBudgets();
        setBudgets(updatedBudgets);
      } catch (error) {
        console.error('Failed to save budget:', error);
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [incomeSources, categories, selectedBudgetId, loading]);

  // Calculate total income from all sources
  const income = useMemo(() => {
    return incomeSources.reduce((sum, source) => sum + source.amount, 0);
  }, [incomeSources]);

  // Calculate totals
  const totals: BudgetTotals = useMemo(() => {
    const needs = categories.filter(c => c.type === 'needs').reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
    const wants = categories.filter(c => c.type === 'wants').reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
    const savings = categories.filter(c => c.type === 'savings').reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
    const total = needs + wants + savings;
    const remaining = income - total;
    
    return {
      needs,
      wants,
      savings,
      total,
      remaining,
      needsPercent: income > 0 ? (needs / income) * 100 : 0,
      wantsPercent: income > 0 ? (wants / income) * 100 : 0,
      savingsPercent: income > 0 ? (savings / income) * 100 : 0,
    };
  }, [categories, income]);

  const handleAddIncomeSource = () => {
    const newSource: IncomeSource = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
    };
    setIncomeSources([...incomeSources, newSource]);
    setEditingIncome({ id: newSource.id, field: 'name' });
    setEditingIncomeValue('');
  };

  const handleDeleteIncomeSource = (id: string) => {
    setIncomeSources(prev => prev.filter(s => s.id !== id));
    if (editingIncome?.id === id) {
      setEditingIncome(null);
      setEditingIncomeValue('');
    }
  };

  const handleIncomeClick = (id: string, field: 'name' | 'amount' | 'icon', currentValue: string | number) => {
    if (field === 'icon') {
      setIconPickerOpen(id);
    } else {
      setEditingIncome({ id, field });
      setEditingIncomeValue(String(currentValue));
    }
  };

  const handleIncomeIconSelect = (id: string, icon: string) => {
    setIncomeSources(incomeSources.map(s => 
      s.id === id ? { ...s, icon } : s
    ));
    setIconPickerOpen(null);
  };

  const handleIncomeBlur = () => {
    if (editingIncome) {
      if (editingIncome.field === 'name') {
        setIncomeSources(incomeSources.map(s => 
          s.id === editingIncome.id ? { ...s, name: editingIncomeValue || 'Unnamed' } : s
        ));
      } else if (editingIncome.field === 'amount') {
        const value = parseFloat(editingIncomeValue) || 0;
        setIncomeSources(incomeSources.map(s => 
          s.id === editingIncome.id ? { ...s, amount: value } : s
        ));
      }
      setEditingIncome(null);
      setEditingIncomeValue('');
    }
  };

  const handleIncomeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleIncomeBlur();
    }
  };

  const handleBudgetChange = (budgetId: number) => {
    setSelectedBudgetId(budgetId);
  };

  const handleCreateNewBudget = async () => {
    if (creatingBudget) return;
    
    try {
      setCreatingBudget(true);
      setError(null);
      
      const budgetName = newBudgetName.trim() || `Budget ${new Date().getFullYear()}`;
      
      const newBudget = await api.createBudget({
        name: budgetName,
        currency: newBudgetCurrency,
        income_sources: [],
        categories: [],
      });
      
      const updatedBudgets = await api.getBudgets();
      setBudgets(updatedBudgets);
      setSelectedBudgetId(newBudget.budget_id);
      setNewBudgetDialogOpen(false);
      setNewBudgetName('');
      setNewBudgetCurrency('EUR');
    } catch (error: any) {
      console.error('Failed to create budget:', error);
      setError(error?.message || 'Failed to create budget. Please try again.');
    } finally {
      setCreatingBudget(false);
    }
  };

  const handleRenameBudget = async () => {
    if (renameBudgetName.trim() && selectedBudgetId) {
      try {
        await api.updateBudget(selectedBudgetId as number, {
          name: renameBudgetName.trim(),
          currency: renameBudgetCurrency,
        });
        const updatedBudgets = await api.getBudgets();
        setBudgets(updatedBudgets);
        setRenameBudgetDialogOpen(false);
        setRenameBudgetName('');
        setRenameBudgetCurrency('EUR');
      } catch (error) {
        console.error('Failed to rename budget:', error);
      }
    }
  };

  const handleDeleteBudget = async () => {
    if (budgets.length > 1 && selectedBudgetId) {
      try {
        await api.deleteBudget(selectedBudgetId as number);
        const updatedBudgets = await api.getBudgets();
        setBudgets(updatedBudgets);
        if (updatedBudgets.length > 0) {
          setSelectedBudgetId(updatedBudgets[0].budget_id);
        }
      } catch (error) {
        console.error('Failed to delete budget:', error);
      }
    }
  };

  const handleAddCategory = (type: 'needs' | 'wants' | 'savings') => {
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: '',
      type: type,
      budgeted: 0,
    };
    setCategories([...categories, newCategory]);
    setEditingItem({ id: newCategory.id, field: 'name' });
    setEditValue('');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
      setEditValue('');
    }
  };

  const handleItemClick = (id: string, field: 'name' | 'budgeted' | 'icon' | 'mapping', currentValue: string | number) => {
    if (field === 'icon') {
      setIconPickerOpen(id);
    } else if (field === 'mapping') {
      // Category mapping not implemented yet
      return;
    } else {
      setEditingItem({ id, field });
      setEditValue(String(currentValue));
    }
  };

  const handleIconSelect = (id: string, icon: string) => {
    // Check if it's an income source or a category
    const isIncomeSource = incomeSources.some(s => s.id === id);
    if (isIncomeSource) {
      handleIncomeIconSelect(id, icon);
    } else {
      setCategories(categories.map(c => 
        c.id === id ? { ...c, icon } : c
      ));
      setIconPickerOpen(null);
    }
  };

  const handleItemBlur = () => {
    if (editingItem) {
      if (editingItem.field === 'name') {
        setCategories(categories.map(c => 
          c.id === editingItem.id ? { ...c, name: editValue || 'Unnamed' } : c
        ));
      } else if (editingItem.field === 'budgeted') {
        const value = parseFloat(editValue) || 0;
        setCategories(categories.map(c => 
          c.id === editingItem.id ? { ...c, budgeted: value } : c
        ));
      }
      setEditingItem(null);
      setEditValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleItemBlur();
    }
  };

  const toggleSection = (type: 'income' | 'needs' | 'wants' | 'savings') => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Prepare pie chart data - filtered by view
  const pieChartData = useMemo(() => {
    if (categories.length === 0) return null;

    // Filter categories based on chartView
    let filteredCategories = categories;
    if (chartView === 'needs') {
      filteredCategories = categories.filter(c => c.type === 'needs');
    } else if (chartView === 'wants') {
      filteredCategories = categories.filter(c => c.type === 'wants');
    } else if (chartView === 'savings') {
      filteredCategories = categories.filter(c => c.type === 'savings');
    }

    if (filteredCategories.length === 0) return null;

    // Group by type and create color arrays
    const needsCategories = filteredCategories.filter(c => c.type === 'needs');
    const wantsCategories = filteredCategories.filter(c => c.type === 'wants');
    const savingsCategories = filteredCategories.filter(c => c.type === 'savings');

    // Color palette: match Financial Overview chart colors in dark mode
    const isDarkMode = colorPalette === 'Dark Mode';
    const needsColors = isDarkMode ? [
      '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', // Blues (Net Worth)
      '#1E3A8A', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA'
    ] : [
      '#E53935', '#F44336', '#EF5350', '#E57373', '#EF9A9A',
      '#C62828', '#D32F2F', '#E91E63', '#EC407A', '#F48FB1'
    ];
    const wantsColors = isDarkMode ? [
      '#10B981', '#059669', '#047857', '#065F46', '#064E3B', // Greens (Cash)
      '#064E3B', '#065F46', '#047857', '#059669', '#10B981'
    ] : [
      '#00897B', '#009688', '#26A69A', '#4DB6AC', '#80CBC4',
      '#00695C', '#00796B', '#00ACC1', '#00BCD4', '#4DD0E1'
    ];
    const savingsColors = isDarkMode ? [
      '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', // Yellows/Oranges (Investment)
      '#78350F', '#92400E', '#B45309', '#D97706', '#F59E0B'
    ] : [
      '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6',
      '#1565C0', '#0D47A1', '#283593', '#3949AB', '#5C6BC0'
    ];

    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];
    const hoverText: string[] = [];

    const viewTotal = filteredCategories.reduce((sum, cat) => sum + (cat.budgeted ?? 0), 0);

    needsCategories.forEach((cat, idx) => {
      const budgeted = cat.budgeted ?? 0;
      const percentage = viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(2) : '0.00';
      labels.push(`${cat.name} (${percentage}%)`);
      values.push(budgeted);
      colors.push(needsColors[idx % needsColors.length]);
      hoverText.push(`${cat.name}<br>${currencyFormat(budgeted, budgetCurrency)}<br>${viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(1) : '0.0'}%`);
    });

    wantsCategories.forEach((cat, idx) => {
      const budgeted = cat.budgeted ?? 0;
      const percentage = viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(2) : '0.00';
      labels.push(`${cat.name} (${percentage}%)`);
      values.push(budgeted);
      colors.push(wantsColors[idx % wantsColors.length]);
      hoverText.push(`${cat.name}<br>${currencyFormat(budgeted, budgetCurrency)}<br>${viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(1) : '0.0'}%`);
    });

    savingsCategories.forEach((cat, idx) => {
      const budgeted = cat.budgeted ?? 0;
      const percentage = viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(2) : '0.00';
      labels.push(`${cat.name} (${percentage}%)`);
      values.push(budgeted);
      colors.push(savingsColors[idx % savingsColors.length]);
      hoverText.push(`${cat.name}<br>${currencyFormat(budgeted, budgetCurrency)}<br>${viewTotal > 0 ? ((budgeted / viewTotal) * 100).toFixed(1) : '0.0'}%`);
    });

    return { labels, values, colors, hoverText, total: viewTotal };
  }, [categories, chartView, budgetCurrency, colorPalette]);

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        minHeight: '100vh',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1280, px: { xs: 2, sm: 3, lg: 4 } }}>
        {/* Header */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
        <>
        <BudgetHeader
          colorPalette={colorPalette}
          colors={colors}
          budgets={budgets}
          selectedBudgetId={selectedBudgetId}
          budgetCurrency={budgetCurrency}
          onBudgetChange={handleBudgetChange}
          onRenameClick={() => {
            const currentBudget = budgets.find(b => b.budget_id === selectedBudgetId);
            setRenameBudgetName(currentBudget?.name || '');
            setRenameBudgetCurrency(currentBudget?.currency || 'EUR');
            setRenameBudgetDialogOpen(true);
          }}
          onNewBudgetClick={() => setNewBudgetDialogOpen(true)}
          onDeleteClick={handleDeleteBudget}
          getBorderOpacity={getBorderOpacity}
        />

        {/* Budget Title */}
        <Typography
          variant="h4"
          sx={{
            color: PALETTE_TEXT_COLORS[colorPalette],
            fontWeight: 700,
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2rem' },
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {budgets.find(b => b.budget_id === selectedBudgetId)?.name || 'Budget'}
        </Typography>

        {/* Top Row: Summary and Donut Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Summary - Left */}
          <Grid item xs={12} md={5}>
            <SummaryCard
              colors={colors}
              income={income}
              totals={totals}
              budgetCurrency={budgetCurrency}
            />
          </Grid>

          {/* Donut Chart - Right (Desktop) / Mobile List (Mobile) */}
          {pieChartData && pieChartData.values.length > 0 && (
            <Grid item xs={12} md={7}>
              {isMobile ? (
                <BudgetMobileList
                  colors={colors}
                  categories={categories}
                  chartView={chartView}
                  budgetCurrency={budgetCurrency}
                  colorPalette={colorPalette}
                  onChartViewChange={setChartView}
                />
              ) : (
                <ExpenseBreakdownChart
                  colors={colors}
                  pieChartData={pieChartData}
                  chartView={chartView}
                  budgetCurrency={budgetCurrency}
                  colorPalette={colorPalette}
                  onChartViewChange={setChartView}
                />
              )}
            </Grid>
          )}
        </Grid>

        {/* Dividing Line */}
        <Divider 
          sx={{ 
            my: 4,
            borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
            borderWidth: 1,
          }} 
        />

        {/* Budget Categories Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: PALETTE_TEXT_COLORS[colorPalette],
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Budget Categories
          </Typography>
          
          {/* Income Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 600,
                mb: 1.5,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Income
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <IncomeCard
                  colors={colors}
                  income={income}
                  incomeSources={incomeSources}
                  budgetCurrency={budgetCurrency}
                  isExpanded={expandedSections.income}
                  editingIncome={editingIncome}
                  editingIncomeValue={editingIncomeValue}
                  onToggle={() => toggleSection('income')}
                  onAdd={handleAddIncomeSource}
                  onItemClick={handleIncomeClick}
                  onItemBlur={handleIncomeBlur}
                  onItemKeyPress={handleIncomeKeyPress}
                  onDelete={handleDeleteIncomeSource}
                  onEditChange={setEditingIncomeValue}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Expenses Section */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 600,
                mb: 1.5,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Expenses
            </Typography>
            <Grid container spacing={3}>
              {/* Needs Card */}
              <Grid item xs={12} sm={6} md={4}>
                <ExpenseCategoryCard
                  type="needs"
                  colors={colors}
                  categories={categories}
                  totals={totals}
                  budgetCurrency={budgetCurrency}
                  colorPalette={colorPalette}
                  isExpanded={expandedSections.needs}
                  editingItem={editingItem}
                  editValue={editValue}
                  onToggle={() => toggleSection('needs')}
                  onAdd={() => handleAddCategory('needs')}
                  onItemClick={handleItemClick}
                  onItemBlur={handleItemBlur}
                  onItemKeyPress={handleKeyPress}
                  onDelete={handleDeleteCategory}
                  onEditChange={setEditValue}
                />
              </Grid>

              {/* Wants Card */}
              <Grid item xs={12} sm={6} md={4}>
                <ExpenseCategoryCard
                  type="wants"
                  colors={colors}
                  categories={categories}
                  totals={totals}
                  budgetCurrency={budgetCurrency}
                  colorPalette={colorPalette}
                  isExpanded={expandedSections.wants}
                  editingItem={editingItem}
                  editValue={editValue}
                  onToggle={() => toggleSection('wants')}
                  onAdd={() => handleAddCategory('wants')}
                  onItemClick={handleItemClick}
                  onItemBlur={handleItemBlur}
                  onItemKeyPress={handleKeyPress}
                  onDelete={handleDeleteCategory}
                  onEditChange={setEditValue}
                />
              </Grid>

              {/* Savings Card */}
              <Grid item xs={12} sm={6} md={4}>
                <ExpenseCategoryCard
                  type="savings"
                  colors={colors}
                  categories={categories}
                  totals={totals}
                  budgetCurrency={budgetCurrency}
                  colorPalette={colorPalette}
                  isExpanded={expandedSections.savings}
                  editingItem={editingItem}
                  editValue={editValue}
                  onToggle={() => toggleSection('savings')}
                  onAdd={() => handleAddCategory('savings')}
                  onItemClick={handleItemClick}
                  onItemBlur={handleItemBlur}
                  onItemKeyPress={handleKeyPress}
                  onDelete={handleDeleteCategory}
                  onEditChange={setEditValue}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
        </>
        )}
      </Container>

      {/* Icon Picker Dialog */}
      <IconPickerDialog
        open={iconPickerOpen !== null}
        onClose={() => setIconPickerOpen(null)}
        onSelect={(icon) => iconPickerOpen && handleIconSelect(iconPickerOpen, icon)}
        colors={colors}
      />

      {/* Budget Dialogs */}
      <BudgetDialogs
        newBudgetDialogOpen={newBudgetDialogOpen}
        renameBudgetDialogOpen={renameBudgetDialogOpen}
        newBudgetName={newBudgetName}
        renameBudgetName={renameBudgetName}
        creatingBudget={creatingBudget}
        error={error}
        newBudgetCurrency={newBudgetCurrency}
        renameBudgetCurrency={renameBudgetCurrency}
        onNewBudgetClose={() => {
          setNewBudgetDialogOpen(false);
          setNewBudgetName('');
          setNewBudgetCurrency('EUR');
          setError(null);
        }}
        onRenameBudgetClose={() => {
          setRenameBudgetDialogOpen(false);
          setRenameBudgetName('');
          setRenameBudgetCurrency('EUR');
        }}
        onNewBudgetNameChange={setNewBudgetName}
        onRenameBudgetNameChange={setRenameBudgetName}
        onNewBudgetCurrencyChange={setNewBudgetCurrency}
        onRenameBudgetCurrencyChange={setRenameBudgetCurrency}
        onCreateBudget={handleCreateNewBudget}
        onRenameBudget={handleRenameBudget}
        onErrorClear={() => setError(null)}
      />
    </Box>
  );
};

export default Budget;
