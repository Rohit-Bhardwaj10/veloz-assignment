import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { PMDashboard } from './pages/PMDashboard';
import { DevDashboard } from './pages/DevDashboard';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800">403 — Unauthorized</h1>
      <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
    </div>
  </div>
);

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'PM') return <PMDashboard />;
  if (user?.role === 'DEV') return <DevDashboard />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardRouter />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
