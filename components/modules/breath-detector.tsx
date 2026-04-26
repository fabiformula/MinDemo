"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { PPGMonitor } from "@/lib/biometric/ppg-monitor"
import { BreathAudioAnalyzer } from "@/lib/audio/breath-audio-analyzer"
import { Activity, Mic, Camera, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreathDetectorProps {
    duration?: number // seconds
    onComplete: (data: { heartRate: number; breathRate: number; variability: number }) => void
    onCancel?: () => void
}

export function BreathDetector({ duration = 30, onComplete, onCancel }: BreathDetectorProps) {
    const [phase, setPhase] = useState<"permissions" | "detecting" | "done">("permissions")
    const [elapsed, setElapsed] = useState(0)
    const [bpm, setBpm] = useState(0)
    const [breathRate, setBreathRate] = useState(0)
    const [signalQuality, setSignalQuality] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [coherence, setCoherence] = useState(0)

    const ppgRef = useRef<PPGMonitor | null>(null)
    const breathRef = useRef<BreathAudioAnalyzer | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const bpmHistoryRef = useRef<number[]>([])
    const brHistoryRef = useRef<number[]>([])

    const cleanup = useCallback(() => {
        if (ppgRef.current) { ppgRef.current.stop(); ppgRef.current = null }
        if (breathRef.current) { breathRef.current.stop(); breathRef.current = null }
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    useEffect(() => {
        return cleanup
    }, [cleanup])

    const startDetection = async () => {
        setError(null)
        setPhase("detecting")

        try {
            // Init PPG Monitor
            const ppg = new PPGMonitor({}, {
                onBPMUpdate: (value) => {
                    setBpm(value)
                    if (value > 0) bpmHistoryRef.current.push(value)
                },
                onSignalQuality: (q) => setSignalQuality(q),
                onHRVUpdate: (hrv) => setCoherence(Math.round(hrv.coherence)),
                onError: (err) => setError(err.message),
            })
            ppgRef.current = ppg
            await ppg.start()

            // Init Breath Audio
            const breath = new BreathAudioAnalyzer({}, {
                onBreathDetected: (data) => {
                    setBreathRate(data.rate)
                    if (data.rate > 0) brHistoryRef.current.push(data.rate)
                },
            })
            breathRef.current = breath
            await breath.start()

            // Timer
            let sec = 0
            timerRef.current = setInterval(() => {
                sec++
                setElapsed(sec)
                if (sec >= duration) {
                    cleanup()
                    setPhase("done")

                    const bpmArr = bpmHistoryRef.current
                    const brArr = brHistoryRef.current

                    const avgBpm = bpmArr.length > 0
                        ? Math.round(bpmArr.reduce((a, b) => a + b, 0) / bpmArr.length)
                        : 72 // fallback
                    const avgBr = brArr.length > 0
                        ? Math.round(brArr.reduce((a, b) => a + b, 0) / brArr.length)
                        : 15 // fallback

                    onComplete({
                        heartRate: avgBpm,
                        breathRate: avgBr,
                        variability: ppg.hrv.coherence || 50,
                    })
                }
            }, 1000)
        } catch (err) {
            const e = err as Error
            setError(e.message)
            setPhase("permissions")
        }
    }

    const progress = Math.min(100, (elapsed / duration) * 100)

    // Breathing circle animation speed based on detected breath rate
    const breathCycleDuration = breathRate > 0 ? 60 / breathRate : 4

    if (phase === "permissions") {
        return (
            <div className="flex flex-col items-center gap-6 animate-fade-in-up">
                <div className="w-24 h-24 rounded-full bg-[var(--color-mind-surface)] flex items-center justify-center animate-breath-pulse">
                    <Activity className="w-10 h-10 text-[var(--color-mind-cyan)]" />
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Descubrí tu patrón</h2>
                    <p className="text-muted-foreground max-w-md">
                        Vamos a medir tu respiración y frecuencia cardíaca durante {duration} segundos.
                        Necesitamos acceso a tu <Camera className="inline w-4 h-4" /> cámara y <Mic className="inline w-4 h-4" /> micrófono.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm bg-destructive/10 text-destructive px-4 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button size="lg" onClick={startDetection} className="px-8">
                        <Camera className="mr-2 h-4 w-4" /> Comenzar Detección
                    </Button>
                    {onCancel && (
                        <Button size="lg" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground text-center max-w-sm">
                    Colocá el dedo sobre la cámara trasera para medir el pulso.
                    El micrófono detecta tu respiración.
                </p>
            </div>
        )
    }

    if (phase === "detecting") {
        return (
            <div className="flex flex-col items-center gap-6 animate-fade-in-up">
                {/* Breathing Circle */}
                <div className="relative flex items-center justify-center">
                    <div
                        className="w-48 h-48 rounded-full border-2 border-[var(--color-mind-cyan)]/30 flex items-center justify-center"
                        style={{
                            animation: `breath-expand ${breathCycleDuration}s ease-in-out infinite`,
                            boxShadow: `0 0 40px rgba(0, 217, 255, ${signalQuality / 200})`,
                        }}
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold text-[var(--color-mind-cyan)]">
                                {bpm > 0 ? bpm : "--"}
                            </div>
                            <div className="text-xs text-muted-foreground">BPM</div>
                        </div>
                    </div>

                    {/* Outer ring */}
                    <div
                        className="absolute inset-0 rounded-full border border-[var(--color-mind-coral)]/20"
                        style={{ animation: `breath-expand ${breathCycleDuration}s ease-in-out infinite 0.5s` }}
                    />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    <div className="bg-card rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-[var(--color-mind-cyan)]">
                            {breathRate > 0 ? breathRate : "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">resp/min</div>
                    </div>
                    <div className="bg-card rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-[var(--color-mind-coral)]">
                            {signalQuality}%
                        </div>
                        <div className="text-xs text-muted-foreground">señal</div>
                    </div>
                    <div className="bg-card rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-emerald-400">
                            {coherence}%
                        </div>
                        <div className="text-xs text-muted-foreground">coherencia</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm space-y-1.5">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-mind-cyan)] to-[var(--color-mind-coral)] transition-all duration-1000 ease-linear rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{elapsed}s</span>
                        <span>{duration}s</span>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {error}
                    </p>
                )}

                {signalQuality < 20 && signalQuality > 0 && (
                    <p className="text-xs text-yellow-400/80 animate-pulse">
                        Señal débil — asegurate de cubrir bien la cámara con el dedo
                    </p>
                )}

                <Button variant="ghost" size="sm" onClick={() => { cleanup(); onCancel?.() }}>
                    Cancelar
                </Button>
            </div>
        )
    }

    return null // "done" phase — parent handles it
}
