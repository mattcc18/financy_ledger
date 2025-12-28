import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardProvider } from './contexts/DashboardContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import AccountsPage from './pages/AccountsPage';
import AccountDetailsPage from './pages/AccountDetailsPage';

// Import Dashboard directly (not lazy)
import Dashboard from './pages/Dashboard';
import ExpenseTracking from './pages/ExpenseTracking';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import DataEntry from './pages/DataEntry';
import CSVImport from './pages/CSVImport';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider>
          <DashboardProvider>
            <Router>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                }}
                className="bg-gradient-to-br from-slate-50 via-white to-slate-50"
              >
                <NavBar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: { xs: 7, sm: 8 } }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/account/:accountId" element={<AccountDetailsPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/data-entry" element={<DataEntry />} />
                    <Route path="/budget" element={<Budget />} />
                    <Route path="/expenses" element={<ExpenseTracking />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/csv-import" element={<CSVImport />} />
                  </Routes>
                </Box>
                <Footer />
              </Box>
            </Router>
          </DashboardProvider>
        </ThemeProvider>
      </MUIThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

