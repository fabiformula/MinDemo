"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { BreathAudioAnalyzer } from "@/lib/audio/breath-audio-analyzer"
import { Wind, Play, Square, Moon, Brain, HeartPulse, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"

type BreathMode = "meditation" | "lucid"
type BreathState = "idle" | "active" | "error"

const MODE_CONFIG = {
    meditation: {
        title: "Meditación",
        subtitle: "Respiración lenta y profunda — 4-7-8",
        icon: Moon,
        color: "var(--color-mind-cyan)",
        targetRate: 6,
        guide: "Inhalá 4s → Mantené 7s → Exhalá 8s",
    },
    lucid: {
        title: "Sueños Lúcidos",
        subtitle: "Técnica MILD/WILD — consciencia del cuerpo",
        icon: Brain,
        color: "var(--color-mind-coral)",
        targetRate: 10,
        guide: "Respirá naturalmente, enfocá la atención en cada respiración",
    },
}

export default function BreathingPage() {
    const [mode, setMode] = useState<BreathMode>("meditation")
    const [state, setState] = useState<BreathState>("idle")
    const [breathRate, setBreathRate] = useState(0)
    const [amplitude, setAmplitude] = useState(0)
    const [hrEstimate, setHrEstimate] = useState(0)
    const [hrConfidence, setHrConfidence] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [elapsed, setElapsed] = useState(0)
    const [breathHistory, setBreathHistory] = useState<number[]>([])
    const [hrHistory, setHrHistory] = useState<number[]>([])

    const analyzerRef = useRef<BreathAudioAnalyzer | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const modeConfig = MODE_CONFIG[mode]

    const cleanup = useCallback(() => {
        if (analyzerRef.current) {
            analyzerRef.current.stop()
            analyzerRef.current = null
        }
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    useEffect(() => {
        return cleanup
    }, [cleanup])

    const handleStart = async () => {
        setError(null)
        setState("active")
        setBreathRate(0)
        setAmplitude(0)
        setHrEstimate(0)
        setHrConfidence(0)
        setElapsed(0)
        setBreathHistory([])
        setHrHistory([])

        try {
            const analyzer = new BreathAudioAnalyzer({}, {
                onBreathDetected: (data) => {
                    setBreathRate(data.rate)
                    setAmplitude(data.amplitude)
                    if (data.rate > 0) {
                        setBreathHistory(prev => [...prev.slice(-59), data.rate])
                    }
                },
                onHeartRateEstimate: (data) => {
                    setHrEstimate(data.bpm)
                    setHrConfidence(data.confidence)
                    if (data.bpm > 0) {
                        setHrHistory(prev => [...prev.slice(-59), data.bpm])
                    }
                },
                onError: (err) => {
                    setError(err.message)
                    setState("error")
                },
            })

            analyzerRef.current = analyzer
            await analyzer.start()

            // Timer
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1)
            }, 1000)
        } catch (err) {
            const e = err as Error
            setError(e.message)
            setState("error")
        }
    }

    const handleStop = () => {
        cleanup()
        setState("idle")
    }

    // Breathing circle animation
    const breathCycleDuration = breathRate > 0 ? 60 / breathRate : 4
    const accentColor = modeConfig.color

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, "0")}`
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Wind className="w-7 h-7 text-emerald-400" />
                <div>
                    <h1 className="text-2xl font-bold">Detección de Respiración</h1>
                    <p className="text-muted-foreground text-sm">Micrófono + estimación de ritmo cardíaco</p>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3">
                {(Object.keys(MODE_CONFIG) as BreathMode[]).map((m) => {
                    const cfg = MODE_CONFIG[m]
                    const Icon = cfg.icon
                    const active = mode === m
                    return (
                        <button
                            key={m}
                            onClick={() => { if (state === "idle") setMode(m) }}
                            className={`bg-card rounded-xl border p-4 text-left transition-all ${active
                                ? "border-[var(--color-mind-cyan)]/50 ring-1 ring-[var(--color-mind-cyan)]/20"
                                : "hover:border-border/80 opacity-60"
                                } ${state !== "idle" ? "pointer-events-none" : ""}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                <span className="font-semibold text-sm">{cfg.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{cfg.subtitle}</p>
                        </button>
                    )
                })}
            </div>

            {/* Main Display */}
            <div className="flex flex-col items-center gap-6 py-6 animate-fade-in-up">
                {/* Breathing Circle */}
                <div className="relative flex items-center justify-center">
                    <div
                        className="w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center"
                        style={{
                            borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
                            animation: state === "active"
                                ? `breath-expand ${breathCycleDuration}s ease-in-out infinite`
                                : "breath-pulse 4s ease-in-out infinite",
                            boxShadow: state === "active"
                                ? `0 0 40px color-mix(in srgb, ${accentColor} ${Math.min(50, amplitude)}%, transparent)`
                                : undefined,
                            background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 5%, transparent), transparent)`,
                        }}
                    >
                        <div className="text-4xl font-bold" style={{ color: accentColor }}>
                            {breathRate > 0 ? breathRate : "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">resp/min</div>
                        {state === "active" && (
                            <div className="text-xs text-muted-foreground mt-2">{formatTime(elapsed)}</div>
                        )}
                    </div>

                    {state === "active" && (
                        <div
                            className="absolute -inset-5 rounded-full border animate-breath"
                            style={{ borderColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
                        />
                    )}
                </div>

                {/* Guide text */}
                {state === "active" && (
                    <div className="text-center animate-fade-in-up">
                        <p className="text-sm font-medium" style={{ color: accentColor }}>{modeConfig.guide}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Objetivo: ~{modeConfig.targetRate} resp/min
                        </p>
                    </div>
                )}

                {/* Dual Metrics: Breath + Heart Rate */}
                {state === "active" && (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm animate-fade-in-up">
                        {/* Heart Rate from Audio */}
                        <div className="bg-card rounded-xl border p-4 text-center">
                            <HeartPulse className="w-5 h-5 mx-auto mb-1 text-[var(--color-mind-coral)]" />
                            <div className="text-2xl font-bold text-[var(--color-mind-coral)]">
                                {hrEstimate > 0 ? hrEstimate : "--"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">BPM (audio)</div>
                            {hrEstimate > 0 && (
                                <div className="mt-1 flex items-center justify-center gap-1">
                                    <div className="h-1 rounded-full bg-secondary w-12 overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-mind-coral)] transition-all"
                                            style={{ width: `${hrConfidence}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">{hrConfidence}%</span>
                                </div>
                            )}
                        </div>

                        {/* Amplitude / Intensity */}
                        <div className="bg-card rounded-xl border p-4 text-center">
                            <Waves className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                            <div className="text-2xl font-bold text-emerald-400">
                                {Math.round(amplitude)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Amplitud</div>
                            <div className="mt-1">
                                <div className="h-1 rounded-full bg-secondary w-12 mx-auto overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-400 transition-all"
                                        style={{ width: `${Math.min(100, amplitude)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mini Charts */}
                {breathHistory.length > 3 && (
                    <div className="w-full max-w-sm grid grid-cols-2 gap-3 animate-fade-in-up">
                        {/* Breath chart */}
                        <div className="bg-card rounded-xl border p-3">
                            <div className="text-[10px] text-muted-foreground mb-1">Respiración</div>
                            <div className="flex items-end gap-[2px] h-10">
                                {breathHistory.map((v, i) => {
                                    const min = Math.min(...breathHistory) - 2
                                    const max = Math.max(...breathHistory) + 2
                                    const h = ((v - min) / (max - min)) * 100
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-sm"
                                            style={{
                                                height: `${Math.max(4, h)}%`,
                                                background: `linear-gradient(to top, color-mix(in srgb, ${accentColor} 40%, transparent), ${accentColor})`,
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        </div>

                        {/* HR chart */}
                        {hrHistory.length > 3 && (
                            <div className="bg-card rounded-xl border p-3">
                                <div className="text-[10px] text-muted-foreground mb-1">Ritmo cardíaco</div>
                                <div className="flex items-end gap-[2px] h-10">
                                    {hrHistory.map((v, i) => {
                                        const min = Math.min(...hrHistory) - 5
                                        const max = Math.max(...hrHistory) + 5
                                        const h = ((v - min) / (max - min)) * 100
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm bg-gradient-to-t from-[var(--color-mind-coral)]/40 to-[var(--color-mind-coral)]"
                                                style={{ height: `${Math.max(4, h)}%` }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm max-w-md text-center">
                        {error}
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-3">
                    {state === "idle" || state === "error" ? (
                        <Button size="lg" onClick={handleStart} className="px-10 h-12">
                            <Play className="mr-2 h-4 w-4" /> Iniciar {modeConfig.title}
                        </Button>
                    ) : (
                        <Button size="lg" variant="destructive" onClick={handleStop}>
                            <Square className="mr-2 h-4 w-4" /> Detener
                        </Button>
                    )}
                </div>

                {/* Instructions */}
                {state === "idle" && (
                    <div className="bg-card rounded-xl border p-5 max-w-md text-center space-y-2">
                        <h3 className="font-semibold">¿Cómo funciona?</h3>
                        <p className="text-sm text-muted-foreground">
                            El micrófono detecta tu <strong>ritmo respiratorio</strong> analizando los cambios de amplitud del sonido.
                            También puede estimar tu <strong>ritmo cardíaco</strong> si el micrófono capta los sonidos del cuerpo.
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Para mejor detección de HR, acercá el celular al pecho. Funciona mejor en ambientes silenciosos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
