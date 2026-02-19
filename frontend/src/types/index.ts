// Tipos centrales de la aplicación Planix

export type TripStatus = 'Idea' | 'Tentative' | 'Confirmed'
export type ItemType = 'Flight' | 'Hotel' | 'Activity' | 'Restaurant' | 'Transport' | 'Idea' | 'Bus' | 'Train' | 'Taxi'
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

export interface Document {
    id: string
    item_id: string
    name: string
    file_url: string
    file_type?: string
    created_at: string
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
    end_location?: Location
    cost?: number
    currency?: string
    booking_reference?: string
    documents?: Document[]
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

export type InboxStatus = 'Pending' | 'Accepted' | 'Rejected'

export interface InboxItem {
    id: string
    user_id: string
    type: ItemType
    status: InboxStatus
    title: string
    description?: string
    start_time?: string
    end_time?: string
    location?: Location
    end_location?: Location
    cost?: number
    currency?: string
    booking_reference?: string
    raw_content?: string
    created_at: string
}
