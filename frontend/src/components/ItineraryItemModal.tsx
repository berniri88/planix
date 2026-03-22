import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ItemType, TripStatus, ItineraryItem, Location } from '@/types'
import LocationSearch from './LocationSearch'
import { TYPE_ICONS, STATUS_ICONS } from './icons'
import { useModals } from './Modal'

const ITEM_TYPES: ItemType[] = ['Flight', 'Bus', 'Train', 'Taxi', 'Hotel', 'Airbnb', 'Activity', 'Restaurant', 'Transport', 'Idea']
const TYPE_LABELS: Record<ItemType, string> = {
    Flight: 'Vuelo',
    Bus: 'Bus',
    Train: 'Tren',
    Taxi: 'Taxi',
    Hotel: 'Hotel',
    Airbnb: 'Airbnb',
    Activity: 'Actividad',
    Restaurant: 'Restaurante',
    Transport: 'Transporte',
    Idea: 'Idea',
}
const STATUS_OPTIONS: TripStatus[] = ['Idea', 'Tentative', 'Confirmed']
const STATUS_LABELS: Record<TripStatus, string> = {
    Idea: 'Idea',
    Tentative: 'Tentativo',
    Confirmed: 'Confirmado',
}

interface Props {
    isOpen: boolean
    onClose: () => void
    versionId: string
    itemToEdit?: ItineraryItem | null
    onSaveSuccess?: () => void
}

export default function ItineraryItemModal({ isOpen, onClose, versionId, itemToEdit, onSaveSuccess }: Props) {
    const { showAlert } = useModals()
    const [type, setType] = useState<ItemType>('Activity')
    const [status, setStatus] = useState<TripStatus>('Idea')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState<Location | null>(null)
    const [endLocation, setEndLocation] = useState<Location | null>(null)
    const [manualLat, setManualLat] = useState('')
    const [manualLng, setManualLng] = useState('')
    const [manualEndLat, setManualEndLat] = useState('')
    const [manualEndLng, setManualEndLng] = useState('')
    const [cost, setCost] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [bookingRef, setBookingRef] = useState('')
    const [bookingUrl, setBookingUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const isRoute = type === 'Flight' || type === 'Transport' || type === 'Bus' || type === 'Train' || type === 'Taxi'

    // Efecto para cargar datos en modo edición o resetear en modo creación
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setType(itemToEdit.type)
                setStatus(itemToEdit.status)
                setTitle(itemToEdit.title)
                setDescription(itemToEdit.description || '')
                setStartTime(itemToEdit.start_time || '')
                setEndTime(itemToEdit.end_time || '')
                setLocation(itemToEdit.location || null)
                setEndLocation(itemToEdit.end_location || null)
                setManualLat(itemToEdit.location?.lat ? String(itemToEdit.location.lat) : '')
                setManualLng(itemToEdit.location?.lng ? String(itemToEdit.location.lng) : '')
                setManualEndLat(itemToEdit.end_location?.lat ? String(itemToEdit.end_location.lat) : '')
                setManualEndLng(itemToEdit.end_location?.lng ? String(itemToEdit.end_location.lng) : '')
                setCost(itemToEdit.cost ? String(itemToEdit.cost) : '')
                setCurrency(itemToEdit.currency || 'USD')
                setBookingRef(itemToEdit.booking_reference || '')
                setBookingUrl(itemToEdit.booking_url || '')
            } else {
                resetForm()
            }
        }
    }, [isOpen, itemToEdit])

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setStartTime('')
        setEndTime('')
        setLocation(null)
        setEndLocation(null)
        setManualLat('')
        setManualLng('')
        setManualEndLat('')
        setManualEndLng('')
        setCost('')
        setBookingRef('')
        setBookingUrl('')
        setType('Activity')
        setStatus('Idea')
        setCurrency('USD')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Preparar ubicación con coordenadas manuales si existen
            const prepareLocation = (baseLocation: Location | null, manualLat: string, manualLng: string): Location | null => {
                if (!baseLocation) return null
                
                const hasManualCoords = manualLat && manualLng
                if (hasManualCoords) {
                    return {
                        ...baseLocation,
                        lat: parseFloat(manualLat),
                        lng: parseFloat(manualLng)
                    }
                }
                return baseLocation
            }

            const itemData = {
                version_id: versionId,
                type,
                status,
                title,
                description: description || null,
                start_time: startTime || null,
                end_time: endTime || null,
                location: prepareLocation(location, manualLat, manualLng),
                end_location: isRoute ? prepareLocation(endLocation, manualEndLat, manualEndLng) : null,
                cost: cost ? parseFloat(cost) : null,
                currency,
                booking_reference: bookingRef || null,
                booking_url: bookingUrl || null,
            }

            let error;

            if (itemToEdit) {
                const { error: updateError } = await supabase
                    .from('itinerary_items')
                    .update(itemData)
                    .eq('id', itemToEdit.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('itinerary_items')
                    .insert(itemData)
                error = insertError
            }

            if (error) throw error

            if (onSaveSuccess) onSaveSuccess()
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            showAlert('Error', 'Error: ' + message, 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-card modal-card--lg">
                <h2 className="modal-title">{itemToEdit ? 'Editar Ítem' : 'Añadir Ítem al Itinerario'}</h2>
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
                                    className={`chip ${type === t ? 'chip--active' : ''} chip--flex`}
                                >
                                    {React.createElement(TYPE_ICONS[t], { size: 16 })}
                                    <span style={{ marginLeft: '4px' }}>{TYPE_LABELS[t]}</span>
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
                                    className={`chip chip--flex ${status === s ? 'chip--active' : ''} `}
                                >
                                    {React.createElement(STATUS_ICONS[s], { size: 16 })}
                                    <span style={{ marginLeft: '4px' }}>{STATUS_LABELS[s]}</span>
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

                    {/* Lugar / Dirección */}
                    {isRoute ? (
                        <>
                            <div className="form-row">
                                <LocationSearch
                                    label="Origen"
                                    value={location}
                                    onChange={setLocation}
                                    placeholder="Ciudad o punto de partida"
                                />
                                <LocationSearch
                                    label="Destino"
                                    value={endLocation}
                                    onChange={setEndLocation}
                                    placeholder="Ciudad o punto de llegada"
                                />
                            </div>
                            
                            {/* Coordenadas manuales para rutas */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Coordenadas Origen (Lat, Lng)</label>
                                    <div className="form-row">
                                        <input
                                            type="number"
                                            value={manualLat}
                                            onChange={e => setManualLat(e.target.value)}
                                            placeholder="Latitud"
                                            step="any"
                                            className="form-input"
                                        />
                                        <input
                                            type="number"
                                            value={manualLng}
                                            onChange={e => setManualLng(e.target.value)}
                                            placeholder="Longitud"
                                            step="any"
                                            className="form-input"
                                        />
                                    </div>
                                    <p className="form-hint">
                                        Opcional: Ingresa coordenadas manualmente para sobreescribir las búsquedas automáticas
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Coordenadas Destino (Lat, Lng)</label>
                                    <div className="form-row">
                                        <input
                                            type="number"
                                            value={manualEndLat}
                                            onChange={e => setManualEndLat(e.target.value)}
                                            placeholder="Latitud"
                                            step="any"
                                            className="form-input"
                                        />
                                        <input
                                            type="number"
                                            value={manualEndLng}
                                            onChange={e => setManualEndLng(e.target.value)}
                                            placeholder="Longitud"
                                            step="any"
                                            className="form-input"
                                        />
                                    </div>
                                    <p className="form-hint">
                                        Opcional: Ingresa coordenadas manualmente para sobreescribir las búsquedas automáticas
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <LocationSearch
                                label="Ubicación"
                                value={location}
                                onChange={setLocation}
                                placeholder="Lugar, hotel, restaurante..."
                            />
                            
                            {/* Coordenadas manuales para ubicación simple */}
                            <div className="form-group">
                                <label className="form-label">Coordenadas (Lat, Lng)</label>
                                <div className="form-row">
                                    <input
                                        type="number"
                                        value={manualLat}
                                        onChange={e => setManualLat(e.target.value)}
                                        placeholder="Latitud"
                                        step="any"
                                        className="form-input"
                                    />
                                    <input
                                        type="number"
                                        value={manualLng}
                                        onChange={e => setManualLng(e.target.value)}
                                        placeholder="Longitud"
                                        step="any"
                                        className="form-input"
                                    />
                                </div>
                                <p className="form-hint">
                                    Opcional: Ingresa coordenadas manualmente para sobreescribir las búsquedas automáticas
                                </p>
                            </div>
                        </>
                    )}

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

                    {/* Airbnb URL */}
                    {type === 'Airbnb' && (
                        <div className="form-group">
                            <label className="form-label">Link de la Reserva Airbnb</label>
                            <input
                                type="url"
                                value={bookingUrl}
                                onChange={e => setBookingUrl(e.target.value)}
                                placeholder="https://www.airbnb.com/trips/v1/..."
                                className="form-input"
                            />
                            <p className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--muted-dark)', marginTop: '0.25rem' }}>
                                Pega el link de los detalles de tu reserva para tenerlo a mano.
                            </p>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="cta-button">
                            {loading ? 'Guardando...' : (itemToEdit ? 'Guardar Cambios' : 'Añadir Ítem')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
