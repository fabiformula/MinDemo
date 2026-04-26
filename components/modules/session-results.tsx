"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts"
import { Button } from "@/components/ui/button"
import { Trophy, Clock, TrendingUp, RotateCcw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { SyncDataPoint } from "@/lib/types/breath-pattern"

interface SessionResultsProps {
    duration: number            // seconds
    avgSync: number             // 0-100
    syncData: SyncDataPoint[]
    onNewSession?: () => void
}

export function SessionResults({ duration, avgSync, syncData, onNewSession }: SessionResultsProps) {
    // Chart data
    const chartData = useMemo(() => {
        if (!syncData.length) return []
        const start = syncData[0].timestamp
        return syncData.map(d => ({
            time: Math.round((d.timestamp - start) / 1000),
            sync: d.syncPercentage,
            br1: d.user1BreathRate,
            br2: d.user2BreathRate,
        }))
    }, [syncData])

    // Best moment
    const bestMoment = useMemo(() => {
        if (!syncData.length) return { sync: 0, time: 0 }
        const best = syncData.reduce((max, d) => d.syncPercentage > max.syncPercentage ? d : max, syncData[0])
        const start = syncData[0].timestamp
        return { sync: best.syncPercentage, time: Math.round((best.timestamp - start) / 1000) }
    }, [syncData])

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    const syncColor = avgSync >= 70 ? "#00d9ff" : avgSync >= 40 ? "#7c5cfc" : "#ff6b9d"

    return (
        <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
            {/* Big sync result */}
            <div className="text-center py-6">
                <div className="text-6xl font-bold mb-2" style={{ color: syncColor }}>
                    {avgSync}%
                </div>
                <div className="text-muted-foreground">Sincronía promedio</div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-xl border p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-[var(--color-mind-cyan)]" />
                    <div className="text-xl font-bold">{formatTime(duration)}</div>
                    <div className="text-xs text-muted-foreground">Duración</div>
                </div>
                <div className="bg-card rounded-xl border p-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                    <div className="text-xl font-bold">{bestMoment.sync}%</div>
                    <div className="text-xs text-muted-foreground">Mejor momento</div>
                </div>
                <div className="bg-card rounded-xl border p-4 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
                    <div className="text-xl font-bold">{formatTime(bestMoment.time)}</div>
                    <div className="text-xs text-muted-foreground">En minuto</div>
                </div>
            </div>

            {/* Sync chart */}
            {chartData.length > 0 && (
                <div className="bg-card rounded-xl border p-4">
                    <h3 className="text-sm font-medium mb-4 text-muted-foreground">Evolución de sincronía</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="syncGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10, fill: "#8b9ec7" }}
                                tickFormatter={(v) => formatTime(v)}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: "#8b9ec7" }}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                                contentStyle={{ background: "#111638", border: "1px solid rgba(0,217,255,0.2)", borderRadius: 8, fontSize: 12 }}
                                labelFormatter={(v) => `${formatTime(v as number)}`}
                                formatter={(value) => [`${value ?? 0}%`, "Sincronía"]}
                            />
                            <Area type="monotone" dataKey="sync" stroke="#00d9ff" fill="url(#syncGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
                {onNewSession && (
                    <Button size="lg" onClick={onNewSession} className="px-8">
                        <RotateCcw className="w-4 h-4 mr-2" /> Nueva sesión
                    </Button>
                )}
                <Link href="/sync">
                    <Button size="lg" variant="outline" className="px-8">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                </Link>
            </div>
        </div>
    )
}
