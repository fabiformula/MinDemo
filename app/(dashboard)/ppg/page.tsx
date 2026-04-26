"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PPGMonitor } from "@/lib/biometric/ppg-monitor"
import type { HRVData } from "@/lib/types/breath-pattern"
import { HeartPulse, Play, Square, RotateCcw, Signal, Activity, Zap, Fingerprint, ShieldAlert, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type MonitorState = "idle" | "starting" | "calibrating" | "monitoring" | "error"

async function checkCameraPermission(): Promise<PermissionState | "unknown"> {
    try {
        if (!navigator.permissions) return "unknown"
        const result = await navigator.permissions.query({ name: "camera" as PermissionName })
        return result.state
    } catch {
        return "unknown"
    }
}

function friendlyError(raw: string): { title: string; hint: string } {
    const lower = raw.toLowerCase()
    if (lower.includes("notallowed") || lower.includes("permission") || lower.includes("denegado")) {
        return {
            title: "Permiso de cámara denegado",
            hint: "Tocá el ícono de candado en la barra de direcciones del navegador → Permisos → Cámara → Permitir. Luego recargá la página.",
        }
    }
    if (lower.includes("notfound")) {
        return {
            title: "No se detectó cámara trasera",
            hint: "Este módulo requiere la cámara trasera del celular.",
        }
    }
    if (lower.includes("notreadable") || lower.includes("en uso")) {
        return {
            title: "La cámara está en uso",
            hint: "Otra app o pestaña está usando la cámara. Cerrala y volvé a intentarlo.",
        }
    }
    return { title: "Error al iniciar cámara", hint: raw }
}

const CALIBRATION_BEATS_NEEDED = 5

export default function PPGPage() {
    const [state, setState] = useState<MonitorState>("idle")
    const [bpm, setBpm] = useState(0)
    const [signalQuality, setSignalQuality] = useState(0)
    const [hrv, setHrv] = useState<HRVData>({ rmssd: 0, sdnn: 0, pnn50: 0, coherence: 0 })
    const [beatCount, setBeatCount] = useState(0)
    const [calibrationProgress, setCalibrationProgress] = useState(0) // 0-100
    const [error, setError] = useState<{ title: string; hint: string } | null>(null)
    const [bpmHistory, setBpmHistory] = useState<number[]>([])
    const [fingerOn, setFingerOn] = useState(false)
    const [permStatus, setPermStatus] = useState<PermissionState | "unknown">("unknown")

    const ppgRef = useRef<PPGMonitor | null>(null)
    const beatsForCalibration = useRef(0)

    useEffect(() => {
        checkCameraPermission().then(setPermStatus)
    }, [])

    const cleanup = useCallback(() => {
        if (ppgRef.current) { ppgRef.current.stop(); ppgRef.current = null }
        beatsForCalibration.current = 0
    }, [])

    useEffect(() => { return cleanup }, [cleanup])

    const handleStart = async () => {
        setError(null)
        setState("starting")
        setBpm(0)
        setSignalQuality(0)
        setBeatCount(0)
        setCalibrationProgress(0)
        setBpmHistory([])
        setFingerOn(false)
        setHrv({ rmssd: 0, sdnn: 0, pnn50: 0, coherence: 0 })
        beatsForCalibration.current = 0

        try {
            const ppg = new PPGMonitor({}, {
                onBPMUpdate: (value) => {
                    setBpm(value)
                    if (value > 0) setBpmHistory(prev => [...prev.slice(-59), value])
                },
                onSignalQuality: setSignalQuality,
                onHRVUpdate: setHrv,
                onBeat: (data) => {
                    setBeatCount(data.beatNumber)
                    // Track calibration progress independently
                    beatsForCalibration.current = Math.min(beatsForCalibration.current + 1, CALIBRATION_BEATS_NEEDED)
                    setCalibrationProgress(Math.round((beatsForCalibration.current / CALIBRATION_BEATS_NEEDED) * 100))
                },
                onCalibrated: () => setState("monitoring"),
                onStateChange: (s) => {
                    if (s.to === "CALIBRATING") setState("calibrating")
                    else if (s.to === "ERROR") setState("error")
                },
                onError: (err) => {
                    setError(friendlyError(err.message))
                    setState("error")
                    checkCameraPermission().then(setPermStatus)
                },
                onFingerDetected: (detected) => {
                    setFingerOn(detected)
                    if (!detected) {
                        // Reset calibration progress if finger is removed
                        beatsForCalibration.current = 0
                        setCalibrationProgress(0)
                    }
                },
            })

            ppgRef.current = ppg
            await ppg.start()
            checkCameraPermission().then(setPermStatus)
        } catch (err) {
            setError(friendlyError((err as Error).message))
            setState("error")
            checkCameraPermission().then(setPermStatus)
        }
    }

    const handleStop = () => { cleanup(); setState("idle"); setFingerOn(false) }
    const handleRecalibrate = () => {
        if (ppgRef.current) {
            ppgRef.current.recalibrate()
            beatsForCalibration.current = 0
            setCalibrationProgress(0)
            setState("calibrating")
        }
    }

    const signalColor = signalQuality > 60 ? "text-emerald-400" : signalQuality > 30 ? "text-yellow-400" : "text-red-400"
    const pulseSpeed = bpm > 0 ? 60 / bpm : 1
    const isActive = state === "calibrating" || state === "monitoring" || state === "starting"

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <HeartPulse className="w-7 h-7 text-[var(--color-mind-cyan)]" />
                <div>
                    <h1 className="text-2xl font-bold">Monitor PPG</h1>
                    <p className="text-muted-foreground text-sm">Detectá tu pulso con la cámara del celular</p>
                </div>
            </div>

            {/* Permission denied — proactive warning */}
            {permStatus === "denied" && state === "idle" && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-xl text-sm">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-semibold">Permiso de cámara bloqueado</p>
                        <p className="text-red-300/80">
                            Tocá el ícono de candado 🔒 en la barra del navegador → Permisos → Cámara → Permitir. Luego recargá la página.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center gap-6 py-6">

                {/* ── STEP: STARTING ── */}
                {state === "starting" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-16 h-16 border-4 border-[var(--color-mind-cyan)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Iniciando cámara...</p>
                        <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
                            El navegador te va a pedir permiso para usar la cámara. <strong>Aceptalo.</strong>
                        </p>
                    </div>
                )}

                {/* ── STEP: CALIBRATING ── */}
                {state === "calibrating" && (
                    <div className="w-full max-w-sm space-y-6">

                        {/* Finger placement guide */}
                        {!fingerOn ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 text-center space-y-3">
                                <Fingerprint className="w-10 h-10 text-yellow-400 mx-auto" />
                                <p className="font-semibold text-yellow-300">Colocá el dedo sobre la cámara</p>
                                <p className="text-sm text-muted-foreground">
                                    Poné tu dedo <strong>índice</strong> sobre la cámara trasera cubriendo también el flash LED.
                                    Hacé una leve presión.
                                </p>
                                <div className="text-xs text-muted-foreground/60 bg-black/20 rounded-lg p-2">
                                    💡 El flash se prende — es normal, ilumina el dedo para leer el pulso
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[var(--color-mind-cyan)]/10 border border-[var(--color-mind-cyan)]/30 rounded-xl p-5 text-center space-y-4">
                                <CheckCircle2 className="w-8 h-8 text-[var(--color-mind-cyan)] mx-auto" />
                                <p className="font-semibold text-[var(--color-mind-cyan)]">¡Dedo detectado! Calibrando...</p>
                                <p className="text-sm text-muted-foreground">
                                    Quedate quieto y mantené el dedo firme sobre la cámara.
                                </p>

                                {/* Calibration progress bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Latidos detectados</span>
                                        <span>{beatsForCalibration.current} / {CALIBRATION_BEATS_NEEDED}</span>
                                    </div>
                                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${calibrationProgress}%`,
                                                backgroundColor: "var(--color-mind-cyan)",
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground/60 animate-pulse">
                                        Detectando tu ritmo cardíaco...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP: MONITORING ── */}
                {state === "monitoring" && (
                    <div className="flex flex-col items-center gap-6 w-full">

                        {/* Finger lost warning */}
                        {!fingerOn && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl text-sm text-center animate-pulse">
                                <Fingerprint className="w-5 h-5 inline mr-2" />
                                Volvé a poner el dedo sobre la cámara
                            </div>
                        )}

                        {/* BPM Circle */}
                        <div className="relative flex items-center justify-center">
                            <div
                                className="w-52 h-52 rounded-full border-2 border-[var(--color-mind-cyan)]/40 flex flex-col items-center justify-center"
                                style={{
                                    animation: bpm > 0 ? `breath-expand ${pulseSpeed}s ease-in-out infinite` : "none",
                                    boxShadow: bpm > 0 ? `0 0 40px rgba(0, 217, 255, 0.25)` : undefined,
                                    background: "radial-gradient(circle, rgba(0,217,255,0.05) 0%, transparent 70%)",
                                }}
                            >
                                <div className="text-6xl font-bold text-[var(--color-mind-cyan)]">
                                    {bpm > 0 ? bpm : "--"}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 tracking-widest uppercase">BPM</div>
                                {bpm > 0 && (
                                    <div className="text-xs text-muted-foreground/60 mt-2">
                                        {bpm < 60 ? "Bradicardia" : bpm <= 100 ? "Normal en reposo" : "Elevado"}
                                    </div>
                                )}
                            </div>

                            {/* Pulse rings */}
                            {bpm > 0 && fingerOn && (
                                <>
                                    <div className="absolute -inset-4 rounded-full border border-[var(--color-mind-cyan)]/15 animate-breath" />
                                    <div className="absolute -inset-8 rounded-full border border-[var(--color-mind-cyan)]/8 animate-breath" style={{ animationDelay: "0.4s" }} />
                                </>
                            )}
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-4 gap-3 w-full max-w-md">
                            <div className="bg-card rounded-xl border p-3 text-center">
                                <Signal className={`w-4 h-4 mx-auto mb-1 ${signalColor}`} />
                                <div className={`text-lg font-semibold ${signalColor}`}>{signalQuality}%</div>
                                <div className="text-[10px] text-muted-foreground">Señal</div>
                            </div>
                            <div className="bg-card rounded-xl border p-3 text-center">
                                <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                                <div className="text-lg font-semibold text-purple-400">{Math.round(hrv.coherence)}%</div>
                                <div className="text-[10px] text-muted-foreground">Coherencia</div>
                            </div>
                            <div className="bg-card rounded-xl border p-3 text-center">
                                <Zap className="w-4 h-4 mx-auto mb-1 text-[var(--color-mind-coral)]" />
                                <div className="text-lg font-semibold text-[var(--color-mind-coral)]">{Math.round(hrv.rmssd)}</div>
                                <div className="text-[10px] text-muted-foreground">RMSSD</div>
                            </div>
                            <div className="bg-card rounded-xl border p-3 text-center">
                                <HeartPulse className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                                <div className="text-lg font-semibold text-emerald-400">{beatCount}</div>
                                <div className="text-[10px] text-muted-foreground">Latidos</div>
                            </div>
                        </div>

                        {/* BPM mini chart */}
                        {bpmHistory.length > 3 && (
                            <div className="w-full max-w-md bg-card rounded-xl border p-4">
                                <div className="text-xs text-muted-foreground mb-2">Historial BPM</div>
                                <div className="flex items-end gap-[2px] h-16">
                                    {bpmHistory.map((v, i) => {
                                        const min = Math.min(...bpmHistory) - 5
                                        const max = Math.max(...bpmHistory) + 5
                                        const h = ((v - min) / (max - min)) * 100
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm bg-gradient-to-t from-[var(--color-mind-cyan)]/60 to-[var(--color-mind-cyan)]"
                                                style={{ height: `${Math.max(4, h)}%` }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ERROR ── */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 px-5 py-4 rounded-xl text-sm max-w-md w-full space-y-2">
                        <div className="flex items-center gap-2 text-destructive font-semibold">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            {error.title}
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{error.hint}</p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-3">
                    {state === "idle" || state === "error" ? (
                        <Button
                            size="lg"
                            onClick={handleStart}
                            className="px-10 h-12"
                            disabled={permStatus === "denied"}
                        >
                            <Play className="mr-2 h-4 w-4" /> Iniciar Monitor
                        </Button>
                    ) : (
                        <>
                            <Button size="lg" variant="destructive" onClick={handleStop}>
                                <Square className="mr-2 h-4 w-4" /> Detener
                            </Button>
                            <Button size="lg" variant="outline" onClick={handleRecalibrate}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Recalibrar
                            </Button>
                        </>
                    )}
                </div>

                {/* Instructions — only on idle */}
                {state === "idle" && (
                    <div className="bg-card rounded-xl border p-5 max-w-md text-center space-y-3">
                        <h3 className="font-semibold">¿Cómo funciona?</h3>
                        <div className="text-sm text-muted-foreground space-y-2 text-left">
                            <div className="flex items-start gap-2">
                                <span className="text-[var(--color-mind-cyan)] font-bold mt-0.5">1.</span>
                                <span>Presioná <strong>Iniciar Monitor</strong> y aceptá el permiso de cámara</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[var(--color-mind-cyan)] font-bold mt-0.5">2.</span>
                                <span>Colocá tu dedo índice sobre la <strong>cámara trasera</strong> cubriendo también el flash</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[var(--color-mind-cyan)] font-bold mt-0.5">3.</span>
                                <span>Quedate quieto unos segundos mientras calibra</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[var(--color-mind-cyan)] font-bold mt-0.5">4.</span>
                                <span>¡Listo! Vas a ver tu pulso en tiempo real</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground/50 pt-1">
                            Funciona mejor en celular. En computadora puede no detectar señal.
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}
