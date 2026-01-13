
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth';
import { ConfigProvider } from './services/configContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Book } from './pages/Book';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Gallery } from './pages/Gallery';
import { AdminGallery } from './pages/AdminGallery';
import { UserRole } from './types';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth to prevent wrong redirects
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-chalet-green gap-2">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-sm font-medium">Verificando permissões...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // If user tries to access admin page but is just a guest, send to dashboard or home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/gallery" element={<Gallery />} />
        
        <Route 
          path="/book" 
          element={
            <Book /> // Allows viewing, but auth required to submit
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role={UserRole.ADMIN}>
              <Admin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/gallery" 
          element={
            <ProtectedRoute role={UserRole.ADMIN}>
              <AdminGallery />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
