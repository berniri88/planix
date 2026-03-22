import React from 'react'
import { X } from 'lucide-react'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
}

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger'
}

interface PromptModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (value: string) => void
    title: string
    message: string
    placeholder?: string
    defaultValue?: string
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
    if (!isOpen) return null

    const typeStyles = {
        info: 'border-blue-200 bg-blue-50',
        warning: 'border-yellow-200 bg-yellow-50',
        error: 'border-red-200 bg-red-50',
        success: 'border-green-200 bg-green-50'
    }

    return (
        <div className="modal-overlay">
            <div className={`modal-card modal-card--sm ${typeStyles[type]}`}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="btn-close">
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="cta-button">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    )
}

export function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar',
    type = 'warning' 
}: ConfirmModalProps) {
    if (!isOpen) return null

    const typeStyles = {
        warning: 'border-yellow-200 bg-yellow-50',
        danger: 'border-red-200 bg-red-50'
    }

    const confirmButtonClass = type === 'danger' ? 'btn-danger' : 'cta-button'

    return (
        <div className="modal-overlay">
            <div className={`modal-card modal-card--sm ${typeStyles[type]}`}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="btn-close">
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-ghost">
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={confirmButtonClass}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function PromptModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    title, 
    message, 
    placeholder = '',
    defaultValue = ''
}: PromptModalProps) {
    const [value, setValue] = React.useState(defaultValue)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(value)
        setValue('')
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-card modal-card--sm">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="btn-close">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p>{message}</p>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="form-input"
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancelar
                        </button>
                        <button type="submit" className="cta-button">
                            Aceptar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Hook personalizado para manejar modales
export function useModals() {
    const [alertModal, setAlertModal] = React.useState<{
        isOpen: boolean
        title: string
        message: string
        type?: 'info' | 'warning' | 'error' | 'success'
    }>({ isOpen: false, title: '', message: '' })

    const [confirmModal, setConfirmModal] = React.useState<{
        isOpen: boolean
        title: string
        message: string
        onConfirm: () => void
        confirmText?: string
        cancelText?: string
        type?: 'warning' | 'danger'
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

    const [promptModal, setPromptModal] = React.useState<{
        isOpen: boolean
        title: string
        message: string
        onSubmit: (value: string) => void
        placeholder?: string
        defaultValue?: string
    }>({ isOpen: false, title: '', message: '', onSubmit: () => {} })

    const showAlert = (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type,
        })
    }

    const showConfirm = (title: string, message: string, onConfirm: () => void, type?: 'warning' | 'danger') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type,
        })
    }

    const showPrompt = (title: string, message: string, onSubmit: (value: string) => void, placeholder?: string, defaultValue?: string) => {
        setPromptModal({
            isOpen: true,
            title,
            message,
            onSubmit,
            placeholder,
            defaultValue,
        })
    }

    const closeAll = () => {
        setAlertModal(prev => ({ ...prev, isOpen: false }))
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        setPromptModal(prev => ({ ...prev, isOpen: false }))
    }

    return {
        alertModal,
        confirmModal,
        promptModal,
        showAlert,
        showConfirm,
        showPrompt,
        closeAlert: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
        closeConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        closePrompt: () => setPromptModal(prev => ({ ...prev, isOpen: false })),
        closeAll
    }
}
