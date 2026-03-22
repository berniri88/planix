import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

interface Props {
    isOpen: boolean
    onClose: () => void
    onTripCreated: () => void
}

export default function CreateTripModal({ isOpen, onClose, onTripCreated }: Props) {
    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                navigate('/')
                return
            }

            const { error } = await supabase
                .from('trips')
                .insert([{
                    name,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    owner_id: user.id,
                }])

            if (error) throw error

            setName('')
            setStartDate('')
            setEndDate('')
            onClose()
            onTripCreated()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            alert('Error al crear el viaje: ' + message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-card">
                <h2 className="modal-title">Nuevo Viaje</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Nombre del Viaje</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Verano en Japón"
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
                            {loading ? 'Creando...' : 'Crear Viaje'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
