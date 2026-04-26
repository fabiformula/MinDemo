"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Brain, Zap, Moon, Activity, Calendar, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function DashboardHomePage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Buenos días, Alex</h1>
                <p className="text-muted-foreground">Tu sincronización neuronal está al 85% hoy.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minutos Meditados</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">+14% desde semana pasada</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nivel de Estrés</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Bajo</div>
                        <p className="text-xs text-muted-foreground">VFC promedio: 65ms</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Calidad de Sueño</CardTitle>
                        <Moon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">7h 42m</div>
                        <p className="text-xs text-muted-foreground">82% Eficiencia</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12 Días</div>
                        <p className="text-xs text-muted-foreground font-bold text-orange-500">¡Sigue así!</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Progression Card */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Tu Progreso Semanal</CardTitle>
                        <CardDescription>
                            Has completado 8 sesiones esta semana.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-end justify-between px-4 gap-2">
                            {[35, 45, 25, 60, 75, 50, 65].map((h, i) => (
                                <div key={i} className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative group">
                                    <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-primary rounded-t-sm group-hover:bg-primary/80"></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-4 mt-2 text-xs text-muted-foreground">
                            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Recommended Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Para ti hoy</CardTitle>
                        <CardDescription>Recomendaciones basadas en tu VFC matutino.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Coherencia Cardíaca (10 min)</span>
                                <span className="text-xs text-muted-foreground">Pendiente</span>
                            </div>
                            <Progress value={0} className="h-2" />
                            <Button size="sm" className="w-full" asChild>
                                <Link href="/meditation">Comenzar</Link>
                            </Button>
                        </div>

                        <div className="space-y-2 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Deep Work (Sprint 25 min)</span>
                                <span className="text-xs text-muted-foreground">Agendado 15:00</span>
                            </div>
                            <Progress value={0} className="h-2 bg-muted" />
                            <Button size="sm" variant="outline" className="w-full" asChild>
                                <Link href="/performance">Ver Detalles</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
