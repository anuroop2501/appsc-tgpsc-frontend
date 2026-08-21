import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import PrelimsPage from './pages/PrelimsPage'
import NotesPage from './pages/NotesPage'
import EvaluatorPage from './pages/EvaluatorPage'
import PlannerPage from './pages/PlannerPage'
import HistoryPage from './pages/HistoryPage'
import TestPage from './pages/TestPage'
import PricingPage from './pages/PricingPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import RefundPolicyPage from './pages/RefundPolicyPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Legal & Policy routes (accessible publicly and authenticated) */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
        <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/refund" element={<Navigate to="/refund-policy" replace />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="prelims" element={<PrelimsPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="evaluator" element={<EvaluatorPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="pricing" element={<PricingPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
