import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Solicitud from './pages/Solicitud';
import ClienteDashboard from './pages/ClienteDashboard';
import Proforma from './pages/Proforma';
import AdminDashboard from './pages/AdminDashboard';
import TecnicoDashboard from './pages/TecnicoDashboard';

export default function App() {
  return (
    <Routes>
      {/* Auth (sin layout público) */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Panel admin (pantalla completa con sidebar propio) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Proforma imprimible (pantalla completa, sin navbar) */}
      <Route
        path="/proforma"
        element={
          <ProtectedRoute>
            <Proforma />
          </ProtectedRoute>
        }
      />

      {/* Panel técnico (pantalla completa similar a admin) */}
      <Route
        path="/tecnico"
        element={
          <ProtectedRoute requireTechnician>
            <TecnicoDashboard />
          </ProtectedRoute>
        }
      />

      {/* Páginas con navbar + footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route
          path="/solicitud"
          element={
            <ProtectedRoute>
              <Solicitud />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
