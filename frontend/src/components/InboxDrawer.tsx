import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxItem, Trip } from '@/types'
import { UI_ICONS } from './icons'
import { useModals } from './Modal'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function InboxDrawer({ isOpen, onClose }: Props) {
    const [items, setItems] = useState<InboxItem[]>([])
    const [trips, setTrips] = useState<Trip[]>([])
    const [selectedTrip, setSelectedTrip] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const { showAlert } = useModals()

    useEffect(() => {
        if (isOpen) {
            fetchInbox()
            fetchTrips()
        }
    }, [isOpen])

    const fetchInbox = async () => {
        const { data } = await supabase
            .from('inbox_items')
            .select('*')
            .eq('status', 'Pending')
            .order('created_at', { ascending: false })
        if (data) setItems(data as InboxItem[])
        setLoading(false)
    }

    const fetchTrips = async () => {
        const { data } = await supabase.from('trips').select('*')
        if (data) setTrips(data as Trip[])
    }

    const handleAccept = async (item: InboxItem, tripId: string) => {
        if (!tripId) { 
            showAlert('Error', 'Selecciona un viaje primero', 'warning')
            return 
        }

        // 1. Obtener la versión activa del viaje
        const { data: version } = await supabase
            .from('itinerary_versions')
            .select('id')
            .eq('trip_id', tripId)
            .eq('is_active', true)
            .single()

        if (!version) return

        // 1.5 Verificar duplicados
        const { data: existingItems } = await supabase
            .from('itinerary_items')
            .select('id')
            .eq('version_id', version.id)
            .eq('title', item.title)
            // Opcional: chequear start_time también si se desea más precisión
            .maybeSingle()

        if (existingItems) {
            showAlert('Información', '¡Este ítem ya existe en el viaje seleccionado!', 'info')
            return
        }

        // 2. Crear el ítem de itinerario
        const { error: insertError } = await supabase
            .from('itinerary_items')
            .insert({
                version_id: version.id,
                type: item.type,
                title: item.title,
                description: item.description,
                start_time: item.start_time,
                end_time: item.end_time,
                location: item.location,
                cost: item.cost,
                currency: item.currency,
                booking_reference: item.booking_reference,
                booking_url: item.booking_url,
                status: 'Confirmed'
            })

        if (insertError) {
            showAlert('Error', 'Error al crear ítem: ' + insertError.message, 'error')
            return
        }

        // 3. Marcar como aceptado en el inbox
        await supabase
            .from('inbox_items')
            .update({ status: 'Accepted' })
            .eq('id', item.id)

        fetchInbox()
    }

    const handleReject = async (itemId: string) => {
        await supabase
            .from('inbox_items')
            .update({ status: 'Rejected' })
            .eq('id', itemId)
        fetchInbox()
    }

    if (!isOpen) return null

    return (
        <div className="inbox-drawer glass-card">
            <div className="inbox-drawer__header">
                <h3><UI_ICONS.inbox size={16} style={{ marginRight: '8px' }} />Bandeja de Entrada (Mail)</h3>
                <button onClick={onClose} className="btn-close"><UI_ICONS.close size={16} /></button>
            </div>

            <div className="inbox-drawer__content">
                {loading ? (
                    <p>Cargando...</p>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <p>No tienes correos pendientes de procesar.</p>
                        <small>Reenvía tus confirmaciones a planix.me@gmail.com</small>
                    </div>
                ) : (
                    <div className="inbox-list">
                        {items.map(item => (
                            <div key={item.id} className="inbox-card">
                                <div className="inbox-card__header">
                                    <span className="badge">{item.type}</span>
                                    <h4>{item.title}</h4>
                                </div>
                                <p className="inbox-card__desc">{item.description}</p>

                                <div className="inbox-card__actions">
                                    <select
                                        className="form-input form-input--sm"
                                        onChange={(e) => setSelectedTrip(e.target.value)}
                                        value={selectedTrip}
                                    >
                                        <option value="">Seleccionar Viaje...</option>
                                        {trips.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        disabled={!selectedTrip}
                                        onClick={() => handleAccept(item, selectedTrip)}
                                        className="btn-primary btn-primary--sm"
                                    >
                                        Añadir
                                    </button>
                                    <button
                                        onClick={() => handleReject(item.id)}
                                        className="btn-ghost btn-ghost--sm"
                                    >
                                        Ignorar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
