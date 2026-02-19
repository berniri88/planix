import type { ItineraryItem, TripStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import DocumentUpload from './DocumentUpload'

interface Props {
    item: ItineraryItem
    tripId: string
    canEdit: boolean
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: TripStatus) => void
    onRefresh: () => void
    typeIcon: string
    statusColor: string
}

const STATUS_LABELS: Record<TripStatus, string> = {
    Idea: 'Idea',
    Tentative: 'Tentativo',
    Confirmed: 'Confirmado',
}

const STATUS_CYCLE: Record<TripStatus, TripStatus> = {
    Idea: 'Tentative',
    Tentative: 'Confirmed',
    Confirmed: 'Idea',
}

const formatDate = (dt?: string): string | null => {
    if (!dt) return null
    return new Date(dt).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ItineraryItemCard({
    item,
    tripId,
    canEdit,
    onDelete,
    onStatusChange,
    onRefresh,
    typeIcon,
    statusColor
}: Props) {

    const handleDeleteDocument = async (docId: string, fileUrl: string) => {
        if (!window.confirm('¿Eliminar este documento?')) return

        try {
            const path = fileUrl.split('planix-documents/').pop()
            if (path) {
                await supabase.storage.from('planix-documents').remove([path])
            }
            await supabase.from('documents').delete().eq('id', docId)
            onRefresh()
        } catch (err) {
            alert('Error al eliminar documento')
        }
    }
    return (
        <div
            className="item-card"
            style={{ borderLeftColor: statusColor }}
        >
            {/* Icono */}
            <div className="item-card__icon">{typeIcon}</div>

            {/* Contenido */}
            <div className="item-card__body">
                <div className="item-card__header">
                    <h3 className="item-card__title">{item.title}</h3>
                    <div className="item-card__actions">
                        {canEdit ? (
                            <button
                                onClick={() => onStatusChange(item.id, STATUS_CYCLE[item.status])}
                                title="Clic para cambiar estado"
                                className="status-badge status-badge--btn"
                                style={{ borderColor: statusColor, color: statusColor, backgroundColor: `${statusColor}20` }}
                            >
                                {STATUS_LABELS[item.status]}
                            </button>
                        ) : (
                            <span
                                className="status-badge"
                                style={{ borderColor: statusColor, color: statusColor }}
                            >
                                {STATUS_LABELS[item.status]}
                            </span>
                        )}
                        {canEdit && (
                            <button
                                onClick={() => onDelete(item.id)}
                                title="Eliminar ítem"
                                className="btn-delete"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {item.description && (
                    <p className="item-card__description">{item.description}</p>
                )}

                <div className="item-card__meta">
                    {item.start_time && (
                        <span className="item-card__meta-item">
                            🕐 {formatDate(item.start_time)}
                            {item.end_time && ` → ${formatDate(item.end_time)}`}
                        </span>
                    )}
                    {item.location?.name && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="item-card__meta-item item-card__meta-item--link"
                        >
                            📍 {item.location.name}
                        </a>
                    )}
                    {item.cost && (
                        <span className="item-card__meta-item item-card__meta-item--cost">
                            💰 {item.cost.toLocaleString()} {item.currency}
                        </span>
                    )}
                    {item.booking_reference && (
                        <span className="item-card__meta-item">
                            🎫 Ref: <code className="booking-ref">{item.booking_reference}</code>
                        </span>
                    )}
                </div>

                <div className="item-card__footer-actions">
                    {item.documents && item.documents.length > 0 && (
                        <div className="item-card__documents">
                            {item.documents.map(doc => (
                                <div key={doc.id} className="doc-chip">
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="doc-link"
                                    >
                                        📄 {doc.name}
                                    </a>
                                    {canEdit && (
                                        <button
                                            onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                                            className="doc-delete"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {canEdit && (
                        <DocumentUpload
                            tripId={tripId}
                            itemId={item.id}
                            onUploadSuccess={onRefresh}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
