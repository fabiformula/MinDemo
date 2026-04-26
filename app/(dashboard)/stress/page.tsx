"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Wind, Anchor, Activity, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function StressPage() {
    const [stressLevel, setStressLevel] = useState<number | null>(null)
    const [activeMode, setActiveMode] = useState<"assess" | "relief" | "summary">("assess")
    const [reliefProgress, setReliefProgress] = useState(0)

    // Iniciar alivio simulado
    const startRelief = () => {
        setActiveMode("relief")
        let progress = 0
        const interval = setInterval(() => {
            progress += 2
            setReliefProgress(progress)
            if (progress >= 100) {
                clearInterval(interval)
                setTimeout(() => setActiveMode("summary"), 1000)
            }
        }, 100) // 5 segundos total
    }

    // Vista 1: Evaluación Inicial ("Check-in")
    if (activeMode === "assess") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Zona de Alivio SOS</h1>
                    <p className="text-xl text-muted-foreground">¿Cómo te sientes en este momento?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl px-4">
                    {[
                        { level: 30, text: "Levemente Tenso", color: "hover:border-yellow-500 hover:bg-yellow-500/5", icon: Activity },
                        { level: 60, text: "Estresado", color: "hover:border-orange-500 hover:bg-orange-500/5", icon: AlertCircle },
                        { level: 90, text: "Abrumado / Pánico", color: "hover:border-red-500 hover:bg-red-500/5", icon: Activity },
                    ].map((item) => (
                        <Card
                            key={item.level}
                            className={cn("cursor-pointer transition-all border-2", item.color)}
                            onClick={() => { setStressLevel(item.level); startRelief(); }}
                        >
                            <CardHeader className="text-center">
                                <item.icon className="w-8 h-8 mx-auto mb-2 opacity-70" />
                                <CardTitle className="text-lg">{item.text}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // Vista 2: Proceso de Alivio Activado
    if (activeMode === "relief") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-12 animate-in fade-in duration-700">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-light">Exhala suavemente...</h2>
                    <p className="text-muted-foreground">Sincronizando biorritmo para reducir cortisol.</p>
                </div>

                {/* Visualizador de Calma */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Círculo que se achica a medida que progreso aumenta (simulando reducción estrés) */}
                    <div
                        className="absolute rounded-full bg-red-500/20 transition-all duration-1000 ease-in-out"
                        style={{ width: `${Math.max(20, 100 - reliefProgress)}%`, height: `${Math.max(20, 100 - reliefProgress)}%` }}
                    />
                    {/* Círculo de calma creciendo */}
                    <div
                        className="absolute rounded-full bg-blue-500/20 transition-all duration-1000 ease-in-out"
                        style={{ width: `${reliefProgress}%`, height: `${reliefProgress}%` }}
                    />
                    <div className="z-10 text-4xl font-bold font-mono">
                        {Math.round(reliefProgress)}%
                    </div>
                </div>

                <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
                        <span>Estrés Detectado</span>
                        <span>Objetivo: Calma</span>
                    </div>
                    <Progress value={reliefProgress} className="h-2" />
                </div>
            </div>
        )
    }

    // Vista 3: Resumen / Resultado
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-8 animate-in scale-in-95 duration-500">
            <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>

            <div className="text-center space-y-4 max-w-lg">
                <h1 className="text-3xl font-bold">Sesión Completada</h1>
                <p className="text-muted-foreground text-lg">
                    Tu coherencia cardíaca ha subido un <span className="text-green-500 font-bold">34%</span>.
                    Has salido de la zona de estrés agudo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Ritmo Cardíaco</CardTitle>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            95 <span className="text-muted-foreground/50 text-sm">→</span> 72 BPM
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">VFC (Calidad)</CardTitle>
                        <div className="text-2xl font-bold flex items-center gap-2 text-green-500">
                            +12ms <span className="text-xs bg-green-500/10 px-2 py-1 rounded-full">Mejora</span>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setActiveMode("assess")}>Nueva Evaluación</Button>
                <Button onClick={() => window.location.href = '/home'}>Volver al Dashboard</Button>
            </div>
        </div>
    )
}
