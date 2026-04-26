"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Fingerprint, Mic, Camera, AlertCircle, CheckCircle2 } from "lucide-react"
import { PPGMonitor } from "@/lib/biometric/ppg-monitor"
import { BreathAudioAnalyzer } from "@/lib/audio/breath-audio-analyzer"
import type { BreathPattern } from "@/lib/types/breath-pattern"
import { Button } from "@/components/ui/button"

interface BreathDetectorProps {
    onComplete: (pattern: BreathPattern) => void
}

export function BreathDetector({ onComplete }: BreathDetectorProps) {
    const [step, setStep] = useState<"permissions" | "detecting" | "analyzing" | "completed">("permissions")
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    // Metrics state
    const [bpm, setBpm] = useState(0)
    const [breathRate, setBreathRate] = useState(0)
    const [signalQuality, setSignalQuality] = useState(0)
    const [coherence, setCoherence] = useState(0)

    const ppgRef = useRef<PPGMonitor | null>(null)
    const audioRef = useRef<BreathAudioAnalyzer | null>(null)
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        return () => {
            stopSensors()
            if (progressInterval.current) clearInterval(progressInterval.current)
        }
    }, [])

    const startSensors = async () => {
        setError(null)
        try {
            ppgRef.current = new PPGMonitor(
                { TORCH_ENABLED: true },
                {
                    onBPMUpdate: (val) => setBpm(val),
                    onSignalQuality: (val) => setSignalQuality(val),
                    onHRVUpdate: (data) => setCoherence(data.coherence),
                    onError: (err) => setError(err.message),
                }
            )

            audioRef.current = new BreathAudioAnalyzer(
                {},
                {
                    onBreathDetected: (data) => setBreathRate(data.rate),
                    onError: (err) => console.warn("Audio error:", err),
                }
            )

            await ppgRef.current.start()
            await audioRef.current.start()

            setStep("detecting")
            startProgress()

        } catch (err: unknown) {
            const e = err as Error
            setError(e.message || "Error al iniciar sensores. Verifica los permisos.")
            stopSensors()
        }
    }

    const stopSensors = () => {
        if (ppgRef.current) { ppgRef.current.stop(); ppgRef.current = null }
        if (audioRef.current) { audioRef.current.stop(); audioRef.current = null }
    }

    const startProgress = () => {
        setProgress(0)
        const duration = 30000
        const intervalTime = 100
        const increment = 100 / (duration / intervalTime)

        progressInterval.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    finishDetection()
                    return 100
                }
                return prev + increment
            })
        }, intervalTime)
    }

    const finishDetection = () => {
        if (progressInterval.current) clearInterval(progressInterval.current)
        setStep("analyzing")
        stopSensors()

        const finalPattern: BreathPattern = {
            heartRate: bpm || 70,
            breathRate: breathRate || 15,
            variability: coherence || 50,
        }

        setTimeout(() => {
            setStep("completed")
            onComplete(finalPattern)
        }, 1500)
    }

    // Pulse duration derived from breath rate — used inline to avoid Variants TS issues with framer-motion v12
    const breathCycleDuration = breathRate > 0 ? 60 / breathRate : 4
    const heartCycleDuration = bpm > 0 ? 60 / bpm : 1

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto min-h-[400px]">
            <AnimatePresence mode="wait">

                {/* STEP 1: PERMISSIONS */}
                {step === "permissions" && (
                    <motion.div
                        key="permissions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center space-y-6"
                    >
                        <div className="relative w-32 h-32 mx-auto flex items-center justify-center bg-secondary/30 rounded-full">
                            <Fingerprint className="w-16 h-16 text-primary" />
                            <div className="absolute top-0 right-0 p-2 bg-background rounded-full border border-border">
                                <Camera className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="absolute bottom-0 left-0 p-2 bg-background rounded-full border border-border">
                                <Mic className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-2">Descubrí tu Patrón</h2>
                            <p className="text-muted-foreground">
                                Para analizar tu estado, necesitamos usar tu cámara (para el pulso) y micrófono (para la respiración).
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button size="lg" onClick={startSensors} className="w-full">
                            Comenzar Escaneo
                        </Button>
                        <p className="text-xs text-muted-foreground/60 w-3/4 mx-auto">
                            Los datos se procesan en tu dispositivo y solo se comparte un patrón anónimo.
                        </p>
                    </motion.div>
                )}

                {/* STEP 2: DETECTING */}
                {step === "detecting" && (
                    <motion.div
                        key="detecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center space-y-8 w-full"
                    >
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Breathing glow ring — inline animation, no Variants */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: breathCycleDuration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                            />
                            {/* Heart pulse ring — inline animation */}
                            <motion.div
                                animate={bpm > 0 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                transition={{
                                    duration: heartCycleDuration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="w-48 h-48 bg-background border-4 border-primary/50 rounded-full flex flex-col items-center justify-center z-10 shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                            >
                                <div className="text-4xl font-mono font-bold text-foreground">
                                    {bpm > 0 ? bpm : "--"}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">BPM</div>

                                {signalQuality < 30 && (
                                    <div className="absolute bottom-8 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full animate-pulse">
                                        Mejorar contacto
                                    </div>
                                )}
                            </motion.div>

                            {/* Progress Ring */}
                            <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                                <circle
                                    cx="128" cy="128" r="120"
                                    fill="none" stroke="currentColor" strokeWidth="4"
                                    className="text-secondary opacity-20"
                                />
                                <circle
                                    cx="128" cy="128" r="120"
                                    fill="none" stroke="currentColor" strokeWidth="4"
                                    className="text-primary transition-all duration-300"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        <div className="grid grid-cols-2 gap-8 w-full max-w-xs text-center">
                            <div>
                                <div className="text-2xl font-bold">{breathRate || "-"}</div>
                                <div className="text-xs text-muted-foreground">RESP/MIN</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{coherence ? Math.round(coherence) : "-"}%</div>
                                <div className="text-xs text-muted-foreground">COHERENCIA</div>
                            </div>
                        </div>

                        <p className="text-sm text-center text-muted-foreground animate-pulse">
                            Mantené tu dedo sobre la cámara...
                        </p>
                    </motion.div>
                )}

                {/* STEP 3: ANALYZING */}
                {step === "analyzing" && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-12 space-y-6"
                    >
                        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <h2 className="text-xl font-medium">Analizando patrones...</h2>
                    </motion.div>
                )}

                {/* STEP 4: COMPLETED */}
                {step === "completed" && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-8 space-y-6 text-center"
                    >
                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold">¡Patrón Detectado!</h2>
                        <p className="text-muted-foreground">Redirigiendo al mapa global...</p>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    )
}
