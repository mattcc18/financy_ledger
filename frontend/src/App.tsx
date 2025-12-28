import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import AccountsPage from './pages/AccountsPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

function App() {
  return (
    <ErrorBoundary>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider>
          <AuthProvider>
            <DashboardProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/*"
                    element={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '100vh',
                        }}
                        className="bg-gradient-to-br from-slate-50 via-white to-slate-50"
                      >
                        <NavBar />
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: { xs: 7, sm: 8 }, pb: { xs: 9, sm: 0 } }}>
                          <Routes>
                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
                            <Route path="/account/:accountId" element={<ProtectedRoute><AccountDetailsPage /></ProtectedRoute>} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/data-entry" element={<ProtectedRoute><DataEntry /></ProtectedRoute>} />
                            <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
                            <Route path="/expenses" element={<ProtectedRoute><ExpenseTracking /></ProtectedRoute>} />
                            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                            <Route path="/csv-import" element={<ProtectedRoute><CSVImport /></ProtectedRoute>} />
                          </Routes>
                        </Box>
                        <BottomNav />
                        <Footer />
                      </Box>
                    }
                  />
                </Routes>
              </Router>
            </DashboardProvider>
          </AuthProvider>
        </ThemeProvider>
      </MUIThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

