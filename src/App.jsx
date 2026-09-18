import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './i18n';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Results from './pages/Results';
import Premium from './pages/Premium';
import History from './pages/History';
import Settings from './pages/Settings';
import Admin from './pages/Admin';


export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
