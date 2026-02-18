import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Trip, ItineraryItem, ItineraryVersion, Participant, ChatMessage, ItemType, TripStatus } from '@/types'
import AddItemModal from '@/components/AddItemModal'
import ItineraryItemCard from '@/components/ItineraryItemCard'

const STATUS_COLORS: Record<TripStatus, string> = {
    Idea: '#6b7280',
    Tentative: '#d97706',
    Confirmed: '#059669',
}

const TYPE_ICONS: Record<ItemType, string> = {
    Flight: '✈️',
    Hotel: '🏨',
    Activity: '🎯',
    Restaurant: '🍽️',
    Transport: '🚗',
    Idea: '💡',
}

const FILTER_OPTIONS = ['All', 'Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea'] as const
type FilterOption = typeof FILTER_OPTIONS[number]

const sortByTime = (items: ItineraryItem[]): ItineraryItem[] =>
    [...items].sort((a, b) => {
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })

export default function TripDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [trip, setTrip] = useState<Trip | null>(null)
    const [version, setVersion] = useState<ItineraryVersion | null>(null)
    const [items, setItems] = useState<ItineraryItem[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [currentUserId, setCurrentUserId] = useState('')
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [loading, setLoading] = useState(true)

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { navigate('/'); return }
            setCurrentUserId(user.id)

            // Verificar que el usuario es participante
            const { data: participant } = await supabase
                .from('participants')
                .select('role')
                .eq('trip_id', id)
                .eq('user_id', user.id)
                .single()

            if (!participant) { navigate('/dashboard'); return }
            setCurrentUserRole(participant.role)

            // Obtener el viaje
            const { data: tripData } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single()

            if (!tripData) { navigate('/dashboard'); return }
            setTrip(tripData as Trip)

            // Obtener la versión activa con sus ítems
            const { data: versionData } = await supabase
                .from('itinerary_versions')
                .select(`
                    *,
                    itinerary_items (*)
                `)
                .eq('trip_id', id)
                .eq('is_active', true)
                .single()

            if (versionData) {
                setVersion(versionData as ItineraryVersion)
                setItems(sortByTime(versionData.itinerary_items ?? []))
            }

            // Obtener participantes
            const { data: participantsData } = await supabase
                .from('participants')
                .select('*, user_id')
                .eq('trip_id', id)

            setParticipants((participantsData as Participant[]) ?? [])
            setLoading(false)
        }
        fetchData()
    }, [id, navigate])

    // Sincronización Realtime de ítems
    useEffect(() => {
        if (!version?.id) return
        const channel = supabase
            .channel(`items-${version.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'itinerary_items',
                filter: `version_id=eq.${version.id}`,
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setItems(prev => sortByTime([...prev, payload.new as ItineraryItem]))
                } else if (payload.eventType === 'DELETE') {
                    setItems(prev => prev.filter(i => i.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as ItineraryItem : i))
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [version?.id])

    // Chat Realtime
    useEffect(() => {
        if (!isChatOpen || !trip?.id) return
        const channel = supabase
            .channel(`chat-${trip.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `trip_id=eq.${trip.id}`,
            }, (payload) => {
                setChatMessages(prev => [...prev, payload.new as ChatMessage])
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [trip?.id, isChatOpen])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    if (loading || !trip) {
        return <div className="loading-screen">Cargando detalles del viaje...</div>
    }

    const canEdit = currentUserRole === 'Owner' || currentUserRole === 'Editor'

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return
        await supabase.from('chat_messages').insert({
            trip_id: trip.id,
            user_id: currentUserId,
            content: chatInput.trim(),
        })
        setChatInput('')
    }

    const handleDeleteItem = async (itemId: string) => {
        await supabase.from('itinerary_items').delete().eq('id', itemId)
    }

    const handleStatusChange = async (itemId: string, newStatus: TripStatus) => {
        await supabase.from('itinerary_items').update({ status: newStatus }).eq('id', itemId)
    }

    const filteredItems = activeFilter === 'All'
        ? items
        : items.filter(i => i.type === activeFilter)

    const totalCost = items
        .filter(i => i.status === 'Confirmed' && i.cost)
        .reduce((sum, i) => sum + (i.cost ?? 0), 0)

    return (
        <div className="trip-details">
            <header className="trip-details__header">
                <div>
                    <button onClick={() => navigate('/dashboard')} className="btn-back">
                        ← Mis Viajes
                    </button>
                    <h1 className="hero-title trip-details__title">{trip.name}</h1>
                    {(trip.start_date || trip.end_date) && (
                        <p className="trip-details__dates">
                            {trip.start_date
                                ? new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                                : ''}
                            {trip.end_date
                                ? ` → ${new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                : ''}
                        </p>
                    )}
                </div>
                <div className="trip-details__actions">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="btn-ghost btn-ghost--icon"
                    >
                        💬 Chat {isChatOpen ? '▲' : '▼'}
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="cta-button cta-button--sm"
                        >
                            + Añadir Ítem
                        </button>
                    )}
                </div>
            </header>

            <div className={`trip-details__body ${isChatOpen ? 'trip-details__body--with-chat' : ''}`}>
                <div>
                    {/* Stats */}
                    <div className="stats-grid">
                        {[
                            { label: 'Confirmados', value: items.filter(i => i.status === 'Confirmed').length, color: '#059669' },
                            { label: 'Tentativos', value: items.filter(i => i.status === 'Tentative').length, color: '#d97706' },
                            { label: 'Ideas', value: items.filter(i => i.status === 'Idea').length, color: '#6b7280' },
                            { label: 'Costo Total', value: `$${totalCost.toLocaleString()}`, color: '#6366f1' },
                        ].map((stat) => (
                            <div key={stat.label} className="stat-card">
                                <div className="stat-card__value" style={{ color: stat.color }}>{stat.value}</div>
                                <div className="stat-card__label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filtros */}
                    <div className="filter-bar">
                        {FILTER_OPTIONS.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`chip ${activeFilter === f ? 'chip--active' : ''}`}
                            >
                                {f === 'All' ? 'Todos' : `${TYPE_ICONS[f as ItemType]} ${f}`}
                            </button>
                        ))}
                    </div>

                    {/* Lista de ítems */}
                    {filteredItems.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay ítems aún. ¡Empieza añadiendo actividades!</p>
                        </div>
                    ) : (
                        <div className="items-list">
                            {filteredItems.map(item => (
                                <ItineraryItemCard
                                    key={item.id}
                                    item={item}
                                    canEdit={canEdit}
                                    onDelete={handleDeleteItem}
                                    onStatusChange={handleStatusChange}
                                    typeIcon={TYPE_ICONS[item.type]}
                                    statusColor={STATUS_COLORS[item.status]}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat */}
                {isChatOpen && (
                    <aside className="chat-panel">
                        <div className="chat-panel__messages">
                            {chatMessages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.user_id === currentUserId ? 'chat-message--own' : ''}`}
                                >
                                    <div className="chat-message__bubble">{msg.content}</div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-panel__input">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe..."
                                className="form-input"
                            />
                            <button onClick={handleSendMessage} className="cta-button cta-button--icon">
                                →
                            </button>
                        </div>
                    </aside>
                )}
            </div>

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                versionId={version?.id ?? ''}
            />

            {/* Participants are fetched but not yet rendered — keeping state for future use */}
            {participants.length > 0 && null}
        </div>
    )
}
