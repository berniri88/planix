import { AlertModal, ConfirmModal, PromptModal, useModals } from './Modal'

/**
 * Componente global que renderiza todos los modales de la aplicación.
 * Debe ser incluido en el componente principal App.tsx
 */
export default function GlobalModals() {
    const { alertModal, confirmModal, promptModal } = useModals()

    return (
        <>
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => {}}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => {}}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                type={confirmModal.type}
            />
            
            <PromptModal
                isOpen={promptModal.isOpen}
                onClose={() => {}}
                onSubmit={promptModal.onSubmit}
                title={promptModal.title}
                message={promptModal.message}
                placeholder={promptModal.placeholder}
                defaultValue={promptModal.defaultValue}
            />
        </>
    )
}
