const FEATURES = [
    {
        title: 'Sueño & Plan',
        desc: 'Captura ideas de redes sociales y crea versiones flexibles de tu itinerario.',
    },
    {
        title: 'Colaboración Real',
        desc: 'Edita junto a tus amigos en tiempo real. Chat integrado y votos.',
    },
    {
        title: 'Adaptación AI',
        desc: '¿Vuelo cancelado? Recibe sugerencias logísticas automáticas al instante.',
    },
]

export default function Hero() {
    return (
        <section className="glass-card" id="features">
            <h1 className="hero-title">
                Tu próximo viaje,<br />
                más allá de la organización.
            </h1>
            <p className="hero-subtitle">
                De la inspiración a la ejecución. Planifica versiones, colabora con amigos y adáptate
                a lo inesperado con la plataforma de viajes más inteligente del mundo.
            </p>

            <div className="hero-cta-group">
                <button className="cta-button">
                    Comenzar Planificación
                    <span>→</span>
                </button>
                <button className="btn-outline">
                    Ver demo
                </button>
            </div>

            <div className="hero-features">
                {FEATURES.map((item) => (
                    <div key={item.title} className="feature-card">
                        <h3 className="feature-card__title">{item.title}</h3>
                        <p className="feature-card__desc">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
