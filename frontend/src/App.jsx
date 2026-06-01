import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorModalProvider } from './context/ErrorModalContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import SemanasPage from './pages/SemanasPage';
import DiasPage from './pages/DiasPage';
import EjerciciosPage from './pages/EjerciciosPage';
import MetricasPage from './pages/MetricasPage';
import AgenteIAPage from './pages/AgenteIAPage';
import UsuariosPage from './pages/UsuariosPage';
import AdminIAPage from './pages/AdminIAPage';

// Smart default redirect — sends user or admin to their home
function DashboardIndex() {
  const { user } = useAuth();
  if (user?.rol === 'ADMIN') return <Navigate to="admin-ia" replace />;
  return <Navigate to="semanas" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Smart index redirect by role */}
              <Route index element={<DashboardIndex />} />

              {/* ─── USER Routes ───────────────────────────── */}
              <Route path="semanas" element={<SemanasPage />} />
              <Route path="semanas/:id" element={<DiasPage />} />
              <Route path="ejercicios" element={<EjerciciosPage />} />
              <Route path="metricas" element={<MetricasPage />} />
              <Route path="agente-ia" element={<AgenteIAPage />} />

              {/* ─── ADMIN Routes (role-protected) ─────────── */}
              <Route
                path="usuarios"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UsuariosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin-ia"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminIAPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorModalProvider>
    </AuthProvider>
  );
}
