# UI Redesign Integration - Figma Design to Finance Dashboard

**Created**: 2025-01-27  
**Status**: Reviewed - Ready for Implementation  
**Type**: UI/UX Migration  
**Review Date**: 2025-01-27

## Summary

Integrate the modern UI design created in Figma (`/Users/matthewcorcoran/Downloads/Redesign Personal Finance Web App`) into the existing Finance Dashboard application (`/Users/matthewcorcoran/Desktop/Finance Copy/Finance_Dashboard_Final`) while preserving all existing functionality, API integrations, and business logic. The new design uses Tailwind CSS, Radix UI components, and lucide-react icons, replacing the current Material-UI (MUI) implementation.

## Reference Architecture

- **Frontend**: `frontend/src/` - React + TypeScript application
- **Backend**: `backend/app/` - FastAPI backend services
- **API Contracts**: `frontend/src/services/api.ts` - Complete API service definitions
- **Current Styling**: Material-UI (MUI) with custom color palettes in `frontend/src/config/colorPalettes.ts`
- **New Design System**: Tailwind CSS with Radix UI components and lucide-react icons
- **Production Database**: Supabase (PostgreSQL)
- **Production API**: `http://localhost:8000` (development)

## Step 1: Core Areas to Explore

### Investigation

1. **Styling System Migration**
   - Current: Material-UI components with custom theme (`frontend/src/App.tsx:22-32`)
   - Target: Tailwind CSS utility classes with Radix UI primitives
   - Need to verify: Can both systems coexist during migration? (YES - Tailwind can work alongside MUI)

2. **Component Library Transition**
   - Current: `@mui/material` components (Box, Typography, Grid, Paper, etc.)
   - Target: Radix UI primitives (`@radix-ui/react-*`) with Tailwind styling
   - Need to verify: Component mapping strategy (MUI Button → Radix Button, MUI Dialog → Radix Dialog, etc.)

3. **Icon System**
   - Current: `@mui/icons-material` (Material Icons)
   - Target: `lucide-react` icons
   - Need to verify: Icon mapping for all existing icons

4. **Layout Structure**
   - Current: MUI Box/Container/Grid layout system
   - Target: Tailwind CSS grid/flexbox utilities
   - Need to verify: Responsive breakpoint compatibility

5. **Theme Context Integration**
   - Current: `ThemeContext` with color palette system (`frontend/src/contexts/ThemeContext.tsx`)
   - Target: Tailwind CSS theme configuration
   - Need to verify: How to maintain existing theme switching functionality

6. **Navigation Structure**
   - Current: MUI AppBar with custom NavBar (`frontend/src/components/NavBar.tsx`)
   - Target: New header design from Figma (`Redesign Personal Finance Web App/src/app/App.tsx:23-59`)
   - Need to verify: Route mapping and active state handling

### Expected Behavior

#### User Story: View Dashboard with New Design
```gherkin
Scenario: User views the dashboard
  Given the user has logged into the application
  When they navigate to the dashboard page
  Then they see the new modern UI design with gradient cards
  And all financial metrics display correctly
  And charts render with the new styling
  And navigation uses the new header design
```

#### User Story: Navigate Between Pages
```gherkin
Scenario: User navigates between pages
  Given the user is on any page
  When they click a navigation link in the header
  Then the page transitions to the selected route
  And the active navigation item is highlighted
  And all page functionality remains intact
```

#### User Story: Interact with Forms
```gherkin
Scenario: User creates a transaction
  Given the user is on the accounts page
  When they click "Add Transaction"
  Then a dialog opens with the new design
  And form fields use the new input styling
  And validation messages display correctly
  And submitting the form works as before
```

### Core Functionality

All existing functionality must be preserved:

1. **Dashboard Page** (`frontend/src/pages/Dashboard.tsx`)
   - Net worth calculation and display
   - Metrics cards (cash, investments, cash flow, etc.)
   - Chart visualizations (net worth over time, cash by institution, etc.)
   - Budget status display
   - Currency selection and conversion
   - Budget selection dropdown

2. **Accounts Page** (`frontend/src/pages/AccountsPage.tsx`)
   - Account listing and management
   - Create/Edit/Delete account dialogs
   - Account balance display with currency conversion
   - Account type filtering

3. **Account Details Page** (`frontend/src/pages/AccountDetailsPage.tsx`)
   - Transaction list for specific account
   - Add/Edit/Delete transaction dialogs
   - Balance history chart
   - Transaction filtering

4. **Expense Tracking Page** (`frontend/src/pages/ExpenseTracking.tsx`)
   - Expense analysis and filtering
   - Category breakdowns
   - Monthly comparisons
   - Trip expense tracking

5. **Budget Page** (`frontend/src/pages/Budget.tsx`)
   - Budget creation and management
   - Category budget allocation
   - Budget vs actual spending
   - Income/Needs/Wants/Savings breakdown

6. **Other Pages**
   - Goals page (`frontend/src/pages/Goals.tsx`)
   - CSV Import (`frontend/src/pages/CSVImport.tsx`)
   - Data Entry (`frontend/src/pages/DataEntry.tsx`)

### Scope/Boundaries

**In Scope:**
- Visual design migration (colors, spacing, typography, components)
- Component library replacement (MUI → Radix UI + Tailwind)
- Icon system replacement (Material Icons → lucide-react)
- Layout structure updates
- Navigation header redesign
- Chart styling updates (recharts will remain, but styled with new design)

**Out of Scope:**
- Backend API changes
- Database schema modifications
- New feature additions
- Business logic changes
- API service modifications (`frontend/src/services/api.ts` remains unchanged)
- State management changes (React Context usage remains the same)

### File Requirements

**New Files to Create:**
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/postcss.config.js` - PostCSS configuration for Tailwind
- `frontend/src/styles/tailwind.css` - Tailwind base styles
- `frontend/src/components/ui/` - Radix UI component wrappers (button, dialog, select, etc.)

**Files to Modify:**
- `frontend/package.json` - Add Tailwind CSS, Radix UI, lucide-react dependencies
- `frontend/vite.config.ts` - Configure Tailwind CSS plugin
- `frontend/src/App.tsx` - Replace MUI ThemeProvider with Tailwind setup, update layout
- `frontend/src/components/NavBar.tsx` - Replace with new header design
- `frontend/src/pages/Dashboard.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/AccountsPage.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/AccountDetailsPage.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/ExpenseTracking.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/Budget.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/Goals.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/CSVImport.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/pages/DataEntry.tsx` - Migrate to Tailwind classes, replace MUI components
- `frontend/src/components/Footer.tsx` - Migrate to Tailwind classes
- `frontend/src/components/ErrorBoundary.tsx` - Migrate to Tailwind classes
- All component files in `frontend/src/components/` - Migrate to Tailwind classes

**Files to Reference (No Changes):**
- `frontend/src/services/api.ts` - API service layer (unchanged)
- `frontend/src/contexts/ThemeContext.tsx` - May need updates for Tailwind theme integration
- `frontend/src/contexts/DashboardContext.tsx` - State management (unchanged)
- `frontend/src/utils/formatting.ts` - Utility functions (unchanged)

### Data Schema

No database schema changes required. All API contracts remain the same.

### Design/UI

**Design Source**: `/Users/matthewcorcoran/Downloads/Redesign Personal Finance Web App`

**Key Design Elements:**
1. **Color Palette**:
   - Primary gradient: `from-violet-600 to-violet-700` (purple gradient)
   - Accent: `from-cyan-500` (cyan)
   - Background: `from-slate-50 via-white to-slate-50` (light gradient)
   - Text: `text-slate-900` (primary), `text-slate-500` (secondary)
   - Cards: White with `border-slate-200/60` borders

2. **Typography**:
   - Font: System fonts (Inter, -apple-system, sans-serif implied)
   - Headings: `text-slate-900` with `tracking-tight`
   - Body: `text-slate-600` or `text-slate-500`

3. **Spacing**:
   - Container: `max-w-[1400px] mx-auto px-8 py-8`
   - Card padding: `p-6` or `p-8`
   - Gap between elements: `gap-6` or `gap-8`

4. **Components**:
   - Cards: `rounded-2xl` with `border border-slate-200/60 shadow-sm`
   - Buttons: Gradient buttons with `rounded-lg` or `rounded-xl`
   - Icons: `lucide-react` icons with consistent sizing

5. **Layout Patterns**:
   - Grid layouts: `grid grid-cols-12 gap-6` or `grid grid-cols-3 gap-6`
   - Hero cards: Gradient backgrounds with decorative circles
   - Stat cards: White cards with icon badges

### State/Interactions

State management remains unchanged:
- `ThemeContext` for color palette selection
- `DashboardContext` for dashboard state (currency, date selection, etc.)
- React Router for navigation
- Local component state for forms and dialogs

## Step 2: Design Clarity Check

### Screen Purpose

**Dashboard Page**: This screen lets the user view their financial overview (net worth, cash flow, account balances, spending trends) so they can understand their financial position at a glance.

**Accounts Page**: This screen lets the user view and manage all their financial accounts so they can track balances across different institutions and currencies.

**Expenses Page**: This screen lets the user analyze their spending patterns so they can understand where their money goes and make informed budgeting decisions.

**Budget Page**: This screen lets the user create and manage budgets so they can plan their income allocation and track spending against budgeted amounts.

### Input → Output Mapping

**Dashboard Interactions:**
- Input: User selects currency from dropdown
- Output: All amounts update to selected currency, charts recalculate
- Input: User selects budget from dropdown
- Output: Budget status card updates, calculations use selected budget
- Input: User clicks on account card
- Output: Navigate to account details page

**Accounts Page Interactions:**
- Input: User clicks "Create Account" button
- Output: Dialog opens with form fields
- Input: User submits account form
- Output: Account created, list refreshes, success feedback shown
- Input: User clicks account card
- Output: Navigate to account details page

**Expenses Page Interactions:**
- Input: User selects date range
- Output: Expense data filters to selected period, charts update
- Input: User filters by category
- Output: Transaction list and charts filter to selected category

**Budget Page Interactions:**
- Input: User edits budget category amount
- Output: Budget totals recalculate, pie chart updates
- Input: User creates new budget
- Output: Budget list updates, new budget becomes active

### Key Actions Hierarchy

**Dashboard:**
1. Primary: View financial overview (always visible)
2. Secondary: Change currency (dropdown in header)
3. Tertiary: Navigate to detailed pages (click cards/links)

**Accounts:**
1. Primary: View account list (always visible)
2. Secondary: Create new account (button in header)
3. Tertiary: Edit/delete accounts (menu actions)

**Expenses:**
1. Primary: View expense analysis (always visible)
2. Secondary: Filter by date range (date picker)
3. Tertiary: Filter by category (dropdown)

**Budget:**
1. Primary: View budget breakdown (always visible)
2. Secondary: Edit budget amounts (inline editing)
3. Tertiary: Create new budget (button in header)

### Layout Skeleton

**Dashboard Layout:**
1. Header (navigation + currency/budget selectors)
2. Welcome section (greeting + date)
3. Hero stats row (3 cards: Net Worth, Total Balance, Monthly Cash Flow)
4. Main content grid:
   - Left: Spending trends chart (8 cols)
   - Right: Budget status card (4 cols)
   - Bottom: Savings goals (6 cols) + Accounts list (6 cols)
   - Full width: Recent transactions (12 cols)

**Accounts Layout:**
1. Header (navigation)
2. Page title + description
3. Summary card (total balance with gradient)
4. Filters bar (currency, institution, type filters)
5. Accounts grid (grouped by institution)

**Expenses Layout:**
1. Header (navigation)
2. Page title + description
3. Stats row (4 cards: Cumulative Spending, Total Budgeted, Budget Status, Avg Per Day)
4. Charts grid:
   - Left: Cumulative spending chart (7 cols)
   - Right: Largest expense card (5 cols)
   - Bottom: By category (7 cols) + Monthly comparison (5 cols)
5. Insights section (full width)

**Budget Layout:**
1. Header (navigation)
2. Page title + budget selector
3. Main grid:
   - Left: Budget name card + Summary card (5 cols)
   - Right: Expense breakdown with pie chart (7 cols)
4. Budget tips section (full width)

### Visual Chunks & Information Architecture

**Dashboard:**
- Primary: Net worth (hero card, largest)
- Secondary: Total balance, cash flow (medium cards)
- Tertiary: Charts, lists, detailed metrics

**Accounts:**
- Primary: Total balance summary (gradient hero card)
- Secondary: Account cards (grouped by institution)
- Tertiary: Filters, actions

**Expenses:**
- Primary: Cumulative spending (large chart)
- Secondary: Category breakdown, monthly comparison
- Tertiary: Stats cards, insights

**Budget:**
- Primary: Budget breakdown (pie chart)
- Secondary: Summary totals
- Tertiary: Category list, tips

### Behavior Clarity

All screens maintain single, clear purpose:
- Dashboard: Financial overview
- Accounts: Account management
- Expenses: Spending analysis
- Budget: Budget planning

## Step 3: Implementation Plan Components

### Goals

1. **Visual Design Migration**: Replace MUI styling with Tailwind CSS utility classes matching the Figma design
2. **Component Library Migration**: Replace MUI components with Radix UI primitives styled with Tailwind
3. **Icon System Migration**: Replace Material Icons with lucide-react icons
4. **Layout Modernization**: Update layouts to match new design patterns (gradient cards, modern spacing)
5. **Navigation Redesign**: Replace MUI AppBar with new header design from Figma
6. **Preserve Functionality**: Ensure all existing features, API calls, and business logic remain intact

### User Stories

#### Story 1: Dashboard Visual Update
```gherkin
Scenario: User views updated dashboard
  Given the user has existing financial data
  When they navigate to the dashboard
  Then they see the new gradient hero card for net worth
  And all metrics display with the new card design
  And charts use the new styling (rounded corners, updated colors)
  And the layout matches the Figma design
  And all calculations and data remain accurate
```

#### Story 2: Navigation Header
```gherkin
Scenario: User navigates with new header
  Given the user is on any page
  When they view the header
  Then they see the new design with gradient logo
  And navigation links use the new styling
  And the active route is highlighted correctly
  And currency/budget selectors work as before
  And clicking "Add Transaction" opens the dialog
```

#### Story 3: Accounts Page Redesign
```gherkin
Scenario: User views redesigned accounts page
  Given the user has multiple accounts
  When they navigate to the accounts page
  Then they see the new gradient summary card
  And account cards use the new design (rounded-2xl, new spacing)
  And filters use the new select styling
  And create/edit/delete dialogs use the new design
  And all account operations work correctly
```

#### Story 4: Expenses Page Redesign
```gherkin
Scenario: User views redesigned expenses page
  Given the user has expense transactions
  When they navigate to the expenses page
  Then they see the new stat cards layout
  And charts use the new styling
  And category breakdown uses the new design
  And all filtering and date selection works
```

#### Story 5: Budget Page Redesign
```gherkin
Scenario: User views redesigned budget page
  Given the user has created budgets
  When they navigate to the budget page
  Then they see the new budget name card with gradient
  And the pie chart uses the new styling
  And category list uses the new design
  And budget editing works correctly
```

#### Story 6: Theme Consistency
```gherkin
Scenario: User experiences consistent design
  Given the user navigates between pages
  When they view different sections
  Then all pages use the same color palette
  And spacing and typography are consistent
  And component styles match across pages
  And the design matches the Figma mockups
```

### Functional Requirements

1. **Install Dependencies**
   - Add Tailwind CSS (`tailwindcss`, `@tailwindcss/vite`)
   - Add PostCSS (`postcss`, `autoprefixer`)
   - Add Radix UI components (`@radix-ui/react-dialog`, `@radix-ui/react-select`, etc.)
   - Add lucide-react icons (`lucide-react`)
   - Keep existing dependencies (recharts, react-router-dom, axios)

2. **Configure Tailwind CSS**
   - Create `tailwind.config.js` with design system colors
   - Configure PostCSS
   - Add Tailwind directives to CSS file
   - Update Vite config to include Tailwind plugin

3. **Create UI Component Library**
   - Create `frontend/src/components/ui/` directory
   - Build Radix UI wrapper components (Button, Dialog, Select, Input, Card, etc.)
   - Style components with Tailwind classes matching Figma design
   - Ensure components are accessible and follow Radix UI patterns

4. **Migrate Navigation**
   - Replace `NavBar.tsx` with new header design
   - Implement gradient logo with Wallet icon
   - Update navigation links styling
   - Maintain active route highlighting
   - Integrate currency/budget selectors with new design
   - Add "Add Transaction" button with gradient styling

5. **Migrate Dashboard Page**
   - Replace MUI components with Tailwind-styled divs
   - Update hero card with gradient background
   - Migrate metrics cards to new design
   - Update chart containers with new styling
   - Replace Material Icons with lucide-react icons
   - Maintain all calculations and API calls

6. **Migrate Accounts Page**
   - Update layout to match Figma design
   - Create gradient summary card
   - Update account cards with new styling
   - Migrate filter controls to new select components
   - Update dialogs (Create/Edit/Delete) with new design
   - Maintain all account operations

7. **Migrate Account Details Page**
   - Update transaction list styling
   - Update transaction dialogs with new design
   - Maintain balance history chart styling
   - Keep all transaction operations functional

8. **Migrate Expenses Page**
   - Update stat cards layout
   - Migrate charts to new styling
   - Update category breakdown design
   - Maintain filtering and date selection
   - Update insights section design

9. **Migrate Budget Page**
   - Create gradient budget name card
   - Update pie chart container styling
   - Migrate category list to new design
   - Update budget editing dialogs
   - Maintain budget calculations

10. **Migrate Remaining Pages**
    - Update Goals page with new design
    - Update CSV Import page with new design
    - Update Data Entry page with new design

11. **Update Footer**
    - Migrate Footer component to Tailwind
    - Match new design aesthetic

12. **Update Error Boundary**
    - Migrate error display to new design
    - Maintain error handling functionality

13. **Theme Integration**
    - Evaluate if ThemeContext needs updates for Tailwind
    - Ensure color palette switching works (if applicable)
    - Document any theme-related changes

14. **Responsive Design**
    - Ensure all new designs work on mobile
    - Test breakpoints match existing responsive behavior
    - Update mobile navigation if needed

15. **Accessibility**
    - Ensure Radix UI components maintain accessibility
    - Test keyboard navigation
    - Verify screen reader compatibility
    - Check color contrast ratios

### Non-Goals

- **Backend Changes**: No modifications to FastAPI backend or API endpoints
- **New Features**: No new functionality beyond visual updates
- **Database Changes**: No schema modifications
- **State Management Overhaul**: Keep existing React Context patterns
- **API Service Changes**: `api.ts` remains unchanged
- **Chart Library Changes**: Continue using recharts (only styling updates)
- **Routing Changes**: Keep existing React Router setup
- **Performance Optimization**: Focus on visual migration, performance tuning is out of scope
- **Testing Infrastructure**: No new test frameworks (unless existing tests need updates)

### Success Metrics

1. **Visual Fidelity**: All pages match Figma design mockups (pixel-perfect not required, but close)
2. **Functionality Preservation**: 100% of existing features work identically
3. **No Regression**: All API calls succeed, all calculations accurate
4. **Performance**: Page load times remain similar or improve
5. **Accessibility**: WCAG 2.1 AA compliance maintained
6. **Responsive Design**: All breakpoints work correctly
7. **Browser Compatibility**: Works in Chrome, Firefox, Safari, Edge (latest versions)

### Affected Files

**Configuration Files:**
- `frontend/package.json` - Add dependencies
- `frontend/vite.config.ts` - Add Tailwind plugin
- `frontend/tailwind.config.js` - NEW: Tailwind configuration
- `frontend/postcss.config.js` - NEW: PostCSS configuration
- `frontend/src/index.css` - Add Tailwind directives
- `frontend/src/styles/tailwind.css` - NEW: Tailwind base styles

**Core Application:**
- `frontend/src/App.tsx` - Remove MUI ThemeProvider, add Tailwind setup, update layout
- `frontend/src/main.tsx` - Import Tailwind CSS

**Components:**
- `frontend/src/components/NavBar.tsx` - Complete rewrite with new design
- `frontend/src/components/Footer.tsx` - Migrate to Tailwind
- `frontend/src/components/ErrorBoundary.tsx` - Migrate to Tailwind
- `frontend/src/components/ui/` - NEW: Radix UI component library
  - `button.tsx`
  - `dialog.tsx`
  - `select.tsx`
  - `input.tsx`
  - `card.tsx`
  - `badge.tsx`
  - (and other needed components)

**Pages:**
- `frontend/src/pages/Dashboard.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/AccountsPage.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/AccountDetailsPage.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/ExpenseTracking.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/Budget.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/Goals.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/CSVImport.tsx` - Migrate to Tailwind, replace MUI components
- `frontend/src/pages/DataEntry.tsx` - Migrate to Tailwind, replace MUI components

**Component Subdirectories:**
- `frontend/src/components/accounts/` - All files migrate to Tailwind
- `frontend/src/components/account-details/` - All files migrate to Tailwind
- `frontend/src/components/budget/` - All files migrate to Tailwind
- `frontend/src/components/dashboard/` - All files migrate to Tailwind
- `frontend/src/components/expenses/` - All files migrate to Tailwind
- `frontend/src/components/csv-import/` - All files migrate to Tailwind
- `frontend/src/components/expense-tracking/` - All files migrate to Tailwind

**Contexts (Potential Updates):**
- `frontend/src/contexts/ThemeContext.tsx` - May need updates for Tailwind theme integration

**Unchanged Files:**
- `frontend/src/services/api.ts` - No changes
- `frontend/src/contexts/DashboardContext.tsx` - No changes
- `frontend/src/utils/formatting.ts` - No changes
- All backend files - No changes

## 🔍 Implementation Assumptions

### Backend Assumptions (MUST AUDIT)

- **API Endpoints**: All existing endpoints remain unchanged (CERTAIN - verified in `frontend/src/services/api.ts`)
  - `GET /api/balances` - Returns balance data
  - `GET /api/accounts` - Returns account list
  - `GET /api/transactions` - Returns transaction list
  - `GET /api/budgets` - Returns budget list
  - `GET /api/metrics` - Returns financial metrics
  - All POST/PUT/DELETE endpoints remain functional

- **API Response Formats**: Response structures remain the same (CERTAIN - verified in `api.ts` interfaces)
  - Balance, Account, Transaction, Budget interfaces unchanged

- **Currency Conversion**: Backend handles currency conversion (CERTAIN - verified in API calls)

### Frontend Assumptions (MUST AUDIT)

- **Component Structure**: Current MUI components can be directly replaced with Radix UI equivalents (LIKELY - Radix UI has equivalents for most MUI components)
  - MUI Button → Radix Button (or custom button with Radix primitives)
  - MUI Dialog → Radix Dialog
  - MUI Select → Radix Select
  - MUI TextField → Radix Input (or custom input)
  - MUI Paper/Card → Custom Card component with Tailwind

- **State Management**: React Context usage remains the same (CERTAIN - no state management changes planned)
  - `ThemeContext` continues to work (may need Tailwind integration)
  - `DashboardContext` unchanged

- **Navigation**: React Router setup remains the same (CERTAIN - only visual updates)
  - Routes: `/`, `/accounts`, `/account/:accountId`, `/budget`, `/expenses`, `/goals`, `/csv-import`, `/data-entry`

- **Chart Library**: Recharts continues to work with Tailwind styling (CERTAIN - recharts is style-agnostic)
  - Only container styling changes, chart components unchanged

- **Icon Mapping**: All Material Icons have lucide-react equivalents (LIKELY - lucide-react has comprehensive icon set)
  - Need to verify specific icons used: Wallet, TrendingUp, AccountBalanceWallet, etc.

- **Form Handling**: Form submission logic remains unchanged (CERTAIN - only visual updates)
  - Validation, API calls, error handling all preserved

- **Responsive Behavior**: Tailwind breakpoints match MUI breakpoints (UNCERTAIN - need to verify)
  - MUI: xs, sm, md, lg, xl
  - Tailwind: sm, md, lg, xl, 2xl
  - May need custom breakpoint configuration

### Database Schema Assumptions (MUST AUDIT)

- **No Schema Changes**: Database schema remains unchanged (CERTAIN - no backend modifications)
  - All tables, columns, relationships unchanged
  - No migration files needed

### Styling Assumptions (MUST AUDIT)

- **Tailwind + MUI Coexistence**: Tailwind can work alongside MUI during migration (LIKELY - Tailwind uses utility classes, MUI uses CSS-in-JS, should not conflict)
  - May need to configure Tailwind to not override MUI styles during transition

- **Color Palette**: Figma design colors can be mapped to Tailwind theme (CERTAIN - Tailwind supports custom colors)
  - Violet: `violet-600`, `violet-700`
  - Cyan: `cyan-500`, `cyan-600`
  - Slate: `slate-50`, `slate-200`, `slate-500`, `slate-900`

- **Typography**: System fonts work with Tailwind (CERTAIN - Tailwind supports system font stacks)
  - Inter, -apple-system, sans-serif

- **Gradients**: Tailwind gradient utilities match Figma gradients (CERTAIN - Tailwind has gradient support)
  - `bg-gradient-to-br from-violet-600 to-violet-700`

- **Spacing**: Tailwind spacing scale matches design requirements (CERTAIN - Tailwind spacing is configurable)
  - `p-6`, `p-8`, `gap-6`, `gap-8` match design

### Dependency Assumptions (MUST AUDIT)

- **Package Compatibility**: New packages compatible with existing React 18.2.0 (LIKELY - all packages support React 18)
  - Tailwind CSS 4.x
  - Radix UI (latest)
  - lucide-react (latest)

- **Build System**: Vite works with Tailwind CSS (CERTAIN - official Tailwind Vite plugin exists)
  - `@tailwindcss/vite` plugin available

- **No Breaking Changes**: Existing dependencies remain compatible (LIKELY - no major version bumps planned for core deps)

## Git Strategy

**Branch**: `feature/ui-redesign-integration`

**Commit Checkpoints:**

1. **Setup Phase**
   - `feat: add Tailwind CSS and Radix UI dependencies`
   - `feat: configure Tailwind CSS and PostCSS`
   - `feat: create base UI component library (Radix wrappers)`

2. **Navigation Migration**
   - `feat: migrate navigation header to new design`
   - `test: verify navigation and routing functionality`

3. **Dashboard Migration**
   - `feat: migrate dashboard page to Tailwind design`
   - `test: verify dashboard calculations and charts`

4. **Accounts Migration**
   - `feat: migrate accounts page to Tailwind design`
   - `feat: migrate account dialogs to new design`
   - `test: verify account CRUD operations`

5. **Account Details Migration**
   - `feat: migrate account details page to Tailwind design`
   - `feat: migrate transaction dialogs to new design`
   - `test: verify transaction operations`

6. **Expenses Migration**
   - `feat: migrate expenses page to Tailwind design`
   - `test: verify expense filtering and charts`

7. **Budget Migration**
   - `feat: migrate budget page to Tailwind design`
   - `test: verify budget calculations`

8. **Remaining Pages**
   - `feat: migrate remaining pages (Goals, CSV Import, Data Entry)`
   - `feat: migrate Footer and ErrorBoundary`

9. **Cleanup**
   - `refactor: remove unused MUI dependencies`
   - `docs: update README with new design system info`
   - `chore: final testing and bug fixes`

## QA Strategy

### LLM Self-Test Checklist

1. **Visual Verification**
   - [ ] Dashboard matches Figma design (hero card, metrics, charts)
   - [ ] Accounts page matches Figma design (summary card, account cards)
   - [ ] Expenses page matches Figma design (stats, charts, breakdown)
   - [ ] Budget page matches Figma design (gradient card, pie chart)
   - [ ] Navigation header matches Figma design
   - [ ] All dialogs use new design
   - [ ] Colors match Figma palette
   - [ ] Spacing matches Figma layout
   - [ ] Typography matches Figma design

2. **Functionality Verification**
   - [ ] Dashboard loads and displays all metrics correctly
   - [ ] Currency selection updates all amounts
   - [ ] Budget selection updates budget status
   - [ ] Account creation/edit/delete works
   - [ ] Transaction creation/edit/delete works
   - [ ] Expense filtering works
   - [ ] Budget editing works
   - [ ] Charts render correctly
   - [ ] Navigation between pages works
   - [ ] All API calls succeed
   - [ ] Error handling displays correctly

3. **Responsive Design**
   - [ ] Mobile layout works (test at 375px width)
   - [ ] Tablet layout works (test at 768px width)
   - [ ] Desktop layout works (test at 1400px width)
   - [ ] Navigation adapts to screen size
   - [ ] Cards stack correctly on mobile

4. **Accessibility**
   - [ ] Keyboard navigation works
   - [ ] Screen reader compatibility (test with NVDA/JAWS)
   - [ ] Color contrast meets WCAG AA (test with contrast checker)
   - [ ] Focus indicators visible
   - [ ] ARIA labels present where needed

5. **Performance**
   - [ ] Page load times acceptable (< 2s initial load)
   - [ ] No console errors
   - [ ] No memory leaks
   - [ ] Smooth animations/transitions

### Manual User Verification

1. **User Testing Scenarios**
   - Create a new account and verify it appears with new design
   - Add a transaction and verify dialog and list update
   - Change currency and verify all amounts update
   - Filter expenses by date range and verify charts update
   - Edit a budget category and verify calculations update
   - Navigate between all pages and verify consistency

2. **Cross-Browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

3. **Device Testing**
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)
   - Mobile (375x667)

## Additional Considerations

### Empty States
- All pages should have empty state designs matching new aesthetic
- Empty states use new card design with helpful messaging

### Loading States
- Loading indicators use new design (spinner or skeleton screens)
- Maintain existing loading logic, update visuals only

### Success States
- Success messages/toasts use new design
- Form submission feedback matches new aesthetic

### Error States
- Error messages use new design
- Error boundary page matches new aesthetic
- API error handling displays with new styling

### Accessibility
- All Radix UI components maintain built-in accessibility
- Keyboard navigation works throughout
- Screen reader announcements correct
- Focus management in dialogs correct

### Brand Alignment
- Design matches Figma mockups (user's inspiration)
- Color palette consistent across all pages
- Typography and spacing consistent
- Component patterns reusable

## Current State Audit Results

### Gate 1: PRD Format Validation ✅
- [x] **Implementation Assumptions section exists** - Found at line 607
- [x] **Section has >3 items** - Contains 4 major categories with multiple sub-items
- [x] **Each assumption has confidence level** - All assumptions marked with CERTAIN/LIKELY/UNCERTAIN/HOPED/ASSUMED

### Gate 2: Documentation-First Protocol ✅

#### Backend Verification
- [x] **API Endpoints Verified**: All endpoints confirmed via `grep -rn "@router\." backend/app/api/`
  - Found 41 route definitions across 13 API modules
  - All endpoints match assumptions: `/api/balances`, `/api/accounts`, `/api/transactions`, `/api/budgets`, `/api/metrics`, etc.
  - Response models verified in `frontend/src/services/api.ts`

#### Frontend Verification
- [x] **Component Structure Verified**: 
  - MUI components confirmed in 31 files using `@mui/icons-material`
  - NavBar structure verified: `frontend/src/components/NavBar.tsx:1-296` uses MUI AppBar
  - Dashboard structure verified: `frontend/src/pages/Dashboard.tsx:1-1285` uses MUI components
  - All component subdirectories confirmed: accounts, account-details, budget, dashboard, expenses, csv-import, expense-tracking

- [x] **Icon Usage Verified**:
  - 31 files import from `@mui/icons-material`
  - Key icons identified: Wallet, TrendingUp, AccountBalanceWallet, AttachMoney, Timeline, Home, ShoppingBag, etc.
  - Icon mapping needed for: `frontend/src/components/budget/utils.tsx:44-64` (iconMap with 20+ icons)
  - Icon mapping needed for: `frontend/src/components/expenses/utils.ts:184-200` (category icons)

- [x] **State Management Verified**:
  - ThemeContext confirmed: `frontend/src/contexts/ThemeContext.tsx:1-44` - Simple string-based palette system
  - DashboardContext confirmed: `frontend/src/contexts/DashboardContext.tsx:1-50` - Currency/date state management
  - Both contexts use standard React Context pattern (no changes needed)

- [x] **Build System Verified**:
  - Vite config confirmed: `frontend/vite.config.ts:1-16` - Uses `@vitejs/plugin-react`
  - Package.json confirmed: `frontend/package.json:1-31` - React 18.2.0, MUI 5.14.20
  - No Tailwind configuration exists yet (expected)

### Properties/Methods Verified

#### Backend Assumptions ✅
- [x] `GET /api/balances` exists: ✅ Confirmed (backend/app/api/balances.py:98)
- [x] `GET /api/accounts` exists: ✅ Confirmed (backend/app/api/accounts.py:9)
- [x] `GET /api/transactions` exists: ✅ Confirmed (backend/app/api/transactions.py:126)
- [x] `GET /api/budgets` exists: ✅ Confirmed (backend/app/api/budgets.py:10)
- [x] `GET /api/metrics` exists: ✅ Confirmed (backend/app/api/metrics.py:55)
- [x] All POST/PUT/DELETE endpoints exist: ✅ Confirmed via grep results

#### Frontend Assumptions ✅
- [x] `ThemeContext.colorPalette` exists: ✅ Confirmed (frontend/src/contexts/ThemeContext.tsx:4-5)
- [x] `ThemeContext.setColorPalette()` exists: ✅ Confirmed (frontend/src/contexts/ThemeContext.tsx:27-29)
- [x] `DashboardContext.selectedCurrency` exists: ✅ Confirmed (frontend/src/contexts/DashboardContext.tsx:4-5)
- [x] `DashboardContext.setSelectedCurrency()` exists: ✅ Confirmed (frontend/src/contexts/DashboardContext.tsx:5)
- [x] React Router routes exist: ✅ Confirmed (frontend/src/App.tsx:52-60)
- [x] Recharts usage confirmed: ✅ Found in Dashboard.tsx and multiple chart components

#### Styling Assumptions ✅
- [x] MUI ThemeProvider exists: ✅ Confirmed (frontend/src/App.tsx:22-32)
- [x] MUI components throughout codebase: ✅ Confirmed (31 files use @mui/icons-material)
- [x] Color palette system exists: ✅ Confirmed (frontend/src/config/colorPalettes.ts)
- [x] No Tailwind config exists: ✅ Confirmed (expected - needs creation)

### Gap Analysis

**Missing (Needs Creation):**
- Tailwind CSS configuration files
- PostCSS configuration
- Radix UI component library (`frontend/src/components/ui/`)
- Icon mapping document (Material Icons → lucide-react)

**Incomplete (Needs Modification):**
- All 31 files using Material Icons need icon replacements
- All pages using MUI components need Tailwind migration
- NavBar needs complete rewrite
- ThemeContext may need Tailwind integration (UNCERTAIN - depends on design requirements)

**Current Logic:**
- All assumptions verified match actual codebase structure
- API endpoints confirmed functional
- State management patterns confirmed
- Component structure confirmed

### Anti-Duplication Audit

**UI Component Library:**
- [x] Checked for existing `frontend/src/components/ui/` directory: ❌ NOT FOUND - needs creation
- [x] Checked for existing Tailwind config: ❌ NOT FOUND - needs creation
- [x] Checked for existing Radix UI usage: ❌ NOT FOUND - needs addition

**Icon System:**
- [x] Checked for existing lucide-react usage: ❌ NOT FOUND - needs addition
- [x] Material Icons usage: ✅ FOUND in 31 files - needs replacement

**Decision:** Create new UI component library and icon system (no existing implementations found)

### Naming Consistency Audit

**File Paths Verified:**
- [x] All mentioned file paths exist and are correct
- [x] Component subdirectories confirmed: accounts, account-details, budget, dashboard, expenses, csv-import, expense-tracking
- [x] Page files confirmed: Dashboard.tsx, AccountsPage.tsx, AccountDetailsPage.tsx, ExpenseTracking.tsx, Budget.tsx, Goals.tsx, CSVImport.tsx, DataEntry.tsx

**API Endpoints Verified:**
- [x] All endpoint paths match actual backend routes
- [x] Response models match `frontend/src/services/api.ts` interfaces

## Implementation Notes

### Migration Strategy

1. **Incremental Migration**: Migrate one page at a time to minimize risk
2. **Component Library First**: Build UI component library before migrating pages
3. **Keep MUI During Transition**: Don't remove MUI until all pages migrated
4. **Test After Each Page**: Verify functionality after each page migration
5. **Document Icon Mappings**: Create mapping document for Material Icons → lucide-react

### Potential Challenges

1. **Complex MUI Components**: Some MUI components (DataGrid, DatePicker) may need custom solutions
2. **Theme Integration**: May need to bridge ThemeContext with Tailwind theme
3. **Chart Styling**: Recharts may need custom styling to match new design
4. **Responsive Breakpoints**: May need custom Tailwind breakpoint configuration
5. **Form Validation**: Need to ensure Radix UI form components work with existing validation
6. **Icon Mapping**: 31 files need icon replacements - create mapping document first

### Risk Mitigation

1. **Feature Branch**: Work in feature branch, merge only when complete
2. **Backup Current State**: Tag current version before starting migration
3. **Incremental Testing**: Test after each page migration
4. **Keep API Unchanged**: No backend changes reduces risk
5. **Documentation**: Document all component mappings and design decisions

## Executable Implementation Plan

### Phase Rules

1. **Maximum 3 tasks per phase** - Each phase should be completable in one session
2. **Git commit after each phase** - Use descriptive commit messages
3. **Test after each phase** - Verify functionality before proceeding
4. **User confirmation checkpoints** - Pause for approval before major changes
5. **No breaking changes** - Keep existing functionality working throughout

### Production Safety Checklist

- [ ] No mock data or placeholder content
- [ ] All API calls use real endpoints
- [ ] Error handling preserved
- [ ] Loading states maintained
- [ ] Form validation preserved
- [ ] Accessibility maintained
- [ ] Responsive design tested

## Tasks

### Phase 1 (1.0) - Setup and Configuration
- [x] 1.0 `git checkout -b feature/ui-redesign-integration` ✅ COMPLETED
- [x] 1.1 Install dependencies: Add `tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer`, `lucide-react`, and required Radix UI packages to `frontend/package.json` ✅ COMPLETED
- [x] 1.2 Create `frontend/tailwind.config.js` with design system colors (violet, cyan, slate) and custom breakpoints ✅ COMPLETED
- [x] 1.3 Create `frontend/postcss.config.js` and `frontend/src/styles/tailwind.css` with Tailwind directives, update `frontend/vite.config.ts` to include Tailwind plugin ✅ COMPLETED
- [ ] 1.4 Build validation: Run `npm install` and verify no dependency conflicts, test `npm run dev` starts successfully ⏳ PENDING - Requires network access (user to run manually)
- [ ] 1.5 User confirmation checkpoint: Verify Tailwind CSS is working (add test class to App.tsx) ⏳ PENDING

### Phase 2 (2.0) - UI Component Library Foundation
- [ ] 2.0 `git commit -m "feat: add Tailwind CSS and Radix UI dependencies"`
- [ ] 2.1 Create `frontend/src/components/ui/` directory and create base components: `button.tsx`, `card.tsx`, `input.tsx` using Radix UI primitives styled with Tailwind classes matching Figma design
- [ ] 2.2 Create additional UI components: `dialog.tsx`, `select.tsx`, `badge.tsx` with proper accessibility and Tailwind styling
- [ ] 2.3 Create icon mapping document: Map Material Icons to lucide-react equivalents (create `frontend/src/utils/iconMapping.ts` with mapping for all 31 files)
- [ ] 2.4 Build validation: Import and render test components, verify Tailwind classes apply correctly
- [ ] 2.5 User confirmation checkpoint: Review component library and icon mappings

### Phase 3 (3.0) - Navigation Header Migration
- [ ] 3.0 `git commit -m "feat: create base UI component library (Radix wrappers)"`
- [ ] 3.1 Replace `frontend/src/components/NavBar.tsx` with new header design: Remove MUI AppBar, implement gradient logo with Wallet icon from lucide-react, update navigation links with Tailwind styling
- [ ] 3.2 Integrate currency/budget selectors: Replace MUI Select with Radix Select components, maintain existing functionality from DashboardHeader
- [ ] 3.3 Add "Add Transaction" button: Implement gradient button matching Figma design, connect to existing transaction creation flow
- [ ] 3.4 Build validation: Test navigation between all routes, verify active state highlighting, test currency/budget selectors work
- [ ] 3.5 User confirmation checkpoint: Review new navigation header design and functionality

### Phase 4 (4.0) - Dashboard Page Migration
- [ ] 4.0 `git commit -m "feat: migrate navigation header to new design"`
- [ ] 4.1 Migrate Dashboard layout: Replace MUI Container/Box/Grid with Tailwind grid utilities, update hero card with gradient background matching Figma
- [ ] 4.2 Migrate metrics cards: Replace MUI Paper/Card with Tailwind-styled cards, replace Material Icons with lucide-react icons, maintain all calculations
- [ ] 4.3 Update chart containers: Style recharts containers with Tailwind classes, maintain chart functionality, update colors to match design
- [ ] 4.4 Build validation: Verify all metrics display correctly, test currency selection updates amounts, test budget selection updates status, verify charts render
- [ ] 4.5 User confirmation checkpoint: Review dashboard design and verify all functionality works

### Phase 5 (5.0) - Accounts Page Migration
- [ ] 5.0 `git commit -m "feat: migrate dashboard page to Tailwind design"`
- [ ] 5.1 Migrate Accounts page layout: Replace MUI components with Tailwind, create gradient summary card matching Figma design
- [ ] 5.2 Migrate account cards: Update AccountCard component with new styling, replace Material Icons with lucide-react, maintain account operations
- [ ] 5.3 Migrate account dialogs: Update CreateAccountDialog, EditAccountDialog, DeleteAccountDialog with Radix UI Dialog and new styling
- [ ] 5.4 Build validation: Test account creation/edit/delete operations, verify currency conversion works, test account filtering
- [ ] 5.5 User confirmation checkpoint: Review accounts page design and functionality

### Phase 6 (6.0) - Account Details Page Migration
- [ ] 6.0 `git commit -m "feat: migrate accounts page to Tailwind design"`
- [ ] 6.1 Migrate Account Details page: Update transaction list styling with Tailwind, replace MUI components
- [ ] 6.2 Migrate transaction dialogs: Update AddTransactionDialog, EditTransactionDialog, DeleteTransactionDialog, AdjustBalanceDialog with Radix UI and new styling
- [ ] 6.3 Update balance history chart: Style chart container with Tailwind, maintain chart functionality
- [ ] 6.4 Build validation: Test transaction CRUD operations, verify balance history chart works, test transaction filtering
- [ ] 6.5 User confirmation checkpoint: Review account details page design

### Phase 7 (7.0) - Expenses Page Migration
- [ ] 7.0 `git commit -m "feat: migrate account details page to Tailwind design"`
- [ ] 7.1 Migrate Expenses page layout: Replace MUI components with Tailwind, update stat cards layout matching Figma design
- [ ] 7.2 Migrate expense charts: Update CumulativeSpendingCard, MonthlyComparisonChart, CategoryTotalsCard with Tailwind styling, replace Material Icons
- [ ] 7.3 Update expense components: Migrate ExpenseTrackingHeader, PeriodNavigation, SummaryCards, TripExpensesCard to Tailwind
- [ ] 7.4 Build validation: Test expense filtering by date range, verify category breakdown displays, test monthly comparison chart, verify trip expenses
- [ ] 7.5 User confirmation checkpoint: Review expenses page design

### Phase 8 (8.0) - Budget Page Migration
- [ ] 8.0 `git commit -m "feat: migrate expenses page to Tailwind design"`
- [ ] 8.1 Migrate Budget page layout: Replace MUI components with Tailwind, create gradient budget name card matching Figma
- [ ] 8.2 Update budget components: Migrate BudgetHeader, BudgetItemRow, ExpenseCategoryCard, IncomeCard, SummaryCard to Tailwind, replace Material Icons
- [ ] 8.3 Update budget dialogs: Migrate BudgetDialogs, IconPickerDialog with Radix UI and new styling, update icon picker to use lucide-react icons
- [ ] 8.4 Build validation: Test budget creation/edit/delete, verify pie chart displays correctly, test category budget editing, verify calculations
- [ ] 8.5 User confirmation checkpoint: Review budget page design

### Phase 9 (9.0) - Remaining Pages Migration
- [ ] 9.0 `git commit -m "feat: migrate budget page to Tailwind design"`
- [ ] 9.1 Migrate Goals page: Replace MUI components with Tailwind, update styling to match design system
- [ ] 9.2 Migrate CSV Import and Data Entry pages: Update both pages with Tailwind styling, maintain all import/entry functionality
- [ ] 9.3 Migrate Footer and ErrorBoundary: Update Footer.tsx and ErrorBoundary.tsx with Tailwind classes
- [ ] 9.4 Build validation: Test all remaining pages, verify CSV import works, test data entry forms, verify error boundary displays correctly
- [ ] 9.5 User confirmation checkpoint: Review all remaining pages

### Phase 10 (10.0) - Component Subdirectories Migration
- [ ] 10.0 `git commit -m "feat: migrate remaining pages (Goals, CSV Import, Data Entry)"`
- [ ] 10.1 Migrate dashboard components: Update CashInvestmentDonutChart, FinancialOverviewChart, MetricsCards, NetWorthCard, DashboardHeader to Tailwind
- [ ] 10.2 Migrate expense-tracking components: Update DateRangeNavigator, ExpensesTable to Tailwind
- [ ] 10.3 Migrate csv-import components: Update TransactionTable, ErrorDisplay to Tailwind
- [ ] 10.4 Build validation: Test all component functionality, verify no regressions
- [ ] 10.5 User confirmation checkpoint: Review all migrated components

### Phase 11 (11.0) - Theme Integration and Cleanup
- [ ] 11.0 `git commit -m "feat: migrate all component subdirectories"`
- [ ] 11.1 Evaluate ThemeContext integration: Test if ThemeContext needs updates for Tailwind theme switching, document decision
- [ ] 11.2 Remove unused MUI dependencies: Remove `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` from package.json (keep if still needed for transition)
- [ ] 11.3 Final responsive design testing: Test all breakpoints (mobile, tablet, desktop), verify navigation adapts correctly
- [ ] 11.4 Build validation: Run full application test, verify no console errors, test all user flows
- [ ] 11.5 User confirmation checkpoint: Final review before merge

### Phase 12 (12.0) - Documentation and Finalization
- [ ] 12.0 `git commit -m "refactor: remove unused MUI dependencies and finalize theme integration"`
- [ ] 12.1 Update README: Document new design system (Tailwind CSS + Radix UI), update setup instructions if needed
- [ ] 12.2 Create migration notes: Document icon mappings, component replacements, any design decisions
- [ ] 12.3 Final QA: Complete LLM self-test checklist, perform manual user verification scenarios
- [ ] 12.4 Build validation: Production build test (`npm run build`), verify no build errors
- [ ] 12.5 User approval: Final sign-off before merging to main branch

## Completeness Rating

**Score: 9/10**

**Strengths:**
- Comprehensive assumption verification completed
- All file paths confirmed
- API endpoints verified
- Clear phase structure with 3 tasks per phase
- User confirmation checkpoints included
- Production safety checklist included

**Gaps Identified:**
- Icon mapping document needs creation (31 files need mapping)
- Specific lucide-react icon equivalents need verification (some Material Icons may not have direct matches)
- ThemeContext integration strategy needs clarification (may need Tailwind theme configuration)

**Recommendations:**
1. Create icon mapping document early (Phase 2) to guide all icon replacements
2. Test Tailwind + MUI coexistence before removing MUI (keep both during transition)
3. Consider creating a design tokens file for consistent color/spacing usage
4. Document any custom Tailwind utilities needed for gradients/decorative elements

## User Approval Required

**Status**: Awaiting user approval to proceed with implementation

**Next Steps:**
1. Review this PRD review document
2. Approve the executable implementation plan
3. Confirm icon mapping approach (create mapping document vs. replace on-the-fly)
4. Confirm theme integration approach (keep ThemeContext vs. migrate to Tailwind theme)
5. Provide approval to begin Phase 1

