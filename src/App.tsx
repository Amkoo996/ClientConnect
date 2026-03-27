import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

// Pages
import { Login } from './pages/Login';
import { SignupClient } from './pages/SignupClient';
import { NotFound } from './pages/NotFound';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ClientManagement } from './pages/admin/ClientManagement';
import { InviteClient } from './pages/admin/InviteClient';

// Client Pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { CreateTicket } from './pages/client/CreateTicket';
import { TicketDetail } from './components/TicketDetail';

// Root Redirect Component
import { useAuth } from './hooks/useAuth';
const RootRedirect = () => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return null;
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  return currentUser.role === 'ADMIN' 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/client/dashboard" replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignupClient />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="clients" element={<ClientManagement />} />
                    <Route path="invite" element={<InviteClient />} />
                    <Route path="tickets/:id" element={<TicketDetail />} />
                  </Route>

                  {/* Client Routes */}
                  <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                    <Route index element={<Navigate to="/client/dashboard" replace />} />
                    <Route path="dashboard" element={<ClientDashboard />} />
                    <Route path="tickets/new" element={<CreateTicket />} />
                    <Route path="tickets/:id" element={<TicketDetail />} />
                  </Route>

                  {/* 404 Route */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
