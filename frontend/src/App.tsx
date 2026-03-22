import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import TripDetails from '@/pages/TripDetails'
import AuthCallback from '@/pages/AuthCallback'
import GlobalModals from '@/components/GlobalModals'

function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="loading-screen">
                Cargando...
            </div>
        )
    }

    return (
        <BrowserRouter>
            <div className="bg-gradient" aria-hidden="true">
                <div className="bg-blob" />
                <div className="bg-blob-2" />
            </div>
            <Routes>
                <Route path="/" element={!session ? <Landing /> : <Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" replace />} />
                <Route path="/trips/:id" element={session ? <TripDetails /> : <Navigate to="/" replace />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
            <GlobalModals />
        </BrowserRouter>
    )
}

export default App
