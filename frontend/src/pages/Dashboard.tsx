import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import CreateTripModal from '@/components/CreateTripModal'
import UpdateTripModal from '@/components/UpdateTripModal'
import InboxDrawer from '@/components/InboxDrawer'
import type { Trip } from '@/types'

export default function Dashboard() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [userEmail, setUserEmail] = useState('')
    const [currentUserId, setCurrentUserId] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    const [isInboxOpen, setIsInboxOpen] = useState(false)
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchTrips = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            navigate('/')
            return
        }
        setUserEmail(user.email ?? '')
        setCurrentUserId(user.id)

        const { data } = await supabase
            .from('trips')
            .select(`
                *,
                participants(count)
            `)
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

    const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
        e.stopPropagation()
        if (!window.confirm('¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.')) return

        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', tripId)

        if (error) {
            alert('Error al eliminar: ' + error.message)
        } else {
            fetchTrips()
        }
    }

    const handleEditClick = (e: React.MouseEvent, trip: Trip) => {
        e.stopPropagation()
        setSelectedTrip(trip)
        setIsUpdateModalOpen(true)
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
                    <div className="dashboard-header__group">
                        <button
                            onClick={() => setIsInboxOpen(true)}
                            className="btn-ghost btn-ghost--sm"
                            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            📥 Bandeja de Entrada
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="cta-button"
                        >
                            + Nuevo Viaje
                        </button>
                    </div>
                </header>

                <div className="trips-section">
                    <h2 className="section-title">Tus Próximos Viajes</h2>
                    <div className="trips-grid">
                        {trips.map((trip: any) => {
                            const days = trip.start_date && trip.end_date
                                ? Math.ceil(
                                    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime())
                                    / (1000 * 60 * 60 * 24)
                                )
                                : null

                            const participantCount = trip.participants?.[0]?.count || 0

                            return (
                                <article
                                    key={trip.id}
                                    onClick={() => navigate(`/trips/${trip.id}`)}
                                    className="trip-card"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/trips/${trip.id}`)}
                                >
                                    <div
                                        className="trip-card__image"
                                        style={trip.image_url ? {
                                            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${trip.image_url})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        } : {}}
                                    >
                                        {!trip.image_url && <span className="trip-card__emoji">✈️</span>}
                                        {days && (
                                            <span className="trip-card__days">{days} días</span>
                                        )}
                                        {trip.owner_id === currentUserId && (
                                            <div className="trip-card__actions">
                                                <button
                                                    onClick={(e) => handleEditClick(e, trip)}
                                                    className="trip-card__action-btn"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                                                    className="trip-card__action-btn"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="trip-card__name">{trip.name}</h3>
                                    <div className="trip-card__footer">
                                        <p className="trip-card__dates">
                                            {trip.start_date
                                                ? new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                                : 'S/F'}
                                            {trip.end_date ? ' → ' : ''}
                                            {trip.end_date
                                                ? new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                                : ''}
                                        </p>
                                        <div className="trip-card__participants">
                                            👤 {participantCount}
                                        </div>
                                    </div>
                                </article>
                            )
                        })}

                        <div
                            onClick={() => setIsCreateModalOpen(true)}
                            className="trip-card trip-card--add"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setIsCreateModalOpen(true)}
                        >
                            <span className="trip-card--add__icon">+</span>
                            <p className="trip-card--add__label">Añadir otro viaje</p>
                        </div>
                    </div>
                </div>
            </div>

            <CreateTripModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTripCreated={fetchTrips}
            />

            <UpdateTripModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                trip={selectedTrip}
                onTripUpdated={fetchTrips}
            />

            <InboxDrawer
                isOpen={isInboxOpen}
                onClose={() => setIsInboxOpen(false)}
            />
        </main>
    )
}
