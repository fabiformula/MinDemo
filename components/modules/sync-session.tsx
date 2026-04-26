"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BreathAudioAnalyzer } from "@/lib/audio/breath-audio-analyzer"
import { calculateSync } from "@/lib/sync/sync-calculator"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Square, Timer } from "lucide-react"
import type { SyncDataPoint } from "@/lib/types/breath-pattern"

interface SyncSessionProps {
    sessionId: string
    sessionCode: string
    userId: string
    partnerId: string
    onEnd: (data: { duration: number; avgSync: number; syncData: SyncDataPoint[] }) => void
}

export function SyncSession({ sessionId, sessionCode, userId, partnerId, onEnd }: SyncSessionProps) {
    const [myBreathRate, setMyBreathRate] = useState(0)
    const [myHeartRate] = useState(72) // PPG optional in sync, use default
    const [partnerBreathRate, setPartnerBreathRate] = useState(0)
    const [partnerHeartRate, setPartnerHeartRate] = useState(72)
    const [syncPercentage, setSyncPercentage] = useState(0)
    const [elapsedSec, setElapsedSec] = useState(0)

    const breathRef = useRef<BreathAudioAnalyzer | null>(null)
    const syncDataRef = useRef<SyncDataPoint[]>([])
    const syncHistoryRef = useRef<number[]>([])
    const startTimeRef = useRef(Date.now())

    const cleanup = useCallback(() => {
        if (breathRef.current) { breathRef.current.stop(); breathRef.current = null }
    }, [])

    useEffect(() => {
        const supabase = createClient()

        // Start breath detection
        const breath = new BreathAudioAnalyzer({}, {
            onBreathDetected: (data) => setMyBreathRate(data.rate),
        })
        breathRef.current = breath
        breath.start().catch(console.error)

        // Timer
        const timerInterval = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 1000)

        // Publish my data every 2 seconds
        const publishInterval = setInterval(async () => {
            const br = breathRef.current?.breathRate ?? 0
            await supabase.from("sync_realtime").insert({
                session_id: sessionId,
                user_id: userId,
                breath_rate: br,
                heart_rate: myHeartRate,
            })
        }, 2000)

        // Subscribe to partner's data via Supabase Realtime
        const channel = supabase
            .channel(`sync-${sessionCode}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "sync_realtime",
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const row = payload.new as { user_id: string; breath_rate: number; heart_rate: number }
                    if (row.user_id === partnerId) {
                        setPartnerBreathRate(row.breath_rate)
                        setPartnerHeartRate(row.heart_rate)
                    }
                }
            )
            .subscribe()

        // Calculate sync every 2 seconds
        const syncInterval = setInterval(() => {
            const myBr = breathRef.current?.breathRate ?? 0
            // We use the latest state values from refs/state
            const sync = calculateSync(
                { breathRate: myBr, heartRate: myHeartRate, timestamp: Date.now() },
                { breathRate: partnerBreathRate, heartRate: partnerHeartRate, timestamp: Date.now() }
            )
            setSyncPercentage(sync)
            syncHistoryRef.current.push(sync)

            syncDataRef.current.push({
                timestamp: Date.now(),
                syncPercentage: sync,
                user1BreathRate: myBr,
                user2BreathRate: partnerBreathRate,
            })
        }, 2000)

        return () => {
            cleanup()
            clearInterval(timerInterval)
            clearInterval(publishInterval)
            clearInterval(syncInterval)
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, userId, partnerId, sessionCode])

    // Update sync calculation when partner data changes
    useEffect(() => {
        if (partnerBreathRate > 0 && myBreathRate > 0) {
            const sync = calculateSync(
                { breathRate: myBreathRate, heartRate: myHeartRate, timestamp: Date.now() },
                { breathRate: partnerBreathRate, heartRate: partnerHeartRate, timestamp: Date.now() }
            )
            setSyncPercentage(sync)
        }
    }, [partnerBreathRate, partnerHeartRate, myBreathRate, myHeartRate])

    const handleEndSession = async () => {
        cleanup()
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const history = syncHistoryRef.current
        const avgSync = history.length > 0
            ? Math.round(history.reduce((a, b) => a + b, 0) / history.length)
            : 0

        // Update session in Supabase
        const supabase = createClient()
        await supabase
            .from("sync_sessions")
            .update({
                ended_at: new Date().toISOString(),
                duration_seconds: duration,
                avg_sync_percentage: avgSync,
                sync_data: syncDataRef.current,
            })
            .eq("id", sessionId)

        onEnd({ duration, avgSync, syncData: syncDataRef.current })
    }

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0")
        const s = (sec % 60).toString().padStart(2, "0")
        return `${m}:${s}`
    }

    // Breathing circle speeds
    const mySpeed = myBreathRate > 0 ? 60 / myBreathRate : 4
    const partnerSpeed = partnerBreathRate > 0 ? 60 / partnerBreathRate : 4

    // Sync color
    const syncColor = syncPercentage >= 70 ? "#00d9ff" : syncPercentage >= 40 ? "#7c5cfc" : "#ff6b9d"

    return (
        <div className="flex flex-col items-center gap-8 py-4 animate-fade-in-up">
            {/* Timer */}
            <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span className="text-lg font-mono">{formatTime(elapsedSec)}</span>
            </div>

            {/* Overlapping circles */}
            <div className="relative w-72 h-72 flex items-center justify-center">
                {/* My circle (cyan) */}
                <div
                    className="absolute w-44 h-44 rounded-full border-2 border-[var(--color-mind-cyan)]/50"
                    style={{
                        left: "10%",
                        animation: `breath-expand ${mySpeed}s ease-in-out infinite`,
                        boxShadow: "0 0 40px rgba(0, 217, 255, 0.15)",
                        background: "radial-gradient(circle, rgba(0,217,255,0.08) 0%, transparent 70%)",
                    }}
                />

                {/* Partner circle (coral) */}
                <div
                    className="absolute w-44 h-44 rounded-full border-2 border-[var(--color-mind-coral)]/50"
                    style={{
                        right: "10%",
                        animation: `breath-expand ${partnerSpeed}s ease-in-out infinite`,
                        boxShadow: "0 0 40px rgba(255, 107, 157, 0.15)",
                        background: "radial-gradient(circle, rgba(255,107,157,0.08) 0%, transparent 70%)",
                    }}
                />

                {/* Center sync percentage */}
                <div className="relative z-10 text-center">
                    <div
                        className="text-5xl font-bold transition-all duration-500"
                        style={{ color: syncColor }}
                    >
                        {syncPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">sincronía</div>
                </div>
            </div>

            {/* Labels */}
            <div className="flex items-center justify-center gap-12 w-full">
                <div className="text-center">
                    <div className="text-sm font-medium text-[var(--color-mind-cyan)]">Vos</div>
                    <div className="text-2xl font-bold">{myBreathRate || "--"}</div>
                    <div className="text-xs text-muted-foreground">resp/min</div>
                </div>
                <div className="text-center">
                    <div className="text-sm font-medium text-[var(--color-mind-coral)]">Pareja</div>
                    <div className="text-2xl font-bold">{partnerBreathRate || "--"}</div>
                    <div className="text-xs text-muted-foreground">resp/min</div>
                </div>
            </div>

            {/* End session */}
            <Button
                variant="outline"
                size="lg"
                onClick={handleEndSession}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
                <Square className="w-4 h-4 mr-2" /> Terminar Sesión
            </Button>
        </div>
    )
}
