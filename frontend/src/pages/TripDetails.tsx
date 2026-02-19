import { useState, useEffect, useRef, useCallback } from 'react'
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
    const [versions, setVersions] = useState<ItineraryVersion[]>([])
    const [items, setItems] = useState<ItineraryItem[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [currentUserId, setCurrentUserId] = useState('')
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [loading, setLoading] = useState(true)

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)
    const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const fetchParticipants = useCallback(async () => {
        const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('trip_id', id)

        // Simular perfiles (en una app real haríamos un join con perfiles públicos)
        setParticipants((data as Participant[]) ?? [])
    }, [id])

    const fetchVersionData = useCallback(async (versionId: string) => {
        const { data: versionData } = await supabase
            .from('itinerary_versions')
            .select(`
                *,
                itinerary_items (
                    *,
                    documents (*)
                )
            `)
            .eq('id', versionId)
            .single()

        if (versionData) {
            setVersion(versionData as ItineraryVersion)
            setItems(sortByTime(versionData.itinerary_items ?? []))
        }
    }, [])

    const fetchAllVersions = useCallback(async () => {
        const { data } = await supabase
            .from('itinerary_versions')
            .select('*')
            .eq('trip_id', id)
            .order('created_at', { ascending: false })

        if (data) setVersions(data as ItineraryVersion[])
    }, [id])

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

            // Obtener la versión activa inicialmente
            const { data: activeVersion } = await supabase
                .from('itinerary_versions')
                .select('*')
                .eq('trip_id', id)
                .eq('is_active', true)
                .single()

            if (activeVersion) {
                await fetchVersionData(activeVersion.id)
            }

            fetchAllVersions()
            fetchParticipants()
            setLoading(false)
        }
        fetchData()
    }, [id, navigate, fetchParticipants, fetchVersionData, fetchAllVersions])

    const handleCreateVersion = async () => {
        const name = window.prompt('Nombre del nuevo plan:', `Plan ${versions.length + 1}`)
        if (!name) return

        const { data, error } = await supabase
            .from('itinerary_versions')
            .insert({
                trip_id: id,
                name,
                is_active: false
            })
            .select()
            .single()

        if (error) {
            alert('Error: ' + error.message)
        } else {
            fetchAllVersions()
            if (data) fetchVersionData(data.id)
        }
    }

    const handleActivateVersion = async (versionId: string) => {
        // Primero desactivar todas
        await supabase
            .from('itinerary_versions')
            .update({ is_active: false })
            .eq('trip_id', id)

        // Activar la seleccionada
        await supabase
            .from('itinerary_versions')
            .update({ is_active: true })
            .eq('id', versionId)

        fetchAllVersions()
        setVersion(prev => prev ? { ...prev, is_active: true } : null)
    }

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

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return
        await supabase.from('chat_messages').insert({
            trip_id: id,
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

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return
        setInviting(true)
        alert('Para propósitos del MVP, añade participantes directamente en la base de datos o mediante su UUID.')
        setInviteEmail('')
        setInviting(false)
    }

    if (loading || !trip) {
        return <div className="loading-screen">Cargando detalles del viaje...</div>
    }

    const canEdit = currentUserRole === 'Owner' || currentUserRole === 'Editor'
    const isOwner = currentUserRole === 'Owner'

    const filteredItems = activeFilter === 'All'
        ? items
        : items.filter(i => i.type === activeFilter)

    const totalCost = items
        .filter(i => i.status === 'Confirmed' && i.cost)
        .reduce((sum, i) => sum + (Number(i.cost) || 0), 0)

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
                                ? new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                                : ''}
                            {trip.end_date
                                ? ` → ${new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                                : ''}
                        </p>
                    )}
                </div>
                <div className="trip-details__actions">
                    <button
                        onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        className="btn-ghost"
                    >
                        👥 {participants.length} Colaboradores
                    </button>
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="btn-ghost btn-ghost--icon"
                    >
                        💬 Chat
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

            <div className={`trip-details__grid ${isChatOpen ? 'trip-details__grid--with-chat' : ''} ${isParticipantsOpen ? 'trip-details__grid--with-sidebar' : ''}`}>
                <div className="trip-details__main">
                    {/* Versiones de Itinerario */}
                    <div className="version-selector glass-card">
                        <div className="version-selector__current">
                            <span className="version-selector__label">Viendo:</span>
                            <span className="version-selector__name">
                                {version?.name} {version?.is_active && <span className="badge">Punto de Verdad</span>}
                            </span>
                        </div>
                        <div className="version-selector__actions">
                            <select
                                className="form-input form-input--sm"
                                value={version?.id}
                                onChange={(e) => fetchVersionData(e.target.value)}
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.name} {v.is_active ? '(Activo)' : ''}
                                    </option>
                                ))}
                            </select>
                            {!version?.is_active && canEdit && (
                                <button
                                    onClick={() => handleActivateVersion(version?.id || '')}
                                    className="btn-link"
                                >
                                    Hacer Principal
                                </button>
                            )}
                            {canEdit && (
                                <button onClick={handleCreateVersion} className="btn-ghost btn-ghost--sm">
                                    + Nuevo Plan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card__value" style={{ color: '#059669' }}>
                                {items.filter(i => i.status === 'Confirmed').length}
                            </div>
                            <div className="stat-card__label">Confirmados</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__value" style={{ color: '#6366f1' }}>
                                ${totalCost.toLocaleString()}
                            </div>
                            <div className="stat-card__label">Costo Total</div>
                        </div>
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
                                    tripId={id!}
                                    canEdit={canEdit}
                                    onDelete={handleDeleteItem}
                                    onStatusChange={handleStatusChange}
                                    onRefresh={() => fetchVersionData(version?.id || '')}
                                    typeIcon={TYPE_ICONS[item.type as ItemType]}
                                    statusColor={STATUS_COLORS[item.status as TripStatus]}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Participantes */}
                {isParticipantsOpen && (
                    <aside className="details-sidebar glass-card">
                        <h3 className="section-title">Colaboradores</h3>
                        <div className="participant-list">
                            {participants.map(p => (
                                <div key={p.id} className="participant-item">
                                    <div className="participant-avatar">
                                        {p.user_id.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="participant-info">
                                        <p className="participant-name">Usuario {p.user_id.substring(0, 5)}</p>
                                        <p className="participant-role">{p.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isOwner && (
                            <form onSubmit={handleInvite} className="invite-form">
                                <p className="form-label">Invitar por email</p>
                                <div className="form-row">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="email@ejemplo.com"
                                        className="form-input"
                                    />
                                    <button disabled={inviting} className="cta-button cta-button--icon">
                                        +
                                    </button>
                                </div>
                            </form>
                        )}
                    </aside>
                )}

                {/* Chat */}
                {isChatOpen && (
                    <aside className="chat-panel glass-card">
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
                            <button onClick={handleSendMessage} className="cta-button">
                                Enviar
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
        </div>
    )
}
