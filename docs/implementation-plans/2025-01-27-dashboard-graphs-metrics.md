# Dashboard Graphs and Metrics Enhancement

## Summary

Add advanced graphs and metrics from the source project (`Finance Dashboard React`) to the current Dashboard page, including:
- Financial Overview Chart (time series showing Net Worth, Cash, Investments over time)
- Enhanced Metrics Cards (with MoM growth, emergency fund months)
- Cash/Investment Donut Chart (allocation visualization)
- Portfolio composition donut charts (optional)

All components should maintain the same styling and theme-aware colors as the source project.

## User Stories

### Scenario: View Financial Overview Chart
```gherkin
Given the user is on the Dashboard page
When the page loads
Then they see a Financial Overview chart showing Net Worth, Cash, and Investments over time
And the chart has toggleable traces for each metric
And the chart uses theme-aware colors
And the chart is responsive to screen size
```

### Scenario: View Enhanced Metrics Cards
```gherkin
Given the user is on the Dashboard page
When the page loads
Then they see enhanced metric cards showing:
  - Net Worth with MoM growth percentage
  - Emergency Fund (months of expenses)
  - Cash amount
  - Investments amount
And the Emergency Fund card is clickable and navigates to Expenses page
And all cards use theme-aware styling
```

### Scenario: View Cash/Investment Allocation
```gherkin
Given the user is on the Dashboard page
When the page loads
Then they see a donut chart showing Cash vs Investment allocation
And the chart displays Net Worth in the center
And the chart uses theme-aware colors
And the chart is responsive
```

### Scenario: Toggle Chart Traces
```gherkin
Given the Financial Overview chart is displayed
When the user clicks on a trace name in the legend
Then that trace is hidden/shown
And the y-axis range adjusts to visible traces only
```

## Functional Requirements

1. **Financial Overview Chart**
   - Display time series chart with Net Worth, Cash, and Investments
   - Support toggleable traces (click legend to show/hide)
   - Auto-adjust y-axis based on visible traces
   - Use theme-aware colors
   - Responsive height (260px mobile, 380px desktop)
   - Fill area under lines with semi-transparent colors

2. **Enhanced Metrics Cards**
   - Net Worth card with MoM growth indicator
   - Emergency Fund card showing months of expenses (clickable → Expenses page)
   - Cash card with amount
   - Investments card with amount
   - All cards use gradient backgrounds and theme colors
   - Icons in colored boxes

3. **Cash/Investment Donut Chart**
   - Donut chart showing Cash vs Investment split
   - Net Worth displayed in center
   - Theme-aware colors
   - Responsive sizing
   - Legend showing percentages

4. **Data Preparation**
   - Calculate MoM (Month-over-Month) growth from balance history
   - Calculate monthly expense average from transactions
   - Calculate emergency fund months (cash / monthly expense)
   - Prepare chart data from balance history aggregated by date

## Non-Goals

- Portfolio composition donut charts (Cash by account type, Investment by account type, Currency breakdown) - can be added later
- Account cards on Dashboard (already moved to Accounts page)
- Real-time data updates (data loads on page load)
- Chart export functionality

## Success Metrics

- Dashboard displays Financial Overview chart with 3 traces
- Metrics cards show MoM growth and emergency fund months
- Donut chart displays cash/investment allocation
- All components use theme-aware styling
- Charts are responsive on mobile/tablet/desktop
- No performance degradation (charts load within 2 seconds)

## Affected Files

### New Files to Create
- `frontend/src/components/dashboard/FinancialOverviewChart.tsx` - Financial overview time series chart
- `frontend/src/components/dashboard/MetricsCards.tsx` - Enhanced metrics cards component
- `frontend/src/components/dashboard/CashInvestmentDonutChart.tsx` - Cash/investment donut chart
- `frontend/src/components/dashboard/types.ts` - Type definitions for chart data
- `frontend/src/components/dashboard/utils.ts` - Utility functions (hexToRgba, getBorderOpacity)

### Files to Modify
- `frontend/src/pages/Dashboard.tsx` - Add chart components and data preparation logic
- `frontend/src/services/api.ts` - Add any missing API functions for balance history

## 🔍 Implementation Assumptions

### Backend Assumptions (MUST AUDIT)
- API Endpoint: `GET /api/balances/history/{accountName}?currency={currency}` (CERTAIN - exists in `balances.py`)
- API Endpoint: `GET /api/balances?currency={currency}&date={date}` (CERTAIN - exists)
- API Endpoint: `GET /api/metrics?currency={currency}&date={date}` (CERTAIN - exists)
- API Endpoint: `GET /api/transactions?transaction_type=expense` (CERTAIN - exists)
- Service Method: Balance history aggregation by date (UNCERTAIN - may need to aggregate in frontend)

### Frontend Assumptions (MUST AUDIT)
- Component: `Plot` from `react-plotly.js` (CERTAIN - already used in AccountDetailsPage)
- Context: `useDashboard()` provides `selectedCurrency` and `selectedDate` (CERTAIN - exists)
- Context: `useTheme()` provides `colorPalette` (CERTAIN - exists)
- Utility: `currencyFormat()` function exists (CERTAIN - exists in `utils/formatting.ts`)
- Utility: `getDashboardPalette()` function exists (CERTAIN - exists in `config/colorPalettes.ts`)
- Hook: Balance history data structure (UNCERTAIN - need to verify format from API)

### Data Structure Assumptions (MUST AUDIT)
- Balance History: Array of `{ balance_date: string, amount: number, account_name: string, account_type: string }` (LIKELY - based on `BalanceHistory` interface)
- Chart Data: `{ dates: string[], netWorthData: number[], cashData: number[], investmentData: number[] }` (ASSUMED - need to create this structure)
- Monthly Expense: Calculated from expense transactions (UNCERTAIN - may need aggregation logic)
- MoM Growth: Calculated from balance history comparing current vs previous month (UNCERTAIN - need to implement calculation)

## Git Strategy

- **Branch**: `feature/dashboard-graphs-metrics`
- **Commits**:
  1. `feat: add dashboard chart components and types`
  2. `feat: add financial overview chart component`
  3. `feat: add enhanced metrics cards component`
  4. `feat: add cash/investment donut chart component`
  5. `feat: integrate charts into dashboard page`
  6. `fix: dashboard charts styling and responsiveness`

## QA Strategy

### LLM Self-Test
1. Verify Financial Overview chart displays with 3 traces
2. Check chart traces can be toggled on/off
3. Verify Metrics Cards show correct values (MoM growth, emergency fund)
4. Check Emergency Fund card navigates to Expenses page
5. Verify Donut chart displays cash/investment split correctly
6. Test theme switching - all charts update colors
7. Test responsive design - charts adapt to screen size
8. Verify data calculations (MoM growth, monthly expense, emergency months)

### Manual User Verification
1. Navigate to Dashboard
2. Verify all charts load without errors
3. Test chart interactions (hover, toggle traces)
4. Test theme switching
5. Test on mobile/tablet/desktop
6. Verify calculations are correct
7. Test Emergency Fund card click navigation

## Implementation Steps

1. **Create Dashboard Components Directory**
   - Create `frontend/src/components/dashboard/` directory
   - Create `types.ts` with chart data interfaces
   - Create `utils.ts` with helper functions

2. **Create FinancialOverviewChart Component**
   - Copy from source project
   - Adapt to use current API structure
   - Ensure theme-aware styling

3. **Create MetricsCards Component**
   - Copy from source project
   - Adapt to use current metrics API
   - Add MoM growth calculation
   - Add emergency fund calculation

4. **Create CashInvestmentDonutChart Component**
   - Copy from source project
   - Adapt to use current metrics API
   - Ensure responsive sizing

5. **Update Dashboard Page**
   - Add data fetching for balance history
   - Add data preparation logic (chart data, MoM growth, monthly expense)
   - Integrate new chart components
   - Update layout to accommodate charts

6. **Testing and Refinement**
   - Test all charts load correctly
   - Verify calculations
   - Test responsive design
   - Fix any styling issues



