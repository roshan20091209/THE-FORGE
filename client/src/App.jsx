import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNav from './components/layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import TextbookManager from './pages/TextbookManager'
import QnA from './pages/QnA'
import AssignmentCompleter from './pages/AssignmentCompleter'
import QuestionBank from './pages/QuestionBank'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-forge-bg text-forge-text font-body">
      <Navbar />
      <main className="pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/textbooks" element={<ProtectedRoute><TextbookManager /></ProtectedRoute>} />
          <Route path="/ask" element={<ProtectedRoute><QnA /></ProtectedRoute>} />
          <Route path="/assignment" element={<ProtectedRoute><AssignmentCompleter /></ProtectedRoute>} />
          <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
