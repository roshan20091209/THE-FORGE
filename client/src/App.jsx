import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Simulations from './pages/Simulations'
import SimulationDetail from './pages/SimulationDetail'
import Dashboard from './pages/Dashboard'
import AttemptWorkspace from './pages/AttemptWorkspace'
import SubmitSolution from './pages/SubmitSolution'
import Credential from './pages/Credential'
import PublicCredential from './pages/PublicCredential'
import PeerReviews from './pages/PeerReviews'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerCandidates from './pages/EmployerCandidates'
import AdminSqlEditor from './pages/AdminSqlEditor'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/simulations" element={<Simulations />} />
        <Route path="/simulations/:id" element={<SimulationDetail />} />
        <Route path="/c/:slug" element={<PublicCredential />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/attempts/:id" element={<ProtectedRoute><AttemptWorkspace /></ProtectedRoute>} />
        <Route path="/attempts/:id/submit" element={<ProtectedRoute><SubmitSolution /></ProtectedRoute>} />
        <Route path="/credentials/:id" element={<ProtectedRoute><Credential /></ProtectedRoute>} />
        <Route path="/reviews/pending" element={<ProtectedRoute><PeerReviews /></ProtectedRoute>} />
        <Route path="/employer/dashboard" element={<ProtectedRoute><EmployerDashboard /></ProtectedRoute>} />
        <Route path="/employer/candidates" element={<ProtectedRoute><EmployerCandidates /></ProtectedRoute>} />
        <Route path="/admin/sql" element={<ProtectedRoute><AdminSqlEditor /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
