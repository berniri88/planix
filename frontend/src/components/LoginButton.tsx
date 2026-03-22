import { supabase } from '@/lib/supabase'
import { useModals } from './Modal'

export default function LoginButton() {
    const { showAlert } = useModals()
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Error al iniciar sesión:', error.message)
            showAlert('Error', 'Hubo un problema al conectar con Google.', 'error')
        }
    }

    return (
        <button
            onClick={handleLogin}
            className="cta-button cta-button--sm"
        >
            Iniciar con Google
        </button>
    )
}
