import { Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function getStoredToken() {
  return localStorage.getItem('algospace_token');
}

function ProtectedRoute({ children }) {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const token = getStoredToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicOnlyRoute>
              <Auth />
            </PublicOnlyRoute>
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
