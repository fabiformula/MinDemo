import Link from "next/link"
import { Globe, HeartPulse, Wind, Headphones, ArrowRight, Waves, Activity } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-mind-bg)]">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-mind-cyan)]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[var(--color-mind-coral)]/5 blur-[100px] pointer-events-none" />

        {/* Breathing circle */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full border-2 border-[var(--color-mind-cyan)]/30 flex items-center justify-center animate-breath-pulse">
            <Waves className="w-12 h-12 text-[var(--color-mind-cyan)]" />
          </div>
          <div className="absolute -inset-4 rounded-full border border-[var(--color-mind-coral)]/15 animate-breath" />
          <div className="absolute -inset-8 rounded-full border border-[var(--color-mind-cyan)]/8 animate-breath" style={{ animationDelay: "1s" }} />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          <span className="text-[var(--color-mind-cyan)]">Min</span>Deploy
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-lg mb-2">
          Biometría inteligente, sin wearables
        </p>
        <p className="text-sm text-muted-foreground/60 max-w-md mb-10">
          Medimos tu pulso cardíaco y respiración usando solo la cámara y el micrófono de tu celular.
          Meditación guiada, detección de sueños lúcidos, y conexión global.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/ppg"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-[var(--color-mind-cyan)] text-[var(--color-mind-bg)] font-semibold hover:opacity-90 transition-all hover:scale-105"
          >
            Probar Demo <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/discovery"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-border hover:bg-secondary/50 transition-all font-medium"
          >
            Discovery Global
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-12">Módulos del MVP</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PPG */}
            <Link href="/ppg" className="bg-card rounded-xl border p-6 hover:border-[var(--color-mind-cyan)]/30 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-mind-cyan)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-6 h-6 text-[var(--color-mind-cyan)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Monitor PPG</h3>
              <p className="text-sm text-muted-foreground">
                Detectá tu pulso cardíaco con la cámara del celular. Fotopletismografía en tiempo real.
              </p>
            </Link>

            {/* Breathing */}
            <Link href="/breathing" className="bg-card rounded-xl border p-6 hover:border-emerald-400/30 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-emerald-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wind className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Respiración</h3>
              <p className="text-sm text-muted-foreground">
                Monitoreá tu respiración por micrófono. Modos de meditación y sueños lúcidos.
              </p>
            </Link>

            {/* Meditation */}
            <Link href="/meditation" className="bg-card rounded-xl border p-6 hover:border-purple-400/30 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-purple-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Meditación</h3>
              <p className="text-sm text-muted-foreground">
                Audio de meditación on demand. Relajación, concentración y sueño.
              </p>
            </Link>

            {/* Discovery */}
            <Link href="/discovery" className="bg-card rounded-xl border p-6 hover:border-[var(--color-mind-coral)]/30 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-mind-coral)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-[var(--color-mind-coral)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Encontrá personas que respiran como vos en un mapa mundial interactivo.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-10">¿Cómo funciona?</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-mind-cyan)]/10 flex items-center justify-center mx-auto text-[var(--color-mind-cyan)] font-bold">1</div>
              <p className="text-sm text-muted-foreground">Cubrí la cámara trasera con el dedo para medir tu pulso (PPG)</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-mind-cyan)]/10 flex items-center justify-center mx-auto text-[var(--color-mind-cyan)] font-bold">2</div>
              <p className="text-sm text-muted-foreground">El micrófono capta tu respiración y también puede estimar el ritmo cardíaco</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-mind-cyan)]/10 flex items-center justify-center mx-auto text-[var(--color-mind-cyan)] font-bold">3</div>
              <p className="text-sm text-muted-foreground">Usá los datos para meditar, explorar sueños lúcidos o conectar con otros</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-border/50 text-xs text-muted-foreground">
        <span className="text-[var(--color-mind-cyan)]">Min</span>Deploy &copy; {new Date().getFullYear()} — Biometría inteligente, sin wearables
      </footer>
    </div>
  )
}
