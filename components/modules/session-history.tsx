"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { sessionFromRow, type SyncSession } from "@/lib/types/breath-pattern"
import { Clock, Percent, ChevronDown, ChevronUp } from "lucide-react"

export function SessionHistory() {
    const [sessions, setSessions] = useState<SyncSession[]>([])
    const [expanded, setExpanded] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSessions = async () => {
            const supabase = createClient()
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return

            const { data } = await supabase
                .from("sync_sessions")
                .select("*")
                .or(`user1_id.eq.${userData.user.id},user2_id.eq.${userData.user.id}`)
                .not("ended_at", "is", null)
                .order("created_at", { ascending: false })
                .limit(20)

            if (data) {
                setSessions(data.map(sessionFromRow))
            }
            setLoading(false)
        }

        fetchSessions()
    }, [])

    const formatDuration = (sec: number | null) => {
        if (!sec) return "--:--"
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    }

    const getSyncColor = (pct: number | null) => {
        if (!pct) return "#8b9ec7"
        if (pct >= 70) return "#00d9ff"
        if (pct >= 40) return "#7c5cfc"
        return "#ff6b9d"
    }

    if (loading) {
        return <div className="text-center text-muted-foreground py-8 animate-pulse">Cargando historial...</div>
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <p>Aún no tenés sesiones completadas.</p>
                <p className="text-sm mt-1">¡Creá una sesión e invitá a tu pareja!</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Sesiones anteriores</h3>
            {sessions.map(session => {
                const isExpanded = expanded === session.id
                return (
                    <div
                        key={session.id}
                        className="bg-card rounded-lg border overflow-hidden transition-all"
                    >
                        <button
                            className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left"
                            onClick={() => setExpanded(isExpanded ? null : session.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{
                                        background: `${getSyncColor(session.avgSyncPercentage)}15`,
                                        color: getSyncColor(session.avgSyncPercentage),
                                    }}
                                >
                                    {session.avgSyncPercentage ?? 0}%
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{formatDate(session.createdAt)}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {formatDuration(session.durationSeconds)}
                                    </div>
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>

                        {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2 animate-fade-in-up">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: getSyncColor(session.avgSyncPercentage) }}>
                                            {session.avgSyncPercentage ?? 0}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Sincronía</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold">{formatDuration(session.durationSeconds)}</div>
                                        <div className="text-xs text-muted-foreground">Duración</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-muted-foreground">{session.sessionCode}</div>
                                        <div className="text-xs text-muted-foreground">Código</div>
                                    </div>
                                </div>

                                {/* Mini sparkline using SVG */}
                                {session.syncData.length > 0 && (
                                    <div className="h-12 w-full">
                                        <svg viewBox={`0 0 ${session.syncData.length} 100`} className="w-full h-full" preserveAspectRatio="none">
                                            <polyline
                                                fill="none"
                                                stroke={getSyncColor(session.avgSyncPercentage)}
                                                strokeWidth="2"
                                                points={session.syncData.map((d, i) => `${i},${100 - d.syncPercentage}`).join(" ")}
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
