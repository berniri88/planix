import { useState, useEffect, useRef } from 'react'
import type { Location } from '@/types'

interface Props {
    label: string
    value: Location | null
    onChange: (location: Location) => void
    placeholder?: string
}

export default function LocationSearch({ label, value, onChange, placeholder }: Props) {
    const [query, setQuery] = useState(value?.name || '')
    const [results, setResults] = useState<any[]>([])
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setQuery(value?.name || '')
    }, [value])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const searchPlaces = async (val: string) => {
        if (val.length < 3) {
            setResults([])
            return
        }
        setLoading(true)
        try {
            // Usando Photon (OpenStreetMap based) - Gratis y sin API Key
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5`)
            const data = await res.json()
            setResults(data.features || [])
            setShowResults(true)
        } catch (err) {
            console.error('Error searching places:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (feature: any) => {
        const { properties, geometry } = feature
        const newLocation: Location = {
            name: properties.name || properties.city || properties.street || query,
            address: [properties.street, properties.city, properties.country].filter(Boolean).join(', '),
            lat: geometry.coordinates[1],
            lng: geometry.coordinates[0]
        }
        setQuery(newLocation.name)
        onChange(newLocation)
        setShowResults(false)
    }

    return (
        <div className="form-group location-search" ref={wrapperRef}>
            <label className="form-label">{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        searchPlaces(e.target.value)
                    }}
                    onFocus={() => query.length >= 3 && setShowResults(true)}
                    placeholder={placeholder || "Buscar lugar..."}
                    className="form-input"
                />
                {loading && <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8em', opacity: 0.5 }}>⏳</div>}
            </div>

            {showResults && results.length > 0 && (
                <div className="location-results">
                    {results.map((res, i) => (
                        <div
                            key={i}
                            className="location-result-item"
                            onClick={() => handleSelect(res)}
                        >
                            <div className="location-result-name">{res.properties.name}</div>
                            <div className="location-result-address">
                                {[res.properties.city, res.properties.state, res.properties.country].filter(Boolean).join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
