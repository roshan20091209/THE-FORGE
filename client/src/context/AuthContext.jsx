import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('token', session.access_token)
        api.auth.me().then(d => setUser(d.user)).catch(() => setUser({ email: session.user.email, id: session.user.id, role: 'participant', streak: 0, total_points: 0 }))
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('token', session.access_token)
        api.auth.me().then(d => setUser(d.user)).catch(() => setUser({ email: session.user.email, id: session.user.id, role: 'participant', streak: 0, total_points: 0 }))
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  const register = async (email, password, full_name, school) => {
    const data = await api.auth.register({ email, password, full_name, school })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  const loginWithGoogle = async () => {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
