import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import Splash from './components/Splash'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Simulations from './pages/Simulations'
import SimulationDetail from './pages/SimulationDetail'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import Community from './pages/Community'
import Profile from './pages/Profile'
import AttemptWorkspace from './pages/AttemptWorkspace'
import SubmitSolution from './pages/SubmitSolution'
import EvaluationResult from './pages/EvaluationResult'
import PublicCredential from './pages/PublicCredential'
import TextbookManager from './pages/TextbookManager'
import QnA from './pages/QnA'
import AssignmentCompleter from './pages/AssignmentCompleter'
import QuestionBank from './pages/QuestionBank'
import NotFound from './pages/NotFound'

export default function App() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashDone') === 'true'
  )

  useEffect(() => {
    if (splashDone) return
    const t = setTimeout(() => {
      setSplashDone(true)
      sessionStorage.setItem('splashDone', 'true')
    }, 2500)
    return () => clearTimeout(t)
  }, [splashDone])

  return (
    <>
      {!splashDone && <Splash onFinish={() => {
        setSplashDone(true)
        sessionStorage.setItem('splashDone', 'true')
      }} />}
      <div className="min-h-screen bg-forge-bg text-forge-text font-body">
        <TopBar />
        <Navbar />
        <main className="pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/simulations/:id" element={<SimulationDetail />} />
            <Route path="/c/:slug" element={<PublicCredential />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/attempts/:id" element={<ProtectedRoute><AttemptWorkspace /></ProtectedRoute>} />
            <Route path="/attempts/:id/submit" element={<ProtectedRoute><SubmitSolution /></ProtectedRoute>} />
            <Route path="/attempts/:id/evaluation" element={<ProtectedRoute><EvaluationResult /></ProtectedRoute>} />
            <Route path="/textbooks" element={<ProtectedRoute><TextbookManager /></ProtectedRoute>} />
            <Route path="/ask" element={<ProtectedRoute><QnA /></ProtectedRoute>} />
            <Route path="/assignment" element={<ProtectedRoute><AssignmentCompleter /></ProtectedRoute>} />
            <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </>
  )
}
