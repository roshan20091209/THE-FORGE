import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { api } from '../api'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const data = await api.auth.callback(session.access_token)
          localStorage.setItem('token', data.token)
          navigate('/dashboard')
        } catch {
          localStorage.setItem('token', session.access_token)
          navigate('/dashboard')
        }
      } else {
        setError('Authentication failed')
      }
    })
  }, [navigate])

  if (error) return (
    <div className="text-center py-20">
      <p className="text-forge-danger">{error}</p>
    </div>
  )

  return (
    <div className="text-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-forge-accent mx-auto"></div>
      <p className="mt-4 text-forge-text-secondary text-sm">Completing sign in...</p>
    </div>
  )
}
