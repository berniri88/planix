import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                navigate('/dashboard', { replace: true })
            }
        })

        return () => subscription.unsubscribe()
    }, [navigate])

    return (
        <div className="loading-screen">
            <div className="glass-card auth-card">
                <h2 className="auth-title">Autenticando...</h2>
                <p className="auth-subtitle">Espera un momento mientras validamos tu sesión.</p>
            </div>
        </div>
    )
}
