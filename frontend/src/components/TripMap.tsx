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

    // Filtrar puntos válidos (marcadores)
    // Incluimos tanto el inicio como el fin si existen
    const markers: Array<{ lat: number, lng: number, title: string, item: ItineraryItem, isEnd?: boolean }> = []

    sortedItems.forEach(i => {
        if (i.location?.lat !== undefined && i.location?.lng !== undefined) {
            markers.push({ lat: i.location.lat, lng: i.location.lng, title: i.title, item: i })
        }
        if (i.end_location?.lat !== undefined && i.end_location?.lng !== undefined) {
            markers.push({ lat: i.end_location.lat, lng: i.end_location.lng, title: `${i.title} (Fin)`, item: i, isEnd: true })
        }
    })

    if (markers.length === 0) {
        return (
            <div className="map-placeholder glass-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ opacity: 0.7 }}>📍 No hay ubicaciones con coordenadas.</p>
                    <small style={{ opacity: 0.5 }}>Añade coordenadas (lat/lng) manualmente en la DB para probar.</small>
                </div>
            </div>
        )
    }

    const centerLat = markers[0].lat
    const centerLng = markers[0].lng

    // Generar líneas de recorrido
    const routes: Array<{ points: [number, number][], color: string, id: string }> = []

    sortedItems.forEach((item, index) => {
        // Caso 1: El ítem tiene origen y destino propios
        if (item.location?.lat && item.location?.lng && item.end_location?.lat && item.end_location?.lng) {
            routes.push({
                points: [
                    [item.location.lat, item.location.lng],
                    [item.end_location.lat, item.end_location.lng]
                ],
                color: item.type === 'Flight' ? '#6366f1' : '#10b981',
                id: `${item.id}-internal`
            })
        }

        // Caso 2: Conexión entre ítems (si el ítem anterior terminó en algún lugar y este empieza en otro)
        // O simplemente conectar puntos cronológicamente si es transporte
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
                    color: 'rgba(255, 255, 255, 0.2)', // Conexión sutil entre diferentes ítems
                    id: `${item.id}-conn`
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
                {markers.map((m, idx) => (
                    <Marker
                        key={`${m.item.id}-${idx}`}
                        position={[m.lat, m.lng]}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent={false}>
                            <div style={{ padding: '2px' }}>
                                <strong>{m.title}</strong>
                                <br />
                                <span style={{ fontSize: '0.8em' }}>{m.item.type}</span>
                            </div>
                        </Tooltip>
                        <Popup>
                            <div className="map-popup-content">
                                <h4 style={{ margin: '0 0 4px 0' }}>{m.title}</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>{m.item.description}</p>
                                <div style={{ fontSize: '0.85em' }}>
                                    {m.item.start_time && <div>🕒 Inicio: {new Date(m.item.start_time).toLocaleString()}</div>}
                                    {m.item.location?.name && <div>📍 Origen: {m.item.location.name}</div>}
                                    {m.item.end_location?.name && <div>🏁 Destino: {m.item.end_location.name}</div>}
                                    {m.item.cost && <div>💰 {m.item.cost} {m.item.currency}</div>}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
