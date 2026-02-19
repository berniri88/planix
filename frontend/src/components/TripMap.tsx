import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ItineraryItem } from '@/types'
import L from 'leaflet'

// Fix default icon issue with Leaflet + Vite
import iconMarker from 'leaflet/dist/images/marker-icon.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface Props {
    items: ItineraryItem[]
}

const TRANSPORT_TYPES = ['Flight', 'Transport', 'Bus', 'Train'] // Ajustar según ItemType

export default function TripMap({ items }: Props) {
    // Ordenar ítems cronológicamente
    const sortedItems = [...items].sort((a, b) => {
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })

    // Filtrar puntos válidos
    const validMarkers = sortedItems.filter(
        i => i.location?.lat !== undefined && i.location?.lng !== undefined
    )

    if (validMarkers.length === 0) {
        return (
            <div className="map-placeholder glass-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ opacity: 0.7 }}>📍 No hay ubicaciones con coordenadas.</p>
                    <small style={{ opacity: 0.5 }}>Añade coordenadas (lat/lng) manualmente en la DB para probar.</small>
                </div>
            </div>
        )
    }

    const centerLat = validMarkers[0].location!.lat!
    const centerLng = validMarkers[0].location!.lng!

    // Generar líneas de recorrido
    // Regla: si un ítem es transporte, dibujamos línea desde el ítem anterior (si tiene coords)
    const routes: Array<{ points: [number, number][], color: string, id: string }> = []

    sortedItems.forEach((item, index) => {
        if (TRANSPORT_TYPES.includes(item.type) && item.location?.lat && item.location?.lng) {
            // Buscar el punto anterior con coordenadas
            let prevPoint = null
            for (let i = index - 1; i >= 0; i--) {
                if (sortedItems[i].location?.lat && sortedItems[i].location?.lng) {
                    prevPoint = sortedItems[i].location
                    break
                }
            }

            if (prevPoint) {
                routes.push({
                    points: [
                        [prevPoint.lat!, prevPoint.lng!],
                        [item.location.lat!, item.location.lng!]
                    ],
                    color: item.type === 'Flight' ? '#6366f1' : '#10b981',
                    id: item.id
                })
            }
        }
    })

    return (
        <div className="trip-map-container glass-card" style={{ height: '450px', width: '100%', margin: '1.5rem 0', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <MapContainer center={[centerLat, centerLng]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Líneas de recorrido */}
                {routes.map(route => (
                    <Polyline
                        key={route.id}
                        positions={route.points}
                        pathOptions={{
                            color: route.color,
                            weight: 4,
                            dashArray: route.color === '#6366f1' ? '10, 10' : undefined,
                            opacity: 0.8
                        }}
                    />
                ))}

                {/* Marcadores con Tooltips y Popups */}
                {validMarkers.map(item => (
                    <Marker
                        key={item.id}
                        position={[item.location!.lat!, item.location!.lng!]}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent={false}>
                            <div style={{ padding: '2px' }}>
                                <strong>{item.title}</strong>
                                <br />
                                <span style={{ fontSize: '0.8em' }}>{item.type}</span>
                            </div>
                        </Tooltip>
                        <Popup>
                            <div className="map-popup-content">
                                <h4 style={{ margin: '0 0 4px 0' }}>{item.title}</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>{item.description}</p>
                                <div style={{ fontSize: '0.85em' }}>
                                    {item.start_time && <div>🕒 Inicio: {new Date(item.start_time).toLocaleString()}</div>}
                                    {item.location?.name && <div>📍 {item.location.name}</div>}
                                    {item.cost && <div>💰 {item.cost} {item.currency}</div>}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
