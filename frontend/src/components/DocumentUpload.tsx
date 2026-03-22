import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useModals } from './Modal'

interface Props {
    tripId: string
    itemId: string
    onUploadSuccess: () => void
}

export default function DocumentUpload({ tripId, itemId, onUploadSuccess }: Props) {
    const { showAlert } = useModals()
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // El path debe coincidir con la política RLS: trips/{trip_id}/{item_id}/{filename}
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `trips/${tripId}/${itemId}/${fileName}`

            // 1. Subir al Storage
            const { error: uploadError } = await supabase.storage
                .from('planix-documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Obtener URL pública (o firmada si es privado, aquí usaremos pública por simplicidad si el bucket lo permite, 
            // pero siendo privado usaremos getPublicUrl para obtener la base o guardaremos el path)
            const { data: { publicUrl } } = supabase.storage
                .from('planix-documents')
                .getPublicUrl(filePath)

            // 3. Registrar en la tabla de documentos
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    item_id: itemId,
                    name: file.name,
                    file_url: publicUrl,
                    file_type: file.type
                })

            if (dbError) throw dbError

            onUploadSuccess()
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            showAlert('Error', 'Error al subir documento: ' + message, 'error')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="document-upload">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-ghost btn-ghost--sm"
            >
                {uploading ? 'Subiendo...' : '📎 Adjuntar Archivo'}
            </button>
        </div>
    )
}
