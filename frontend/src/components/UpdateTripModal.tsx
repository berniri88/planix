import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/types'
import { useModals } from './Modal'

interface Props {
    isOpen: boolean
    onClose: () => void
    trip: Trip | null
    onTripUpdated: () => void
}

export default function UpdateTripModal({ isOpen, onClose, trip, onTripUpdated }: Props) {
    const { showAlert } = useModals()
    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (trip) {
            setName(trip.name)
            setStartDate(trip.start_date || '')
            setEndDate(trip.end_date || '')
            setImageUrl(trip.image_url || '')
        }
    }, [trip])

    if (!isOpen || !trip) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    name,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    image_url: imageUrl || null
                })
                .eq('id', trip.id)

            if (error) throw error

            onTripUpdated()
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            showAlert('Error', 'Error al actualizar el viaje: ' + message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-card">
                <h2 className="modal-title">Editar Viaje</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Nombre del Viaje</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Verano en Japón 🇯🇵"
                            className="form-input"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Imagen de Portada (URL)</label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="form-input"
                        />
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="cta-button"
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
