"use client"

import { useState } from "react"
import { BreathDetector } from "@/components/modules/breath-detector"
import { DiscoveryMap } from "@/components/modules/discovery-map"
import type { BreathPattern } from "@/lib/types/breath-pattern"
import { Globe, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type DiscoveryPhase = "idle" | "detecting" | "exploring"

export default function DiscoveryPage() {
    const [phase, setPhase] = useState<DiscoveryPhase>("idle")
    const [myPattern, setMyPattern] = useState<BreathPattern | null>(null)

    const handleDetectionComplete = (data: { heartRate: number; breathRate: number; variability: number }) => {
        const pattern: BreathPattern = {
            heartRate: data.heartRate,
            breathRate: data.breathRate,
            variability: data.variability,
        }
        setMyPattern(pattern)
        setPhase("exploring")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Globe className="w-7 h-7 text-[var(--color-mind-cyan)]" />
                <div>
                    <h1 className="text-2xl font-bold">Discovery</h1>
                    <p className="text-muted-foreground text-sm">¿Quién respira como vos en el mundo?</p>
                </div>
            </div>

            {/* Content based on phase */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center py-16 gap-8 animate-fade-in-up">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-mind-cyan)]/20 to-[var(--color-mind-coral)]/20 flex items-center justify-center animate-breath-pulse">
                            <Globe className="w-14 h-14 text-[var(--color-mind-cyan)]" />
                        </div>
                        <div className="absolute -inset-4 rounded-full border border-[var(--color-mind-cyan)]/10 animate-breath" />
                    </div>

                    <div className="text-center space-y-3 max-w-md">
                        <h2 className="text-xl font-semibold">Descubrí tu patrón respiratorio</h2>
                        <p className="text-muted-foreground">
                            Medimos tu respiración y frecuencia cardíaca durante 30 segundos,
                            luego te mostramos quién en el mundo respira de forma similar.
                        </p>
                    </div>

                    <Button size="lg" className="px-10 h-12" onClick={() => setPhase("detecting")}>
                        Empezar Discovery
                    </Button>
                </div>
            )}

            {phase === "detecting" && (
                <div className="py-8">
                    <BreathDetector
                        duration={30}
                        onComplete={handleDetectionComplete}
                        onCancel={() => setPhase("idle")}
                    />
                </div>
            )}

            {phase === "exploring" && myPattern && (
                <div className="space-y-4">
                    {/* My pattern summary */}
                    <div className="bg-card rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-mind-cyan)]">{myPattern.heartRate}</div>
                                    <div className="text-xs text-muted-foreground">BPM</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-mind-coral)]">{myPattern.breathRate}</div>
                                    <div className="text-xs text-muted-foreground">resp/min</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-400">{Math.round(myPattern.variability)}%</div>
                                    <div className="text-xs text-muted-foreground">coherencia</div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setPhase("detecting")}>
                                <ArrowLeft className="w-3 h-3 mr-1" /> Repetir
                            </Button>
                        </div>
                    </div>

                    <DiscoveryMap myPattern={myPattern} />
                </div>
            )}
        </div>
    )
}
