import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BottomNav from './components/mobile/BottomNav';
import InstallPrompt from './components/InstallPrompt';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route wrapper (redirect to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* Install Prompt */}
        <InstallPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Main layout with bottom navigation
function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<div className="p-4">Chi tiêu (Coming soon)</div>} />
        <Route path="/calendar" element={<div className="p-4">Lịch (Coming soon)</div>} />
        <Route path="/profile" element={<div className="p-4">Cá nhân (Coming soon)</div>} />
      </Routes>

      {/* Bottom Navigation (mobile only) */}
      <BottomNav />
    </div>
  );
}

export default App;
