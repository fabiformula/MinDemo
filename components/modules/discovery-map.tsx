"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import type { BreathPattern, ActivePatternWithSimilarity } from "@/lib/types/breath-pattern"
import { findMatches } from "@/lib/sync/pattern-matcher"
import { Users, MapPin, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import("react-leaflet").then(m => m.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import("react-leaflet").then(m => m.TileLayer),
    { ssr: false }
)
const CircleMarker = dynamic(
    () => import("react-leaflet").then(m => m.CircleMarker),
    { ssr: false }
)
const Popup = dynamic(
    () => import("react-leaflet").then(m => m.Popup),
    { ssr: false }
)

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Demo patterns from around the world
// ═══════════════════════════════════════════════════════════

const MOCK_PATTERNS = [
    { id: "1", userId: "demo-1", heartRate: 68, breathRate: 14, variability: 72, location: { lat: 48.856, lng: 2.352, city: "París", country: "FR" }, createdAt: "", expiresAt: "" },
    { id: "2", userId: "demo-2", heartRate: 75, breathRate: 16, variability: 58, location: { lat: 40.416, lng: -3.703, city: "Madrid", country: "ES" }, createdAt: "", expiresAt: "" },
    { id: "3", userId: "demo-3", heartRate: 62, breathRate: 12, variability: 85, location: { lat: 35.689, lng: 139.691, city: "Tokio", country: "JP" }, createdAt: "", expiresAt: "" },
    { id: "4", userId: "demo-4", heartRate: 78, breathRate: 18, variability: 45, location: { lat: 40.712, lng: -74.006, city: "New York", country: "US" }, createdAt: "", expiresAt: "" },
    { id: "5", userId: "demo-5", heartRate: 70, breathRate: 15, variability: 67, location: { lat: -33.868, lng: 151.209, city: "Sydney", country: "AU" }, createdAt: "", expiresAt: "" },
    { id: "6", userId: "demo-6", heartRate: 65, breathRate: 13, variability: 78, location: { lat: 19.432, lng: -99.133, city: "Ciudad de México", country: "MX" }, createdAt: "", expiresAt: "" },
    { id: "7", userId: "demo-7", heartRate: 72, breathRate: 14, variability: 70, location: { lat: -22.906, lng: -43.172, city: "Río de Janeiro", country: "BR" }, createdAt: "", expiresAt: "" },
    { id: "8", userId: "demo-8", heartRate: 80, breathRate: 19, variability: 40, location: { lat: 28.613, lng: 77.209, city: "Nueva Delhi", country: "IN" }, createdAt: "", expiresAt: "" },
    { id: "9", userId: "demo-9", heartRate: 66, breathRate: 11, variability: 88, location: { lat: 13.756, lng: 100.501, city: "Bangkok", country: "TH" }, createdAt: "", expiresAt: "" },
    { id: "10", userId: "demo-10", heartRate: 74, breathRate: 16, variability: 55, location: { lat: 51.507, lng: -0.127, city: "Londres", country: "GB" }, createdAt: "", expiresAt: "" },
    { id: "11", userId: "demo-11", heartRate: 69, breathRate: 14, variability: 74, location: { lat: 52.520, lng: 13.405, city: "Berlín", country: "DE" }, createdAt: "", expiresAt: "" },
    { id: "12", userId: "demo-12", heartRate: 71, breathRate: 15, variability: 62, location: { lat: -34.603, lng: -58.381, city: "Buenos Aires", country: "AR" }, createdAt: "", expiresAt: "" },
    { id: "13", userId: "demo-13", heartRate: 67, breathRate: 13, variability: 80, location: { lat: 37.774, lng: -122.419, city: "San Francisco", country: "US" }, createdAt: "", expiresAt: "" },
    { id: "14", userId: "demo-14", heartRate: 76, breathRate: 17, variability: 50, location: { lat: 55.755, lng: 37.617, city: "Moscú", country: "RU" }, createdAt: "", expiresAt: "" },
    { id: "15", userId: "demo-15", heartRate: 63, breathRate: 12, variability: 90, location: { lat: 1.352, lng: 103.819, city: "Singapur", country: "SG" }, createdAt: "", expiresAt: "" },
]

interface DiscoveryMapProps {
    myPattern: BreathPattern
    myUserId?: string
}

export function DiscoveryMap({ myPattern, myUserId }: DiscoveryMapProps) {
    const [leafletReady, setLeafletReady] = useState(false)

    // Import leaflet CSS on mount
    useEffect(() => {
        import("leaflet/dist/leaflet.css" as string).then(() => setLeafletReady(true)).catch(() => setLeafletReady(true))

        // Fix Leaflet default icons
        import("leaflet").then(L => {
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })
        })
    }, [])

    // Use mock data with pattern matching
    const matches = useMemo(() => {
        return findMatches(myPattern, MOCK_PATTERNS, myUserId)
    }, [myPattern, myUserId])

    const totalCount = matches.length

    const getColor = (similarity: number): string => {
        if (similarity >= 80) return "#00d9ff"      // cyan — very similar
        if (similarity >= 60) return "#7c5cfc"      // purple
        if (similarity >= 40) return "#ff6b9d"      // coral
        return "#8b9ec7"                             // muted
    }

    if (!leafletReady) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-card rounded-xl">
                <div className="animate-pulse text-muted-foreground">Cargando mapa...</div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* Header counter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--color-mind-cyan)]" />
                    <span className="text-lg font-semibold">
                        {totalCount} {totalCount === 1 ? "persona" : "personas"} respirando como vos ahora
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Demo — datos simulados
                </div>
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-border h-[500px] relative">
                <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={12}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {matches.map((match) => (
                        <CircleMarker
                            key={match.id}
                            center={[match.location.lat, match.location.lng]}
                            radius={8 + (match.similarity / 20)}
                            pathOptions={{
                                color: getColor(match.similarity),
                                fillColor: getColor(match.similarity),
                                fillOpacity: 0.6,
                                weight: 2,
                            }}
                        >
                            <Popup>
                                <div className="p-1 min-w-[180px]" style={{ color: "#e8f4f8" }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <MapPin className="w-3.5 h-3.5" style={{ color: "#00d9ff" }} />
                                        <span className="font-semibold text-sm">
                                            {match.location.city || "Ubicación"}{match.location.country ? `, ${match.location.country}` : ""}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs" style={{ color: "#8b9ec7" }}>
                                        <div className="flex justify-between">
                                            <span>Similitud</span>
                                            <span className="font-bold" style={{ color: getColor(match.similarity) }}>
                                                {match.similarity}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>BPM</span>
                                            <span>{match.heartRate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Resp/min</span>
                                            <span>{match.breathRate}</span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#00d9ff" }} />
                    Alta (80%+)
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#7c5cfc" }} />
                    Media (60%+)
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#ff6b9d" }} />
                    Baja (40%+)
                </div>
            </div>
        </div>
    )
}
