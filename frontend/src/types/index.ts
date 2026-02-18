// Tipos centrales de la aplicación Planix

export type TripStatus = 'Idea' | 'Tentative' | 'Confirmed'
export type ItemType = 'Flight' | 'Hotel' | 'Activity' | 'Restaurant' | 'Transport' | 'Idea'
export type ParticipantRole = 'Owner' | 'Editor' | 'Viewer'

export interface Trip {
    id: string
    name: string
    description?: string
    start_date?: string
    end_date?: string
    image_url?: string
    owner_id: string
    created_at: string
    updated_at: string
}

export interface ItineraryVersion {
    id: string
    trip_id: string
    name: string
    is_active: boolean
    created_at: string
    itinerary_items?: ItineraryItem[]
}

export interface Location {
    name: string
    address?: string
    lat?: number
    lng?: number
}

export interface ItineraryItem {
    id: string
    version_id: string
    type: ItemType
    status: TripStatus
    title: string
    description?: string
    start_time?: string
    end_time?: string
    location?: Location
    cost?: number
    currency?: string
    booking_reference?: string
    created_at: string
    updated_at: string
}

export interface Participant {
    id: string
    trip_id: string
    user_id: string
    role: ParticipantRole
    joined_at: string
    profile?: {
        email: string
        avatar_url?: string
    }
}

export interface ChatMessage {
    id: string
    trip_id: string
    user_id: string
    content: string
    created_at: string
    profile?: {
        email: string
        avatar_url?: string
    }
}
