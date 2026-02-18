import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import CreateTripModal from '@/components/CreateTripModal'
import type { Trip } from '@/types'

export default function Dashboard() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [userEmail, setUserEmail] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchTrips = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            navigate('/')
            return
        }
        setUserEmail(user.email ?? '')

        const { data } = await supabase
            .from('trips')
            .select(`
                id,
                name,
                start_date,
                end_date,
                image_url,
                participants!inner(user_id)
            `)
            .eq('participants.user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) setTrips(data as unknown as Trip[])
        setLoading(false)
    }, [navigate])

    useEffect(() => {
        fetchTrips()
    }, [fetchTrips])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    if (loading) {
        return <div className="loading-screen">Cargando dashboard...</div>
    }

    return (
        <main className="dashboard-layout">
            <div className="glass-card">
                <header className="dashboard-header">
                    <div>
                        <h1 className="hero-title dashboard-greeting">
                            Hola, {userEmail.split('@')[0]}
                        </h1>
                        <p className="dashboard-subtitle">Este es tu centro de planificación de viajes.</p>
                        <button onClick={handleLogout} className="btn-link">
                            Cerrar sesión
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="cta-button"
                    >
                        + Nuevo Viaje
                    </button>
                </header>

                <div className="trips-section">
                    <h2 className="section-title">Tus Próximos Viajes</h2>
                    <div className="trips-grid">
                        {trips.map((trip) => {
                            const days = trip.start_date && trip.end_date
                                ? Math.ceil(
                                    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime())
                                    / (1000 * 60 * 60 * 24)
                                )
                                : null

                            return (
                                <article
                                    key={trip.id}
                                    onClick={() => navigate(`/trips/${trip.id}`)}
                                    className="trip-card"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/trips/${trip.id}`)}
                                >
                                    <div className="trip-card__image">
                                        <span className="trip-card__emoji">✈️</span>
                                        {days && (
                                            <span className="trip-card__days">{days} días</span>
                                        )}
                                    </div>
                                    <h3 className="trip-card__name">{trip.name}</h3>
                                    <p className="trip-card__dates">
                                        {trip.start_date
                                            ? new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'Sin fecha'}
                                        {trip.end_date
                                            ? ` → ${new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : ''}
                                    </p>
                                    <p className="trip-card__cta">Ver itinerario →</p>
                                </article>
                            )
                        })}

                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="trip-card trip-card--add"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
                        >
                            <span className="trip-card--add__icon">+</span>
                            <p className="trip-card--add__label">Añadir otro viaje</p>
                        </div>
                    </div>
                </div>
            </div>

            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTripCreated={fetchTrips}
            />
        </main>
    )
}
