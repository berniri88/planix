import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ItemType, TripStatus } from '@/types'

const ITEM_TYPES: ItemType[] = ['Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea']
const TYPE_LABELS: Record<ItemType, string> = {
    Flight: '✈️ Vuelo',
    Hotel: '🏨 Hotel',
    Activity: '🎯 Actividad',
    Restaurant: '🍽️ Restaurante',
    Transport: '🚗 Transporte',
    Idea: '💡 Idea',
}
const STATUS_OPTIONS: TripStatus[] = ['Idea', 'Tentative', 'Confirmed']
const STATUS_LABELS: Record<TripStatus, string> = {
    Idea: '💡 Idea',
    Tentative: '⏳ Tentativo',
    Confirmed: '✅ Confirmado',
}

interface Props {
    isOpen: boolean
    onClose: () => void
    versionId: string
}

export default function AddItemModal({ isOpen, onClose, versionId }: Props) {
    const [type, setType] = useState<ItemType>('Activity')
    const [status, setStatus] = useState<TripStatus>('Idea')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [locationName, setLocationName] = useState('')
    const [cost, setCost] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [bookingRef, setBookingRef] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setStartTime('')
        setEndTime('')
        setLocationName('')
        setCost('')
        setBookingRef('')
        setType('Activity')
        setStatus('Idea')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('itinerary_items').insert({
                version_id: versionId,
                type,
                status,
                title,
                description: description || null,
                start_time: startTime || null,
                end_time: endTime || null,
                location: locationName ? { name: locationName } : null,
                cost: cost ? parseFloat(cost) : null,
                currency,
                booking_reference: bookingRef || null,
            })
            if (error) throw error
            resetForm()
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            alert('Error: ' + message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card modal-card--lg">
                <h2 className="modal-title">Añadir Ítem al Itinerario</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Tipo */}
                    <div className="form-group">
                        <label className="form-label">Tipo</label>
                        <div className="chip-group">
                            {ITEM_TYPES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`chip ${type === t ? 'chip--active' : ''}`}
                                >
                                    {TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="form-group">
                        <label className="form-label">Estado</label>
                        <div className="chip-group">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`chip chip--flex ${status === s ? 'chip--active' : ''}`}
                                >
                                    {STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div className="form-group">
                        <label className="form-label">Título *</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej: Vuelo Buenos Aires → Tokyo"
                            className="form-input"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Notas adicionales..."
                            rows={2}
                            className="form-input form-textarea"
                        />
                    </div>

                    {/* Fechas */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Inicio</label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fin</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Lugar */}
                    <div className="form-group">
                        <label className="form-label">Lugar / Dirección</label>
                        <input
                            type="text"
                            value={locationName}
                            onChange={e => setLocationName(e.target.value)}
                            placeholder="Ej: Aeropuerto Ezeiza, Buenos Aires"
                            className="form-input"
                        />
                    </div>

                    {/* Costo */}
                    <div className="form-row form-row--cost">
                        <div className="form-group">
                            <label className="form-label">Costo estimado</label>
                            <input
                                type="number"
                                value={cost}
                                onChange={e => setCost(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Moneda</label>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="form-input form-select"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="ARS">ARS</option>
                                <option value="JPY">JPY</option>
                            </select>
                        </div>
                    </div>

                    {/* Referencia de reserva */}
                    <div className="form-group">
                        <label className="form-label">Referencia de reserva</label>
                        <input
                            type="text"
                            value={bookingRef}
                            onChange={e => setBookingRef(e.target.value)}
                            placeholder="Ej: ABC123"
                            className="form-input"
                        />
                    </div>

                    {/* Acciones */}
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="cta-button">
                            {loading ? 'Guardando...' : 'Añadir Ítem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
