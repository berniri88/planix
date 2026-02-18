import { supabase } from '@/lib/supabase'

export default function LoginButton() {
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Error al iniciar sesión:', error.message)
            alert('Hubo un problema al conectar con Google.')
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
