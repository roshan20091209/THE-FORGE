import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Settings, LogOut, Award, Flame, CheckCircle, Mail, School, Calendar, Edit3, Save, X, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSchool, setEditSchool] = useState('')

  useEffect(() => {
    api.credentials.list()
      .then(d => setCredentials(d.credentials || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSave = async () => {
    try {
      await api.auth.updateProfile({ full_name: editName, school: editSchool })
      setEditing(false)
      window.location.reload()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-forge-accent/5 to-transparent" />
        <div className="relative z-10 py-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-forge-accent to-forge-cyan flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-glow">
            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Full Name"
                className="input-field text-center"
              />
              <input
                value={editSchool}
                onChange={e => setEditSchool(e.target.value)}
                placeholder="School Name"
                className="input-field text-center"
              />
              <div className="flex gap-2 justify-center">
                <Button variant="primary" size="sm" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} icon={<X className="w-4 h-4" />}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">{user?.full_name || 'Student'}</h1>
              <div className="flex items-center justify-center gap-1 text-sm text-forge-text-secondary mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </div>
              {user?.school && (
                <div className="flex items-center justify-center gap-1 text-sm text-forge-text-secondary">
                  <School className="w-3.5 h-3.5" />
                  {user.school}
                </div>
              )}
              <p className="text-xs text-forge-text-muted mt-2">
                <Calendar className="w-3 h-3 inline mr-1" />
                Member since April 2026
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditing(true); setEditName(user?.full_name || ''); setEditSchool(user?.school || '') }}
                className="mt-3"
                icon={<Edit3 className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Flame, label: 'Streak', value: `${user?.streak || 0}`, color: 'text-forge-warning' },
          { icon: Award, label: 'Points', value: `${user?.total_points || 0}`, color: 'text-forge-accent' },
          { icon: CheckCircle, label: 'Completed', value: `${credentials.length}`, color: 'text-forge-success' },
        ].map(s => (
          <Card key={s.label} hover={false} className="!p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] text-forge-text-muted uppercase">{s.label}</div>
          </Card>
        ))}
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-forge-warning" />
            Achievements
          </h3>
          {credentials.length === 0 ? (
            <p className="text-sm text-forge-text-muted text-center py-4">
              Complete challenges to unlock achievements!
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: '🔥', label: 'First Fire', earned: user?.streak >= 1, desc: 'Score your first point' },
                { icon: '⭐', label: 'Rising Star', earned: credentials.length >= 3, desc: 'Complete 3 challenges' },
                { icon: '🏆', label: 'Champion', earned: credentials.length >= 10, desc: 'Complete 10 challenges' },
                { icon: '💪', label: 'Grinder', earned: user?.streak >= 7, desc: '7-day streak' },
              ].map(b => (
                <div key={b.label} className={`text-center p-2 rounded-lg ${b.earned ? 'bg-forge-warning/10' : 'opacity-30'}`}>
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <div className="text-[10px] font-medium">{b.label}</div>
                  {b.earned && <div className="text-[8px] text-forge-text-muted mt-0.5">Earned!</div>}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/simulations')}
            className="btn-secondary w-full mt-4 text-xs"
          >
            {credentials.length === 0 ? 'Start Your First Challenge' : 'Complete More Challenges'}
          </button>
        </Card>
      </motion.div>

      {/* Recent Profiles */}
      {credentials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="font-semibold mb-3">Recent Capability Profiles</h3>
            <div className="space-y-2">
              {credentials.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/c/${c.credential_slug || c.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{c.simulation_title || 'Challenge'}</p>
                    <p className="text-xs text-forge-text-muted">{c.industry}</p>
                  </div>
                  <span className="text-xs text-forge-accent">View →</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Settings & Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition text-left text-sm">
              <Bell className="w-4 h-4 text-forge-text-muted" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-forge-text-muted">Manage your alerts</p>
              </div>
            </button>
          </div>
        </Card>
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-lg text-forge-danger hover:bg-forge-danger/10 transition text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </motion.div>
    </div>
  )
}
