import Hero from '@/components/Hero'
import LoginButton from '@/components/LoginButton'

export default function Landing() {
    return (
        <main className="landing-layout">
            <nav>
                <div className="logo">PLANIX</div>
                <div className="landing-nav-links">
                    <a href="#features" className="landing-nav-link">Características</a>
                    <a href="#about" className="landing-nav-link">Nosotros</a>
                    <LoginButton />
                </div>
            </nav>

            <Hero />

            <footer className="landing-footer">
                © 2026 Planix. Hecho para el viajero moderno.
            </footer>
        </main>
    )
}
